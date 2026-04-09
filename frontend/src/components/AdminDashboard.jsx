import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import NotificationPanel from './NotificationPanel'
import SpotlightBackground from './ui/SpotlightBackground'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef(null)
  const [adminUser, setAdminUser] = useState({
    name: '',
    role: 'Admin',
    profilePicture: '',
  })
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalPendingSubmissions: 0,
  })
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Close profile menu when clicking outside
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
    const fetchAdminProfile = async () => {
      try {
        const { data } = await api.get('/auth/me')
        setAdminUser({
          name: data.name || '',
          role: data.role || 'Admin',
          profilePicture: data.profilePicture || '',
        })

        const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...storedUser,
            name: data.name || storedUser.name,
            role: data.role || storedUser.role,
            profilePicture: data.profilePicture || storedUser.profilePicture,
          })
        )
      } catch {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
        setAdminUser({
          name: storedUser.name || '',
          role: storedUser.role || 'Admin',
          profilePicture: storedUser.profilePicture || '',
        })
      }
    }

    fetchAdminProfile()
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
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/admin/dashboard')
        setStats(data.stats)
        setAdmins(data.admins)
      } catch {
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  function formatLastLogin(date) {
    if (!date) return 'Never'
    const diff = Math.floor((Date.now() - new Date(date)) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
    return `${Math.floor(diff / 86400)} days ago`
  }

  return (
    <div
      className="h-screen overflow-hidden flex font-[Poppins,sans-serif]"
      style={{ backgroundColor: '#f7f4eb' }}
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
          <a
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all font-semibold"
            style={{ backgroundColor: '#f5a623', color: '#1a1a2e' }}
            href="#"
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
            <span className="text-[0.92rem]">Dashboard</span>
          </a>
          <Link
            to="/admin_student_management"
            data-testid="admin-nav-students"
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
            data-testid="admin-nav-faculty"
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
            data-testid="admin-nav-reports"
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
            data-testid="admin-nav-system-config"
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
                  localStorage.clear()
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
                {adminUser.name || 'Admin'}
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
                data-testid="admin-dashboard-title"
                className="text-[#111827]"
                style={{ fontWeight: 100, fontSize: '2.05rem', lineHeight: 1.15 }}
              >
                Welcome back, Admin
              </h1>
              <p className="text-[0.92rem] text-gray-500 mt-1" style={{ fontWeight: 100 }}>
                Monitor and manage your institution's activities.
              </p>
            </div>
            <NotificationPanel />
          </header>

          {/* Dashboard Body */}
          <div>
            {/* Stats Cards */}
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
              <div className="grid grid-cols-1 md:grid-cols-3">
                <div className="p-6 md:p-7">
                  <p
                    className="text-gray-500 uppercase tracking-wider text-left"
                    style={{ fontWeight: 100, fontSize: '0.7rem' }}
                  >
                    Total Students
                  </p>
                  <h3
                    className="text-[#15173D] mt-2"
                    style={{ fontWeight: 100, fontSize: '2.05rem', lineHeight: 1.15 }}
                  >
                    {loading ? '...' : stats.totalStudents}
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
                    Total Faculties
                  </p>
                  <h3
                    className="text-[#15173D] mt-2"
                    style={{ fontWeight: 100, fontSize: '2.05rem', lineHeight: 1.15 }}
                  >
                    {loading ? '...' : stats.totalFaculty}
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
                    Total Pending Submissions
                  </p>
                  <h3
                    className="text-[#15173D] mt-2"
                    style={{ fontWeight: 100, fontSize: '2.05rem', lineHeight: 1.15 }}
                  >
                    {loading ? '...' : stats.totalPendingSubmissions}
                  </h3>
                </div>
              </div>
            </div>

            {/* Admins Table */}
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
                <div className="mb-8">
                  <h4
                    className="text-[#111827]"
                    style={{ fontWeight: 100, fontSize: '1.75rem', lineHeight: 1.15 }}
                  >
                    Admins
                  </h4>
                </div>

                {/* Table Header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                    padding: '16px 24px',
                    backgroundColor: '#1a1a2e',
                    color: '#fff',
                    fontSize: '0.76rem',
                    fontWeight: '600',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    borderRadius: '10px 10px 0 0',
                  }}
                >
                  <span>Admin</span>
                  <span>Role</span>
                  <span>Status</span>
                  <span style={{ textAlign: 'right' }}>Last Login</span>
                </div>

                {/* Table Rows */}
                <div
                  style={{
                    border: '1px solid #f0ede5',
                    borderTop: 'none',
                    borderRadius: '0 0 10px 10px',
                    overflow: 'hidden',
                  }}
                >
                  {loading ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                      Loading...
                    </div>
                  ) : error ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#ef4444' }}>
                      {error}
                    </div>
                  ) : admins.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                      No admins found.
                    </div>
                  ) : (
                    admins.map((admin, index) => (
                      <div
                        key={admin._id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr 1fr',
                          padding: '18px 24px',
                          alignItems: 'center',
                          backgroundColor: '#f5ead5',
                          backdropFilter: 'blur(5px) saturate(125%)',
                          WebkitBackdropFilter: 'blur(5px) saturate(125%)',
                          borderBottom: index === admins.length - 1 ? 'none' : '1px solid #f0ede5',
                          fontSize: '0.88rem',
                          color: '#1a1a2e',
                        }}
                      >
                        {/* Admin Column with Avatar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {admin.profilePicture ? (
                            <img
                              src={admin.profilePicture}
                              alt={admin.name || 'Admin'}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                flexShrink: 0,
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #f5a623, #f7b731)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '700',
                                fontSize: '1rem',
                                color: '#1a1a2e',
                                flexShrink: 0,
                              }}
                            >
                              {initialsFromName(admin.name)}
                            </div>
                          )}
                          <div>
                            <p
                              style={{
                                fontSize: '0.96rem',
                                fontWeight: '600',
                                color: '#1a1a2e',
                                marginBottom: '2px',
                              }}
                            >
                              {admin.name}
                            </p>
                            <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>{admin.email}</p>
                          </div>
                        </div>

                        {/* Role Column */}
                        <div>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '4px 14px',
                              borderRadius: '999px',
                              fontSize: '0.76rem',
                              fontWeight: '600',
                              color: '#f5a623',
                              border: '1.5px solid #f5a623',
                            }}
                          >
                            {admin.role}
                          </span>
                        </div>

                        {/* Status Column */}
                        <div>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 14px',
                              borderRadius: '999px',
                              fontSize: '0.78rem',
                              fontWeight: '600',
                              color: admin.isActive ? '#16a34a' : '#6b7280',
                              border: admin.isActive
                                ? '1.5px solid #bbf7d0'
                                : '1.5px solid #e5e7eb',
                              backgroundColor: admin.isActive ? '#f0fdf4' : '#f9fafb',
                            }}
                          >
                            <span
                              style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                backgroundColor: admin.isActive ? '#16a34a' : '#9ca3af',
                              }}
                            ></span>
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {/* Last Login Column */}
                        <div style={{ textAlign: 'right', fontSize: '0.88rem', color: '#6b7280' }}>
                          {formatLastLogin(admin.lastLogin)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </SpotlightBackground>
      </main>
    </div>
  )
}
