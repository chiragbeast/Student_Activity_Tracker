import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api'

const AssignStudents = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)
  const [adminUser, setAdminUser] = useState({
    name: 'Admin User',
    role: 'Admin',
    profilePicture: '',
  })
  const [unassignedSearchQuery, setUnassignedSearchQuery] = useState('')
  const [assignedSearchQuery, setAssignedSearchQuery] = useState('')
  const [unassignedBranchFilter, setUnassignedBranchFilter] = useState('ALL')
  const [assignedBranchFilter, setAssignedBranchFilter] = useState('ALL')
  const [selectedUnassigned, setSelectedUnassigned] = useState([])
  const [selectedAssigned, setSelectedAssigned] = useState([])

  const branchOptions = ['ALL', 'CSE', 'ECE', 'EEE', 'CH', 'ME', 'CE', 'BT', 'MSE', 'PE', 'EP']

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

  const [faculty, setFaculty] = useState(null)
  const [unassignedStudents, setUnassignedStudents] = useState([])
  const [assignedStudents, setAssignedStudents] = useState([])
  const [originalAssignedIds, setOriginalAssignedIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [saving, setSaving] = useState(false)

  const deptAbbr = (dept) => {
    if (!dept) return ''
    const map = {
      'computer science': 'CSE',
      'computer science and engineering': 'CSE',
      'computer science & engineering (cse)': 'CSE',
      electronics: 'ECE',
      'electronics and communication': 'ECE',
      'electronics & communication': 'ECE',
      'electronics and communication engineering': 'ECE',
      'electronics & communication engineering (ece)': 'ECE',
      electrical: 'EEE',
      'electrical engineering': 'EEE',
      'electrical & electronics engineering (eee)': 'EEE',
      mechanical: 'ME',
      'mechanical engineering': 'ME',
      'mechanical engineering (me)': 'ME',
      civil: 'CE',
      'civil engineering': 'CE',
      'civil engineering (ce)': 'CE',
      'information technology': 'IT',
      chemical: 'CH',
      'chemical engineering': 'CH',
      'chemical engineering (ch)': 'CH',
      'biotechnology (bt)': 'BT',
      'materials science & engineering (mse)': 'MSE',
      'production engineering (pe)': 'PE',
      'engineering physics (ep)': 'EP',
    }
    return map[dept.toLowerCase().trim()] || dept.toUpperCase()
  }

  const initialsFromName = (name = '') => {
    return (
      name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'U'
    )
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/admin/faculty/${id}/students`)
        setFaculty(res.data.faculty)
        setAssignedStudents(res.data.assigned)
        setUnassignedStudents(res.data.unassigned)
        setOriginalAssignedIds(res.data.assigned.map((s) => s._id))
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Failed to load data.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const filteredUnassigned = unassignedStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(unassignedSearchQuery.toLowerCase()) ||
      (student.rollNumber || '').toLowerCase().includes(unassignedSearchQuery.toLowerCase())
    const matchesBranch =
      unassignedBranchFilter === 'ALL' || deptAbbr(student.department) === unassignedBranchFilter
    return matchesSearch && matchesBranch
  })

  const filteredAssigned = assignedStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(assignedSearchQuery.toLowerCase()) ||
      (student.rollNumber || '').toLowerCase().includes(assignedSearchQuery.toLowerCase())
    const matchesBranch =
      assignedBranchFilter === 'ALL' || deptAbbr(student.department) === assignedBranchFilter
    return matchesSearch && matchesBranch
  })

  const handleCheckUnassigned = (studentId) => {
    setSelectedUnassigned((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    )
  }

  const handleCheckAssigned = (studentId) => {
    setSelectedAssigned((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    )
  }

  const handleSelectAllUnassigned = () => {
    if (selectedUnassigned.length === filteredUnassigned.length) {
      setSelectedUnassigned([])
    } else {
      setSelectedUnassigned(filteredUnassigned.map((s) => s._id))
    }
  }

  const handleAssignStudents = () => {
    const toMove = unassignedStudents.filter((s) => selectedUnassigned.includes(s._id))
    setAssignedStudents((prev) => [...prev, ...toMove])
    setUnassignedStudents((prev) => prev.filter((s) => !selectedUnassigned.includes(s._id)))
    setSelectedUnassigned([])
  }

  const handleUnassignStudents = () => {
    const toMove = assignedStudents.filter((s) => selectedAssigned.includes(s._id))
    setUnassignedStudents((prev) => [...prev, ...toMove])
    setAssignedStudents((prev) => prev.filter((s) => !selectedAssigned.includes(s._id)))
    setSelectedAssigned([])
  }

  const handleDiscardChanges = () => {
    navigate('/faculty_advisor_management')
  }

  const handleFinalizeAssignments = async () => {
    try {
      setSaving(true)
      const currentAssignedIds = assignedStudents.map((s) => s._id)
      const currentUnassignedIds = unassignedStudents.map((s) => s._id)
      const toAssign = currentAssignedIds.filter((sid) => !originalAssignedIds.includes(sid))
      const toUnassign = currentUnassignedIds.filter((sid) => originalAssignedIds.includes(sid))
      await api.put(`/admin/faculty/${id}/assign`, { toAssign, toUnassign })
      navigate('/faculty_advisor_management')
    } catch {
      setSaving(false)
    }
  }

  return (
    <div
      className="h-screen overflow-hidden flex"
      style={{
        fontFamily: 'Poppins, sans-serif',
        background:
          'radial-gradient(circle at 8% 12%, rgba(244, 173, 57, 0.16), transparent 32%), radial-gradient(circle at 84% 90%, rgba(193, 142, 52, 0.14), transparent 36%), #f8f2e6',
      }}
    >
      {/* Sidebar */}
      <aside
        className={`admin-sidebar w-[260px] flex flex-col shrink-0 h-screen sticky top-0 px-4 pt-7 pb-5 z-50 ${isMobileMenuOpen ? 'open' : ''}`}
        style={{ backgroundColor: '#000000', color: '#FFFFFF' }}
      >
        <div className="px-2 mb-9 flex items-center justify-between">
          <span
            className="text-white text-[1.2rem] font-bold tracking-[0.3px]"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            SAPT
          </span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main
        className="flex-1 flex flex-col overflow-y-auto"
        style={{ background: 'transparent', color: '#111827' }}
      >
        {/* Dashboard Body */}
        <div className="p-8 flex flex-col gap-8">
          <section
            className="rounded-2xl px-6 py-5 border"
            style={{
              background: 'rgba(253, 247, 233, 0.6)',
              border: '1.5px solid #e8e1d2',
              backdropFilter: 'blur(5px) saturate(120%)',
              WebkitBackdropFilter: 'blur(5px) saturate(120%)',
            }}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h2 className="text-3xl" style={{ color: '#1f2937', fontWeight: 400 }}>
                Assign Students
              </h2>
            </div>
            <p className="mt-2 text-sm" style={{ color: '#6b7280', fontWeight: 300 }}>
              Review unassigned students and attach them to the selected faculty advisor.
            </p>
          </section>

          {loading ? (
            <div className="flex items-center justify-center py-20" style={{ color: '#6b7280' }}>
              Loading...
            </div>
          ) : fetchError ? (
            <div className="flex items-center justify-center py-20" style={{ color: '#ef4444' }}>
              {fetchError}
            </div>
          ) : (
            <>
              {/* Advisor Profile Header */}
              <section
                className="rounded-xl border p-6 flex flex-col md:flex-row items-center gap-6"
                style={{
                  background: 'rgba(253, 247, 233, 0.6)',
                  borderColor: '#e5e1d8',
                  backdropFilter: 'blur(5px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(5px) saturate(120%)',
                  boxShadow: '0 10px 30px rgba(26, 26, 46, 0.06)',
                }}
              >
                {faculty?.profilePicture ? (
                  <img
                    src={faculty.profilePicture}
                    alt={faculty?.name || 'Faculty'}
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #f5a623, #f7b731)',
                      color: '#1a1a2e',
                    }}
                  >
                    {initialsFromName(faculty?.name)}
                  </div>
                )}
                <div className="flex-grow text-center md:text-left">
                  <h2 className="text-2xl" style={{ color: '#111827', fontWeight: 400 }}>
                    {faculty?.name}
                  </h2>
                  <p className="text-sm mt-1" style={{ color: '#374151', fontWeight: 300 }}>
                    Office: {faculty?.office || '—'}
                  </p>
                  <p className="text-sm" style={{ color: '#374151', fontWeight: 300 }}>
                    Email: {faculty?.email || '—'}
                  </p>
                </div>
                <div
                  className="flex flex-col items-center md:items-end gap-1 px-2 py-1 rounded-lg"
                  style={{ backgroundColor: '#fcf5e7' }}
                >
                  <span className="text-3xl" style={{ color: '#111827', fontWeight: 500 }}>
                    {assignedStudents.length}
                  </span>
                  <span
                    className="text-xs uppercase tracking-wider"
                    style={{ color: '#6b7280', fontWeight: 400 }}
                  >
                    Current Students
                  </span>
                </div>
              </section>

              {/* Assignment Split Pane */}
              <div className="overflow-x-auto w-full pb-4">
                <div className="grid grid-cols-[1fr_auto_1fr] gap-6 flex-grow min-h-[500px] min-w-[800px]">
                {/* Left Pane: Unassigned Students */}
                <div
                  className={`rounded-xl flex flex-col overflow-hidden shadow-xl border`}
                  style={{
                    background: 'rgba(253, 247, 233, 0.58)',
                    borderColor: '#e5e1d8',
                    boxShadow: '0 10px 28px rgba(26, 26, 46, 0.06)',
                  }}
                >
                  <div
                    className="p-5 border-b"
                    style={{
                      borderColor: '#e5e1d8',
                      backgroundColor: '#14213d',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg`} style={{ color: '#ffffff', fontWeight: 400 }}>
                        Unassigned Students
                      </h3>
                      <span className="text-xs" style={{ color: '#ffffff', fontWeight: 400 }}>
                        {unassignedStudents.length} Total
                      </span>
                    </div>
                  </div>
                  <div
                    className="p-4 border-b"
                    style={{ backgroundColor: '#fff8e2', borderColor: '#e5e1d8' }}
                  >
                    <div className="flex justify-end gap-3">
                      <div className="relative group" style={{ width: '72%' }}>
                        <span
                          className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 transition-colors"
                          style={{ color: '#9ca3af' }}
                        >
                          search
                        </span>
                        <input
                          className="w-full border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 transition-all"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.78)',
                            borderColor: '#e5e1d8',
                            color: '#1a1a2e',
                            height: '46px',
                            fontWeight: 300,
                          }}
                          placeholder="Search by name or ID..."
                          type="text"
                          value={unassignedSearchQuery}
                          onChange={(e) => setUnassignedSearchQuery(e.target.value)}
                          onFocus={(e) => (e.target.style.borderColor = '#f5a623')}
                          onBlur={(e) => (e.target.style.borderColor = '#e5e1d8')}
                        />
                      </div>
                      <div style={{ width: '25%' }}>
                        <select
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all cursor-pointer"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.78)',
                            borderColor: '#e5e1d8',
                            color: '#1a1a2e',
                            height: '46px',
                            fontWeight: 300,
                          }}
                          value={unassignedBranchFilter}
                          onChange={(e) => setUnassignedBranchFilter(e.target.value)}
                          onFocus={(e) => (e.target.style.borderColor = '#f5a623')}
                          onBlur={(e) => (e.target.style.borderColor = '#e5e1d8')}
                        >
                          {branchOptions.map((branch) => (
                            <option key={branch} value={branch}>
                              {branch === 'ALL' ? 'All Branches' : branch}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex-grow overflow-y-auto p-0 custom-scrollbar">
                    <div>
                      {filteredUnassigned.map((student, index) => {
                        const rowColor = index % 2 === 0 ? '#f5ead5' : '#fff8e2'

                        return (
                          <div
                            key={student._id}
                            className="flex items-center gap-4 p-3 transition-colors group cursor-pointer border-b"
                            style={{ backgroundColor: rowColor, borderColor: '#f0ede5' }}
                            onClick={() => handleCheckUnassigned(student._id)}
                          >
                            <input
                              className="w-5 h-5 rounded bg-transparent cursor-pointer"
                              style={{ borderColor: '#d1d5db', accentColor: '#f5a623' }}
                              type="checkbox"
                              checked={selectedUnassigned.includes(student._id)}
                              onChange={() => {}}
                            />
                            {student.profilePicture ? (
                              <img
                                src={student.profilePicture}
                                alt={student.name}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center font-bold overflow-hidden"
                                style={{ backgroundColor: '#e5e1d8', color: '#1a1a2e' }}
                              >
                                <span className="text-sm">{initialsFromName(student.name)}</span>
                              </div>
                            )}
                            <div className="flex-grow min-w-0">
                              <p
                                className={`font-medium text-sm truncate`}
                                style={{ color: '#1a1a2e' }}
                              >
                                {student.name}
                              </p>
                              <p className="text-xs truncate" style={{ color: '#6b7280' }}>
                                {deptAbbr(student.department)} • {student.rollNumber || '—'}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div
                    className="p-3 border-t flex justify-between items-center"
                    style={{
                      backgroundColor: '#f7e7c7',
                      borderColor: '#e5e1d8',
                    }}
                  >
                    <button
                      className="text-xs hover:brightness-110 transition-colors underline"
                      style={{ color: '#111827', textDecorationColor: '#111827' }}
                      onClick={handleSelectAllUnassigned}
                    >
                      {selectedUnassigned.length === filteredUnassigned.length
                        ? 'Deselect All'
                        : 'Select All Unassigned'}
                    </button>
                    <span
                      className="text-[10px] uppercase tracking-widest font-bold"
                      style={{ color: '#111827' }}
                    >
                      {selectedUnassigned.length} selected
                    </span>
                  </div>
                </div>

                {/* Central Column: Action Buttons */}
                <div className="flex flex-col justify-center gap-4 items-center">
                  <button
                    className="w-14 h-14 rounded-xl border flex items-center justify-center hover:scale-105 active:scale-95 transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{
                      backgroundColor: '#F4AD39',
                      borderColor: '#e0a129',
                      boxShadow: '0 8px 20px rgba(244, 173, 57, 0.35)',
                    }}
                    onClick={handleAssignStudents}
                    disabled={selectedUnassigned.length === 0}
                    title="Assign selected students"
                  >
                    <span
                      className="material-symbols-outlined group-hover:translate-x-1 transition-transform"
                      style={{ color: '#111111' }}
                    >
                      arrow_forward
                    </span>
                  </button>
                  <button
                    className="w-14 h-14 rounded-xl border flex items-center justify-center active:scale-95 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.65)',
                      borderColor: '#d9d2c5',
                      backdropFilter: 'blur(5px) saturate(120%)',
                      WebkitBackdropFilter: 'blur(5px) saturate(120%)',
                    }}
                    onClick={handleUnassignStudents}
                    disabled={selectedAssigned.length === 0}
                    title="Unassign selected students"
                  >
                    <span
                      className="material-symbols-outlined group-hover:-translate-x-1 transition-transform"
                      style={{ color: '#f5a623' }}
                    >
                      arrow_back
                    </span>
                  </button>
                </div>

                {/* Right Pane: Currently Assigned Students */}
                <div
                  className={`rounded-xl flex flex-col overflow-hidden shadow-xl border`}
                  style={{
                    background: 'rgba(253, 247, 233, 0.58)',
                    borderColor: '#e5e1d8',
                    boxShadow: '0 10px 28px rgba(26, 26, 46, 0.06)',
                  }}
                >
                  <div
                    className="p-5 border-b"
                    style={{
                      borderColor: '#e5e1d8',
                      backgroundColor: '#14213d',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className={`text-lg`} style={{ color: '#ffffff', fontWeight: 400 }}>
                        Assigned to {faculty?.name}
                      </h3>
                      <span className="text-xs" style={{ color: '#ffffff', fontWeight: 400 }}>
                        {assignedStudents.length} Active
                      </span>
                    </div>
                  </div>
                  <div
                    className="p-4 border-b"
                    style={{ backgroundColor: '#fff8e2', borderColor: '#e5e1d8' }}
                  >
                    <div className="flex justify-end gap-3">
                      <div className="relative group" style={{ width: '72%' }}>
                        <span
                          className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 transition-colors"
                          style={{ color: '#9ca3af' }}
                        >
                          search
                        </span>
                        <input
                          className="w-full border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 transition-all"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.78)',
                            borderColor: '#e5e1d8',
                            color: '#1a1a2e',
                            height: '46px',
                            fontWeight: 300,
                          }}
                          placeholder="Filter assigned students..."
                          type="text"
                          value={assignedSearchQuery}
                          onChange={(e) => setAssignedSearchQuery(e.target.value)}
                          onFocus={(e) => (e.target.style.borderColor = '#f5a623')}
                          onBlur={(e) => (e.target.style.borderColor = '#e5e1d8')}
                        />
                      </div>
                      <div style={{ width: '25%' }}>
                        <select
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all cursor-pointer"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.78)',
                            borderColor: '#e5e1d8',
                            color: '#1a1a2e',
                            height: '46px',
                            fontWeight: 300,
                          }}
                          value={assignedBranchFilter}
                          onChange={(e) => setAssignedBranchFilter(e.target.value)}
                          onFocus={(e) => (e.target.style.borderColor = '#f5a623')}
                          onBlur={(e) => (e.target.style.borderColor = '#e5e1d8')}
                        >
                          {branchOptions.map((branch) => (
                            <option key={branch} value={branch}>
                              {branch === 'ALL' ? 'All Branches' : branch}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex-grow overflow-y-auto p-0 custom-scrollbar">
                    <div>
                      {filteredAssigned.map((student, index) => {
                        const rowColor = index % 2 === 0 ? '#f5ead5' : '#fff8e2'

                        return (
                          <div
                            key={student._id}
                            className="flex items-center gap-4 p-3 transition-colors group cursor-pointer border-b"
                            style={{ backgroundColor: rowColor, borderColor: '#f0ede5' }}
                            onClick={() => handleCheckAssigned(student._id)}
                          >
                            <input
                              className="w-5 h-5 rounded bg-transparent cursor-pointer"
                              style={{ borderColor: '#d1d5db', accentColor: '#f5a623' }}
                              type="checkbox"
                              checked={selectedAssigned.includes(student._id)}
                              onChange={() => {}}
                            />
                            {student.profilePicture ? (
                              <img
                                src={student.profilePicture}
                                alt={student.name}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center font-bold overflow-hidden"
                                style={{ backgroundColor: '#e5e1d8', color: '#1a1a2e' }}
                              >
                                <span className="text-sm">{initialsFromName(student.name)}</span>
                              </div>
                            )}
                            <div className="flex-grow min-w-0">
                              <p
                                className={`font-medium text-sm truncate`}
                                style={{ color: '#1a1a2e' }}
                              >
                                {student.name}
                              </p>
                              <p className="text-xs truncate" style={{ color: '#6b7280' }}>
                                {deptAbbr(student.department)} • {student.rollNumber || '—'}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div
                    className="p-3 border-t flex justify-between items-center"
                    style={{
                      backgroundColor: '#f7e7c7',
                      borderColor: '#e5e1d8',
                    }}
                  >
                    <button
                      className="text-xs hover:brightness-110 transition-colors underline"
                      style={{ color: '#111827', textDecorationColor: '#111827' }}
                      onClick={() => setSelectedAssigned([])}
                    >
                      Deselect All
                    </button>
                    <span
                      className="text-[10px] uppercase tracking-widest font-bold"
                      style={{ color: '#111827' }}
                    >
                      {selectedAssigned.length} selected
                    </span>
                  </div>
                </div>
                </div>
              </div>

              {/* Sticky Footer Action Bar */}
              <footer
                className="border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4"
                style={{
                  background: 'rgba(253, 247, 233, 0.62)',
                  borderColor: '#e5e1d8',
                  backdropFilter: 'blur(5px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(5px) saturate(120%)',
                }}
              >
                <div className="flex items-center gap-6">
                  <div className="flex -space-x-3 overflow-hidden">
                    {selectedUnassigned.slice(0, 2).map((_id) => {
                      const student = unassignedStudents.find((s) => s._id === _id)
                      return student?.profilePicture ? (
                        <img
                          key={_id}
                          src={student.profilePicture}
                          alt={student.name}
                          className="inline-block h-8 w-8 rounded-full ring-2 ring-black object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div
                          key={_id}
                          className="inline-block h-8 w-8 rounded-full ring-2 ring-black bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white"
                        >
                          {initialsFromName(student?.name)}
                        </div>
                      )
                    })}
                    {selectedUnassigned.length > 2 && (
                      <div className="inline-block h-8 w-8 rounded-full ring-2 ring-black bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                        +{selectedUnassigned.length - 2}
                      </div>
                    )}
                  </div>
                  <div className="text-sm" style={{ color: '#111827' }}>
                    <span className="font-bold" style={{ color: '#111827' }}>
                      {selectedUnassigned.length} students
                    </span>{' '}
                    selected to be added to this advisor.
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    className="flex-1 sm:flex-none px-6 py-2.5 text-sm transition-colors rounded-xl border"
                    style={{
                      border: '1.5px solid #d1d5db',
                      height: '44px',
                      color: '#111827',
                      background: 'rgba(253, 247, 233, 0.48)',
                      backdropFilter: 'blur(5px) saturate(125%)',
                      WebkitBackdropFilter: 'blur(5px) saturate(125%)',
                      fontWeight: 500,
                    }}
                    onClick={handleDiscardChanges}
                  >
                    Discard Changes
                  </button>
                  <button
                    className="flex-1 sm:flex-none px-8 py-2.5 rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: saving ? '#f6c66f' : '#F4AD39',
                      color: '#111111',
                      border: '1.5px solid #e0a129',
                      height: '44px',
                      fontWeight: 500,
                    }}
                    onClick={handleFinalizeAssignments}
                    disabled={saving}
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    {saving ? 'Saving...' : 'Finalize Assignments'}
                  </button>
                </div>
              </footer>
            </>
          )}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f5a62366;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #f5a623;
        }
      `}</style>
    </div>
  )
}

export default AssignStudents
