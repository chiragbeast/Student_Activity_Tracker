import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import SpotlightBackground from './ui/SpotlightBackground'

const ReportsAnalytics = () => {
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState('')
  const profileMenuRef = useRef(null)
  const [adminUser, setAdminUser] = useState({
    name: 'Admin User',
    role: 'Admin',
    profilePicture: '',
  })
  const [stats, setStats] = useState({
    totalPointsAwarded: 0,
    activeStudents: 0,
    avgPointsPerStudent: 0,
    approvedActivities: 0,
  })
  const [topPerformers, setTopPerformers] = useState([])
  const [departmentDistribution, setDepartmentDistribution] = useState([])
  const [yearWiseAverages, setYearWiseAverages] = useState({})
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  const deptAbbr = (dept) => {
    if (!dept) return 'N/A'
    const map = {
      'computer science': 'CSE',
      'computer science & engineering (cse)': 'CSE',
      'electronics & communication engineering (ece)': 'ECE',
      'electrical & electronics engineering (eee)': 'EEE',
      'chemical engineering (ch)': 'CH',
      'mechanical engineering (me)': 'ME',
      'civil engineering (ce)': 'CE',
      'biotechnology (bt)': 'BT',
      'materials science & engineering (mse)': 'MSE',
      'production engineering (pe)': 'PE',
      'engineering physics (ep)': 'EP',
      unspecified: 'N/A',
    }
    return map[String(dept).toLowerCase().trim()] || String(dept).toUpperCase()
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

  const initialsFromName = (name = '') => {
    return (
      name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'A'
    )
  }

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/admin/reports')
        setStats(data.stats || {})
        setTopPerformers(data.topPerformers || [])
        setDepartmentDistribution(data.departmentDistribution || [])
        const backendYearWise = data.yearWiseAverages || {}
        setYearWiseAverages(backendYearWise)
        const departments = Object.keys(backendYearWise)
        if (departments.length > 0) {
          setSelectedBranch((prev) => (prev && departments.includes(prev) ? prev : departments[0]))
        }
      } catch {
        setFetchError('Failed to load reports data.')
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  const branches = Object.keys(yearWiseAverages)
  const selectedYearSeries = yearWiseAverages[selectedBranch] || [0, 0, 0, 0]
  const maxYearValue = Math.max(100, ...selectedYearSeries)
  const yAxisMax = Math.ceil(maxYearValue / 100) * 100
  const yAxisStep = yAxisMax / 6

  const maxDepartmentTotal = Math.max(
    1,
    ...departmentDistribution.map((item) => Number(item.totalPoints || 0))
  )
  const departmentData = departmentDistribution.map((item) => ({
    label: deptAbbr(item.department),
    value: Number(item.totalPoints || 0),
    height: Math.max(8, (Number(item.totalPoints || 0) / maxDepartmentTotal) * 100),
  }))

  return (
    <div className="h-screen overflow-hidden flex" style={{ backgroundColor: '#f7f4eb' }}>
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
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-white/5 font-medium text-[0.92rem]"
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
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: '#f7f4eb', fontFamily: 'Poppins, sans-serif' }}
      >
        <SpotlightBackground className="admin-spotlight-surface">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg bg-white/10 text-gray-700 hover:bg-white/20"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1
                  className="text-[#111827]"
                  style={{ fontWeight: 100, fontSize: '2.05rem', lineHeight: 1.15 }}
                >
                  Reports Analytics
                </h1>
                <p className="text-gray-500 mt-1" style={{ fontWeight: 100, fontSize: '0.92rem' }}>
                  Comprehensive performance insights and data visualization.
                </p>
              </div>
            </div>
          </header>

          <div>
            {/* Stats Strip */}
            <div
              className="mb-8 rounded-[24px]"
              style={{
                background: 'rgba(253, 247, 233, 0.62)',
                border: '1.5px solid #e5e1d8',
                backdropFilter: 'blur(5px) saturate(135%)',
                WebkitBackdropFilter: 'blur(5px) saturate(135%)',
                boxShadow: '0 14px 40px rgba(26, 26, 46, 0.08)',
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 md:p-7">
                  <p
                    className="text-gray-500 uppercase tracking-wider text-left"
                    style={{ fontWeight: 100, fontSize: '0.7rem' }}
                  >
                    Total Points Awarded
                  </p>
                  <h3
                    className="text-[#15173D] mt-2"
                    style={{ fontWeight: 100, fontSize: '2.05rem', lineHeight: 1.15 }}
                  >
                    {loading ? '...' : Number(stats.totalPointsAwarded || 0).toLocaleString()}
                  </h3>
                </div>

                <div className="p-6 md:p-7 relative">
                  <div
                    className="hidden md:block"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '18px',
                      bottom: '18px',
                      width: '1.5px',
                      backgroundColor: '#e5e1d8',
                    }}
                  />
                  <p
                    className="text-gray-500 uppercase tracking-wider text-left"
                    style={{ fontWeight: 100, fontSize: '0.7rem' }}
                  >
                    Active Students
                  </p>
                  <h3
                    className="text-[#15173D] mt-2"
                    style={{ fontWeight: 100, fontSize: '2.05rem', lineHeight: 1.15 }}
                  >
                    {loading ? '...' : Number(stats.activeStudents || 0).toLocaleString()}
                  </h3>
                </div>

                <div className="p-6 md:p-7 relative">
                  <div
                    className="hidden lg:block"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '18px',
                      bottom: '18px',
                      width: '1.5px',
                      backgroundColor: '#e5e1d8',
                    }}
                  />
                  <p
                    className="text-gray-500 uppercase tracking-wider text-left"
                    style={{ fontWeight: 100, fontSize: '0.7rem' }}
                  >
                    Avg Points/Student
                  </p>
                  <h3
                    className="text-[#15173D] mt-2"
                    style={{ fontWeight: 100, fontSize: '2.05rem', lineHeight: 1.15 }}
                  >
                    {loading ? '...' : Number(stats.avgPointsPerStudent || 0).toLocaleString()}
                  </h3>
                </div>

                <div className="p-6 md:p-7 relative">
                  <div
                    className="hidden md:block"
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: '18px',
                      bottom: '18px',
                      width: '1.5px',
                      backgroundColor: '#e5e1d8',
                    }}
                  />
                  <p
                    className="text-gray-500 uppercase tracking-wider text-left"
                    style={{ fontWeight: 100, fontSize: '0.7rem' }}
                  >
                    Activities
                  </p>
                  <h3
                    className="text-[#15173D] mt-2"
                    style={{ fontWeight: 100, fontSize: '2.05rem', lineHeight: 1.15 }}
                  >
                    {loading ? '...' : Number(stats.approvedActivities || 0).toLocaleString()}
                  </h3>
                </div>
              </div>
            </div>

            {fetchError && (
              <div
                className="mb-6 rounded-lg border px-4 py-3 text-sm font-medium"
                style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}
              >
                {fetchError}
              </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Department Chart */}
              <div
                className="rounded-[16px] overflow-hidden"
                style={{
                  background: 'rgba(253, 247, 233, 0.62)',
                  border: '1.5px solid #e5e1d8',
                  backdropFilter: 'blur(5px) saturate(135%)',
                  WebkitBackdropFilter: 'blur(5px) saturate(135%)',
                  boxShadow: '0 14px 40px rgba(26, 26, 46, 0.08)',
                }}
              >
                <div className="p-8">
                  <h4
                    className="text-[#111827] mb-6"
                    style={{ fontWeight: 100, fontSize: '1.35rem', lineHeight: 1.15 }}
                  >
                    Department Distribution
                  </h4>
                  <div className="flex items-end justify-between h-64 gap-2 px-4">
                    {departmentData.map((dept, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center gap-2 flex-1 group relative"
                      >
                        <div className="flex items-end h-48 w-full justify-center">
                          <div
                            className="w-full rounded-t-sm relative group/bar"
                            style={{ height: `${dept.height}%`, backgroundColor: '#F4AD39' }}
                          >
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                              {dept.value} pts
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">{dept.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Year-wise Average Points Line Graph */}
              <div
                className="rounded-[16px] overflow-hidden"
                style={{
                  background: 'rgba(253, 247, 233, 0.62)',
                  border: '1.5px solid #e5e1d8',
                  backdropFilter: 'blur(5px) saturate(135%)',
                  WebkitBackdropFilter: 'blur(5px) saturate(135%)',
                  boxShadow: '0 14px 40px rgba(26, 26, 46, 0.08)',
                }}
              >
                <div className="p-8">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h4
                      className="text-[#111827]"
                      style={{ fontWeight: 100, fontSize: '1.35rem', lineHeight: 1.15 }}
                    >
                      Average Activity Points by Year
                    </h4>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="px-4 py-2 rounded-lg border text-sm text-[#111827] focus:outline-none transition-colors cursor-pointer"
                      style={{
                        background: 'rgba(253, 247, 233, 0.48)',
                        border: '1.5px solid #e5e1d8',
                        fontWeight: 400,
                      }}
                    >
                      {branches.map((branch) => (
                        <option key={branch} value={branch}>
                          {deptAbbr(branch)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative" style={{ height: '400px' }}>
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-12 w-12 flex flex-col justify-between text-right pr-2 text-xs text-gray-500 font-medium">
                      <span>{Math.round(yAxisStep * 6)}</span>
                      <span>{Math.round(yAxisStep * 5)}</span>
                      <span>{Math.round(yAxisStep * 4)}</span>
                      <span>{Math.round(yAxisStep * 3)}</span>
                      <span>{Math.round(yAxisStep * 2)}</span>
                      <span>{Math.round(yAxisStep)}</span>
                      <span>0</span>
                    </div>

                    {/* Graph area */}
                    <div className="absolute left-14 right-0 top-0 bottom-0">
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 800 400"
                        preserveAspectRatio="none"
                        className="overflow-visible"
                      >
                        {/* Grid lines */}
                        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                          <line
                            key={i}
                            x1="0"
                            y1={i * 60}
                            x2="800"
                            y2={i * 60}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                            vectorEffect="non-scaling-stroke"
                          />
                        ))}

                        {/* Line path */}
                        <polyline
                          points={selectedYearSeries
                            .map((value, index) => {
                              const x = (index * 800) / 3
                              const y = 360 - (value / yAxisMax) * 360
                              return `${x},${y}`
                            })
                            .join(' ')}
                          fill="none"
                          stroke="#F4AD39"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />

                        {/* Data points */}
                        {selectedYearSeries.map((value, index) => {
                          const x = (index * 800) / 3
                          const y = 360 - (value / yAxisMax) * 360
                          return (
                            <g key={index}>
                              <circle
                                cx={x}
                                cy={y}
                                r="6"
                                fill="#F4AD39"
                                vectorEffect="non-scaling-stroke"
                              />
                              <circle
                                cx={x}
                                cy={y}
                                r="3"
                                fill="white"
                                vectorEffect="non-scaling-stroke"
                              />
                              {/* Value label */}
                              <text
                                x={x}
                                y={y - 15}
                                textAnchor="middle"
                                className="text-xs font-bold"
                                fill="#111827"
                                style={{ fontSize: '12px' }}
                              >
                                {value}
                              </text>
                            </g>
                          )
                        })}
                      </svg>

                      {/* X-axis labels */}
                      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-0">
                        <span className="text-sm font-bold text-gray-600">1st Year</span>
                        <span className="text-sm font-bold text-gray-600">2nd Year</span>
                        <span className="text-sm font-bold text-gray-600">3rd Year</span>
                        <span className="text-sm font-bold text-gray-600">4th Year</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Performers Table */}
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                  <h4
                    className="text-[#111827]"
                    style={{ fontWeight: 100, fontSize: '1.75rem', lineHeight: 1.15 }}
                  >
                    Top Performers
                  </h4>
                </div>
                <div
                  className="overflow-x-auto rounded-[10px]"
                  style={{ border: '1px solid #f3f4f6' }}
                >
                  <table className="w-full text-left min-w-[700px]">
                    <thead>
                      <tr
                        className="text-white text-[10px] font-bold uppercase tracking-widest"
                        style={{ backgroundColor: '#14213d' }}
                      >
                        <th className="py-4 px-6" style={{ borderTopLeftRadius: '10px' }}>
                          Name
                        </th>
                        <th className="py-4 px-6">Points</th>
                        <th className="py-4 px-6">Department</th>
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
                          <td colSpan={5} className="py-8 text-center text-sm text-gray-400">
                            Loading top performers...
                          </td>
                        </tr>
                      ) : topPerformers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-sm text-gray-400">
                            No student points data found.
                          </td>
                        </tr>
                      ) : (
                        topPerformers.map((student, index) => {
                          const rowColor = index % 2 === 0 ? '#f5ead5' : '#fff8e2'
                          const rowCellStyle = {
                            backgroundColor: rowColor,
                            backdropFilter: 'blur(5px) saturate(125%)',
                            WebkitBackdropFilter: 'blur(5px) saturate(125%)',
                            borderBottom:
                              index === topPerformers.length - 1 ? 'none' : '1px solid #f0ede5',
                          }

                          return (
                            <tr key={student._id}>
                              <td className="py-4 px-6" style={rowCellStyle}>
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                                    style={{
                                      background: 'linear-gradient(135deg, #f5a623, #f7b731)',
                                      color: '#1a1a2e',
                                    }}
                                  >
                                    {student.name ? student.name.charAt(0).toUpperCase() : '?'}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-[#111827]">
                                      {student.name}
                                    </p>
                                    <p className="text-xs text-gray-400">{student.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6" style={rowCellStyle}>
                                <span className="text-lg font-bold text-[#111827]">
                                  {student.totalPoints}
                                </span>
                                <span className="text-xs ml-1 text-gray-500">pts</span>
                              </td>
                              <td className="py-4 px-6" style={rowCellStyle}>
                                <span className="text-sm font-medium text-gray-700">
                                  {student.department || '—'}
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
                                    color: student.isActive ? '#16a34a' : '#6b7280',
                                    border: student.isActive
                                      ? '1.5px solid #bbf7d0'
                                      : '1.5px solid #e5e7eb',
                                    backgroundColor: student.isActive ? '#f0fdf4' : '#f9fafb',
                                  }}
                                >
                                  <span
                                    style={{
                                      width: '7px',
                                      height: '7px',
                                      borderRadius: '50%',
                                      backgroundColor: student.isActive ? '#16a34a' : '#9ca3af',
                                    }}
                                  ></span>
                                  {student.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-right" style={rowCellStyle}>
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() =>
                                      console.log('Download transcript for student:', student._id)
                                    }
                                    className="inline-block p-1.5 hover:opacity-70 transition-colors"
                                    style={{ color: '#F4AD39' }}
                                    title="Download Transcript"
                                  >
                                    <svg
                                      className="w-5 h-5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                      ></path>
                                    </svg>
                                  </button>
                                  <Link
                                    to={`/edit_student/${student._id}`}
                                    className="inline-block p-1.5 hover:opacity-70 transition-colors"
                                    style={{ color: '#F4AD39' }}
                                    title="Edit Student"
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
    </div>
  )
}

export default ReportsAnalytics
