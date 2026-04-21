import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './FacultyMobileBottomNav.css'

const navItems = [
  {
    key: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'Assigned Students',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'Pending Submissions',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'Manage Deadlines',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'Profile',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

export default function FacultyMobileBottomNav({ activeNav, onNavChange }) {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  // Map sub-pages to their parent nav keys to keep highlighting consistent
  const getCleanActiveKey = (nav) => {
    if (nav === 'Review Detail') return 'Pending Submissions'
    return nav
  }

  const cleanActiveNav = getCleanActiveKey(activeNav)

  const activeIndex = Math.max(
    0,
    navItems.findIndex((item) => item.key === cleanActiveNav)
  )

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNavClick = (key) => {
    if (key === 'Profile') {
      setShowMenu(!showMenu)
    } else {
      setShowMenu(false)
      onNavChange(key)
    }
  }

  const handleLogout = () => {
    setShowMenu(false)
    localStorage.clear()
    navigate('/login')
  }

  return (
    <nav className="faculty-mobile-bottom-nav" aria-label="Faculty mobile navigation">
      <div className="faculty-mobile-bottom-nav-surface" style={{ '--active-index': activeIndex }}>
        <span className="faculty-mobile-nav-slider" aria-hidden="true" />
        {navItems.map((item) => (
          <div
            key={item.key}
            className="faculty-mobile-nav-item"
            ref={item.key === 'Profile' ? menuRef : null}
          >
            {item.key === 'Profile' && showMenu && (
              <div className="mobile-profile-dropdown">
                <button
                  className="mobile-dropdown-item"
                  onClick={() => {
                    setShowMenu(false)
                    onNavChange('Profile')
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>View Profile</span>
                </button>
                <div className="dropdown-divider" />
                <button className="mobile-dropdown-item logout" onClick={handleLogout}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
            <button
              type="button"
              className={`faculty-mobile-nav-btn ${cleanActiveNav === item.key ? 'active' : ''}`}
              onClick={() => handleNavClick(item.key)}
              aria-label={item.key}
              title={item.key}
            >
              {item.icon}
            </button>
          </div>
        ))}
      </div>
    </nav>
  )
}
