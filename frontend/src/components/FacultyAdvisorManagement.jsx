import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import * as XLSX from 'xlsx'
import SpotlightBackground from './ui/SpotlightBackground'

const FacultyAdvisorManagement = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef(null)
  const [adminUser, setAdminUser] = useState({
    name: 'Admin User',
    role: 'Admin',
    profilePicture: '',
  })
  const [facultyList, setFacultyList] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [showImportModal, setShowImportModal] = useState(false)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [importRows, setImportRows] = useState([])
  const [importFileName, setImportFileName] = useState('')
  const [importError, setImportError] = useState('')
  const [importSubmitting, setImportSubmitting] = useState(false)
  const [importSummary, setImportSummary] = useState(null)
  const fileInputRef = useRef(null)

  const fetchFaculty = async () => {
    try {
      setLoading(true)
      setFetchError('')
      const { data } = await api.get('/admin/faculty')
      setFacultyList(data)
    } catch {
      setFetchError('Failed to load faculty data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const syncAdminUser = () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
        setAdminUser({
          name: storedUser.name || 'Admin User',
          role: storedUser.role || 'Admin',
          profilePicture: storedUser.profilePicture || '',
        })
      } catch {
        setAdminUser({ name: 'Admin User', role: 'Admin', profilePicture: '' })
      }
    }

    syncAdminUser()
    window.addEventListener('storage', syncAdminUser)
    return () => window.removeEventListener('storage', syncAdminUser)
  }, [])

  useEffect(() => {
    fetchFaculty()
  }, [])

  const normalizeHeaderKey = (key) => {
    if (!key) return ''
    return String(key)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
  }

  const getRowValue = (row, candidateKeys) => {
    for (const key of candidateKeys) {
      if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
        return String(row[key]).trim()
      }
    }

    const normalizedMap = Object.entries(row).reduce((acc, [k, v]) => {
      acc[normalizeHeaderKey(k)] = v
      return acc
    }, {})

    for (const key of candidateKeys) {
      const value = normalizedMap[normalizeHeaderKey(key)]
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value).trim()
      }
    }

    return ''
  }

  const parseFacultyExcelFile = async (file) => {
    const allowed = /\.(xlsx|xls)$/i
    if (!allowed.test(file.name)) {
      throw new Error('Please upload a valid Excel file (.xlsx or .xls).')
    }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    if (!firstSheetName) {
      throw new Error('The uploaded file has no worksheet.')
    }

    const worksheet = workbook.Sheets[firstSheetName]
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

    const parsed = rows
      .map((row, index) => {
        const serialRaw = getRowValue(row, ['S.No', 'S No', 'SNo', 'Serial Number', 'SerialNo'])
        const serialNumber = Number(serialRaw) || index + 1

        return {
          serialNumber,
          name: getRowValue(row, ['Name *', 'Name']),
          email: getRowValue(row, ['Email *', 'Email']),
          employeeId: getRowValue(row, ['Employee ID *', 'Employee ID', 'EmployeeId']),
          department: getRowValue(row, ['Department']),
          office: getRowValue(row, ['Office Details', 'Office']),
          phone: getRowValue(row, ['Phone', 'Phone Number', 'Mobile']),
        }
      })
      .filter(
        (row) =>
          row.name || row.email || row.employeeId || row.department || row.office || row.phone
      )

    return parsed
  }

  const handleFileSelect = async (file) => {
    if (!file) return
    setImportError('')
    setImportSummary(null)

    try {
      const parsedRows = await parseFacultyExcelFile(file)
      if (parsedRows.length === 0) {
        throw new Error('No faculty rows were found in the uploaded file.')
      }
      setImportRows(parsedRows)
      setImportFileName(file.name)
    } catch (err) {
      setImportRows([])
      setImportFileName('')
      setImportError(err.message || 'Failed to parse Excel file.')
    }
  }

  const handleImportConfirm = async () => {
    if (importRows.length === 0) {
      setImportError('Please upload a faculty Excel sheet before confirming import.')
      return
    }

    try {
      setImportSubmitting(true)
      setImportError('')
      const { data } = await api.post('/admin/faculty/bulk-import', {
        rows: importRows,
      })

      setImportSummary(data)
      await fetchFaculty()
    } catch (err) {
      setImportError(err.response?.data?.message || 'Bulk import failed. Please try again.')
    } finally {
      setImportSubmitting(false)
    }
  }

  const resetImportModal = () => {
    setShowImportModal(false)
    setIsDraggingFile(false)
    setImportRows([])
    setImportFileName('')
    setImportError('')
    setImportSummary(null)
    setImportSubmitting(false)
  }

  const filteredFaculty = facultyList.filter((f) => {
    const q = searchQuery.toLowerCase()
    return (
      f.name.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q) ||
      (f.department || '').toLowerCase().includes(q)
    )
  })

  const initialsFromName = (name = '') => {
    return (
      name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'F'
    )
  }

  return (
    <div
      className="h-screen overflow-hidden flex font-[Inter,sans-serif]"
      style={{ backgroundColor: '#FFFBF2' }}
    >
      {/* Sidebar */}
      <aside
        className="w-[260px] flex flex-col shrink-0 h-screen sticky top-0 px-4 pt-7 pb-5"
        style={{ backgroundColor: '#000000', color: '#FFFFFF' }}
      >
        <div className="px-2 mb-9 flex items-center gap-2.5">
          <span
            className="text-white text-[1.2rem] font-bold tracking-[0.3px]"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            SAPT
          </span>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          <Link
            to="/admin_dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-white/5 font-medium text-[0.92rem]"
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
            <span>Dashboard</span>
          </Link>
          <Link
            to="/admin_student_management"
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-white/5 font-medium text-[0.92rem]"
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
            <span>Students</span>
          </Link>
          <Link
            to="/faculty_advisor_management"
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all font-semibold text-[0.92rem]"
            style={{ backgroundColor: '#f5a623', color: '#1a1a2e' }}
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path d="M12 14l9-5-9-5-9 5 9 5z" strokeLinecap="round" strokeLinejoin="round"></path>
              <path
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <path
                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
            <span>Faculty Members</span>
          </Link>
          <Link
            to="/reports_analytics"
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-white/5 font-medium text-[0.92rem]"
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
            <span>Reports</span>
          </Link>
          <Link
            to="/system_configuration"
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-white/5 font-medium text-[0.92rem]"
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                d="M10.325 4.317a1 1 0 011.35-.936l1.854.78a1 1 0 00.94 0l1.854-.78a1 1 0 011.35.936l.168 2.003a1 1 0 00.55.826l1.73.999a1 1 0 01.364 1.363l-1.02 1.767a1 1 0 000 1l1.02 1.768a1 1 0 01-.364 1.362l-1.73 1a1 1 0 00-.55.825l-.168 2.003a1 1 0 01-1.35.936l-1.854-.78a1 1 0 00-.94 0l-1.854.78a1 1 0 01-1.35-.936l-.168-2.003a1 1 0 00-.55-.826l-1.73-.999a1 1 0 01-.364-1.363l1.02-1.767a1 1 0 000-1l-1.02-1.768a1 1 0 01.364-1.362l1.73-1a1 1 0 00.55-.825l.168-2.003z"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <path
                d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
            <span>System Configuration</span>
          </Link>
        </nav>

        <div ref={profileMenuRef} className="mt-auto" style={{ position: 'relative' }}>
          <div
            style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '12px 8px 16px' }}
          ></div>

          {/* Profile Popup Menu */}
          {showProfileMenu && (
            <div
              style={{
                position: 'absolute',
                bottom: '70px',
                left: '8px',
                right: '8px',
                backgroundColor: '#000000',
                borderRadius: '12px',
                padding: '8px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                zIndex: 50,
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowProfileMenu(false)
                  navigate('/profile_settings')
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#e5e7eb',
                  fontSize: '0.88rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  fontFamily: 'inherit',
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')
                }
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg
                  className="w-[18px] h-[18px] flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
                View Profile
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowProfileMenu(false)
                  navigate('/login')
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '0.88rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  fontFamily: 'inherit',
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')
                }
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg
                  className="w-[18px] h-[18px] flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
                Logout
              </button>
            </div>
          )}

          <div
            className="flex items-center gap-2.5 p-2 rounded-[10px] cursor-pointer hover:bg-white/[0.07] transition-colors"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            {adminUser.profilePicture ? (
              <img
                src={adminUser.profilePicture}
                alt={adminUser.name || 'Admin'}
                className="w-[38px] h-[38px] rounded-full object-cover"
              />
            ) : (
              <div
                className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-[0.95rem]"
                style={{
                  background: 'linear-gradient(135deg, #f5a623, #f7b731)',
                  color: '#1a1a2e',
                }}
              >
                {initialsFromName(adminUser.name)}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[0.9rem] font-semibold text-white">
                {adminUser.name || 'Admin User'}
              </span>
              <span className="text-[0.78rem] text-[#9ca3af]">({adminUser.role || 'Admin'})</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: '#f7f4eb', fontFamily: 'Poppins, sans-serif' }}
      >
        <SpotlightBackground className="admin-spotlight-surface">
          {/* Header */}
          <header className="flex justify-between items-center mb-10">
            <div>
              <h1
                className="text-[#111827]"
                style={{ fontWeight: 100, fontSize: '2.05rem', lineHeight: 1.15 }}
              >
                Faculty Advisor Management
              </h1>
              <p className="text-gray-500 mt-1" style={{ fontWeight: 300, fontFamily: 'inherit' }}>
                Manage faculty advisors and their assigned students.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <Link
                to="/add_faculty_advisor"
                data-testid="add-faculty-advisor-btn"
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg shadow-lg hover:opacity-90 transition-all"
                style={{ backgroundColor: '#F4AD39', color: '#111111', height: '42px' }}
              >
                <span>+</span>
                <span>Add Faculty Advisor</span>
              </Link>
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="flex items-center justify-center gap-2 px-5 text-sm rounded-lg border transition-all"
                style={{
                  border: '1.5px solid #d1d5db',
                  color: '#111827',
                  background: 'rgba(253, 247, 233, 0.48)',
                  backdropFilter: 'blur(5px) saturate(125%)',
                  WebkitBackdropFilter: 'blur(5px) saturate(125%)',
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  height: '42px',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5ab27'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(253, 247, 233, 0.48)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  upload_file
                </span>
                <span>Import from Excel</span>
              </button>
            </div>
          </header>

          <div>
            {/* Search */}
            <div className="mb-6">
              <div
                className="relative flex items-center w-full rounded-lg"
                style={{
                  border: '1.5px solid #e5e1d8',
                  background: 'rgba(253, 247, 233, 0.48)',
                  backdropFilter: 'blur(8px) saturate(125%)',
                  WebkitBackdropFilter: 'blur(8px) saturate(125%)',
                  height: '42px',
                }}
              >
                <svg
                  className="w-5 h-5 absolute left-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  ></path>
                </svg>
                <input
                  data-testid="faculty-search-input"
                  className="w-full h-full bg-transparent border-none focus:ring-0 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400"
                  style={{
                    fontFamily: 'inherit',
                    fontWeight: 100,
                    fontSize: '0.9rem',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    borderRadius: '0.5rem',
                  }}
                  placeholder="Search by name, email, or department..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Faculty Table */}
            <div
              className="rounded-[16px] overflow-hidden mb-8"
              style={{
                background: 'rgba(253, 247, 233, 0.62)',
                border: '1.5px solid #e5e1d8',
                backdropFilter: 'blur(5px) saturate(135%)',
                WebkitBackdropFilter: 'blur(5px) saturate(135%)',
                boxShadow: '0 14px 40px rgba(26, 26, 46, 0.08)',
              }}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h4
                    className="text-[#111827]"
                    style={{ fontWeight: 100, fontSize: '1.75rem', lineHeight: 1.15 }}
                  >
                    Faculty Advisors ({loading ? '…' : filteredFaculty.length})
                  </h4>
                </div>
                <div
                  className="overflow-hidden rounded-[10px]"
                  style={{ border: '1px solid #f3f4f6' }}
                >
                  <table className="w-full text-left">
                    <thead>
                      <tr
                        className="text-white text-[10px] font-bold uppercase tracking-widest"
                        style={{ backgroundColor: '#1a1a2e' }}
                      >
                        <th className="py-4 px-6" style={{ borderTopLeftRadius: '10px' }}>
                          Name
                        </th>
                        <th className="py-4 px-6">Department</th>
                        <th className="py-4 px-6">Assigned Students</th>
                        <th className="py-4 px-6">Pending Submissions</th>
                        <th className="py-4 px-6">Avg Points</th>
                        <th className="py-4 px-6">Status</th>
                        <th
                          className="py-4 px-6 text-right"
                          style={{ borderTopRightRadius: '10px' }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {loading ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-sm text-gray-400">
                            Loading faculty data...
                          </td>
                        </tr>
                      ) : fetchError ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-sm text-red-500">
                            {fetchError}
                          </td>
                        </tr>
                      ) : filteredFaculty.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-sm text-gray-400">
                            No faculty members found.
                          </td>
                        </tr>
                      ) : (
                        filteredFaculty.map((faculty, index) => {
                          const rowColor = index % 2 === 0 ? '#f5ead5' : '#fff8e2'
                          const rowCellStyle = {
                            backgroundColor: rowColor,
                            backdropFilter: 'blur(5px) saturate(125%)',
                            WebkitBackdropFilter: 'blur(5px) saturate(125%)',
                            borderBottom:
                              index === filteredFaculty.length - 1 ? 'none' : '1px solid #f0ede5',
                          }

                          return (
                            <tr key={faculty._id}>
                              <td className="py-4 px-6" style={rowCellStyle}>
                                <div className="flex items-center gap-3">
                                  {faculty.profilePicture ? (
                                    <img
                                      src={faculty.profilePicture}
                                      alt={faculty.name || 'Faculty'}
                                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                      }}
                                    />
                                  ) : (
                                    <div
                                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                                      style={{
                                        background: 'linear-gradient(135deg, #f5a623, #f7b731)',
                                        color: '#1a1a2e',
                                      }}
                                    >
                                      {initialsFromName(faculty.name)}
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-bold text-[#111827]">
                                      {faculty.name}
                                    </p>
                                    <p className="text-xs text-gray-400">{faculty.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6" style={rowCellStyle}>
                                <span className="text-sm font-medium text-gray-700">
                                  {faculty.department ? faculty.department.toUpperCase() : '—'}
                                </span>
                              </td>
                              <td className="py-4 px-6" style={rowCellStyle}>
                                <span className="text-lg font-bold text-[#111827]">
                                  {faculty.assignedStudents ?? 0}
                                </span>
                              </td>
                              <td className="py-4 px-6" style={rowCellStyle}>
                                <span className="text-lg font-bold text-[#111827]">
                                  {faculty.pendingSubmissions ?? 0}
                                </span>
                              </td>
                              <td className="py-4 px-6" style={rowCellStyle}>
                                <span className="text-lg font-bold text-[#111827]">
                                  {Number(faculty.avgPoints || 0).toFixed(2)}
                                </span>
                              </td>
                              <td className="py-4 px-6" style={rowCellStyle}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '5px 14px',
                                    borderRadius: '999px',
                                    fontSize: '0.78rem',
                                    fontWeight: '600',
                                    color: faculty.isActive ? '#16a34a' : '#6b7280',
                                    border: faculty.isActive
                                      ? '1.5px solid #bbf7d0'
                                      : '1.5px solid #e5e7eb',
                                    backgroundColor: faculty.isActive ? '#f0fdf4' : '#f9fafb',
                                  }}
                                >
                                  <span
                                    style={{
                                      width: '7px',
                                      height: '7px',
                                      borderRadius: '50%',
                                      backgroundColor: faculty.isActive ? '#16a34a' : '#9ca3af',
                                    }}
                                  ></span>
                                  {faculty.isActive ? 'Active' : 'On Leave'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right" style={rowCellStyle}>
                                <div className="flex items-center justify-end gap-2">
                                  <Link
                                    to={`/edit_faculty/${faculty._id}`}
                                    className="inline-block p-1.5 hover:opacity-70 transition-colors"
                                    style={{ color: '#F4AD39' }}
                                    title="Edit Faculty"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                      ></path>
                                    </svg>
                                  </Link>
                                  <Link
                                    to={`/assign_students/${faculty._id}`}
                                    className="inline-block p-1.5 hover:opacity-70 transition-colors"
                                    style={{ color: '#F4AD39' }}
                                    title="Assign Students"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                      ></path>
                                    </svg>
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </SpotlightBackground>
      </main>

      {showImportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '620px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 20px 45px rgba(0,0,0,0.2)',
              padding: '24px',
            }}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-[#111827]">Import Faculty from Excel</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Upload the final template file faculty_bulk_import (.xlsx/.xls).
                </p>
              </div>
              <button
                type="button"
                onClick={resetImportModal}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />

            <div
              onDragEnter={(e) => {
                e.preventDefault()
                setIsDraggingFile(true)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDraggingFile(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setIsDraggingFile(false)
              }}
              onDrop={(e) => {
                e.preventDefault()
                setIsDraggingFile(false)
                handleFileSelect(e.dataTransfer.files?.[0])
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDraggingFile ? '#F4AD39' : '#d1d5db'}`,
                backgroundColor: isDraggingFile ? '#fff8eb' : '#fafafa',
                borderRadius: '12px',
                padding: '28px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <span className="material-symbols-outlined text-4xl" style={{ color: '#F4AD39' }}>
                cloud_upload
              </span>
              <p className="text-sm font-semibold text-[#111827] mt-2">
                Drag and drop your Excel file here
              </p>
              <p className="text-xs text-gray-500 mt-1">Accepts only .xlsx or .xls files</p>
            </div>

            {importFileName && (
              <div className="mt-4 rounded-lg border border-[#fde9c3] bg-[#fffaf0] p-3">
                <p className="text-sm font-semibold text-[#8a5a00]">
                  Uploaded file: {importFileName}
                </p>
                <p className="text-sm text-[#8a5a00] mt-1">
                  Detected faculty rows: <span className="font-bold">{importRows.length}</span>
                </p>
              </div>
            )}

            {importSummary && (
              <div className="mt-4 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-4">
                <p className="text-sm text-[#111827] font-semibold">Import completed</p>
                <p className="text-sm text-[#374151] mt-2">Total rows: {importSummary.totalRows}</p>
                <p className="text-sm text-green-700 mt-1">
                  Successfully added: {importSummary.successCount}
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Failed rows: {importSummary.failedCount}
                </p>
                {importSummary.failedCount > 0 && (
                  <div className="mt-2 text-sm text-red-700">
                    <p className="font-medium">Failed serial numbers:</p>
                    <p>{importSummary.failedRows.map((f) => String(f.serialNumber)).join(', ')}</p>
                  </div>
                )}
              </div>
            )}

            {importError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {importError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={resetImportModal}
                className="px-4 py-2 rounded-lg border text-sm font-semibold"
                style={{ borderColor: '#e5e7eb', color: '#374151', backgroundColor: '#fff' }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleImportConfirm}
                disabled={importSubmitting || importRows.length === 0}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#F4AD39' }}
              >
                {importSubmitting ? 'Importing...' : 'Confirm Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FacultyAdvisorManagement
