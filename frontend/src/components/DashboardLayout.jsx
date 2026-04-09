import { useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import NotificationCenter from './NotificationCenter'
import NotificationPanel from './NotificationPanel'
import api from '../api'
import './DashboardLayout.css'

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const profileMenuRef = useRef(null)

  const [showNotifications, setShowNotifications] = useState(false)
  const [showMobileNotifPanel, setShowMobileNotifPanel] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    let isMounted = true

    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('notifications')
        if (!isMounted || !Array.isArray(res.data)) return
        const unread = res.data.filter((n) => !n.read).length
        setUnreadCount(unread)
      } catch {
        if (isMounted) {
          setUnreadCount(0)
        }
      }
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 10000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {
      return {}
    }
  }, [])

  const isDashboard = location.pathname === '/dashboard'
  const isSubmissions = location.pathname === '/submissions'
  const isNewSubmission = location.pathname.startsWith('/new-submission')

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const avatarLetter = currentUser?.name?.charAt(0)?.toUpperCase() || 'S'

  return (
    <div className="layout">
      <Sidebar />

      <main className="layout-main">
        <Outlet />
      </main>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <div className="mobile-bottom-nav-surface">
          <button
            type="button"
            className={`mobile-nav-icon-btn ${isDashboard ? 'active' : ''}`}
            onClick={() => navigate('/dashboard')}
            aria-label="Dashboard"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M3 11.5L12 4l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-8.5z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            className={`mobile-nav-icon-btn ${isSubmissions ? 'active' : ''}`}
            onClick={() => navigate('/submissions')}
            aria-label="My submissions"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            className={`mobile-nav-center-btn ${isNewSubmission ? 'active' : ''}`}
            onClick={() => navigate('/new-submission')}
            aria-label="New submission"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="mobile-nav-notif-wrap">
            <button
              type="button"
              className="mobile-nav-icon-btn"
              onClick={() => {
                setShowProfileMenu(false)
                setShowMobileNotifPanel((prev) => !prev)
              }}
              aria-label="Notifications"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M9.5 17a2.5 2.5 0 005 0" strokeLinecap="round" />
              </svg>
              {unreadCount > 0 && <span className="mobile-nav-notif-badge">{unreadCount}</span>}
            </button>

            {showMobileNotifPanel && (
              <NotificationPanel
                hideTrigger={true}
                open={showMobileNotifPanel}
                onOpenChange={setShowMobileNotifPanel}
                closeOnOutsideClick={false}
                panelClassName="mobile-notif-panel"
                onViewAllNotifications={() => {
                  setShowMobileNotifPanel(false)
                  setShowNotifications(true)
                }}
              />
            )}
          </div>

          <div className="mobile-profile-wrap" ref={profileMenuRef}>
            <button
              type="button"
              className="mobile-avatar-btn"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              aria-label="Profile menu"
            >
              {currentUser?.profilePicture ? (
                <img
                  src={currentUser.profilePicture}
                  alt="Profile"
                  className="mobile-avatar-image"
                />
              ) : (
                <span className="mobile-avatar-letter">{avatarLetter}</span>
              )}
            </button>

            {showProfileMenu && (
              <div className="mobile-profile-menu">
                <button
                  type="button"
                  className="mobile-profile-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false)
                    navigate('/settings')
                  }}
                >
                  View Profile
                </button>
                <button
                  type="button"
                  className="mobile-profile-menu-item logout"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {showNotifications && (
        <NotificationCenter isPopup={true} onClose={() => setShowNotifications(false)} />
      )}
    </div>
  )
}
