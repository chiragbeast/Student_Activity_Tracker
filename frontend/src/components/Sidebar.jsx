import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import api from '../api'

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg
        style={{ width: '20px', height: '20px', flexShrink: 0 }}
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
    ),
  },
  {
    to: '/submissions',
    label: 'My Submissions',
    icon: (
      <svg
        style={{ width: '20px', height: '20px', flexShrink: 0 }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth="2"
      >
        <path
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [profile, setProfile] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/student/profile')
        setProfile(res.data)
      } catch (err) {
        // Keep sidebar functional with localStorage fallback if API is unavailable.
        console.error('Failed to load sidebar profile:', err)
      }
    }

    fetchProfile()
  }, [])

  const userObj = profile || JSON.parse(localStorage.getItem('user') || '{}')
  const displayName = userObj.name || 'Student'
  const displayRoll = userObj.rollNumber || 'N/A'
  const avatarLetter = displayName.charAt(0)?.toUpperCase() || 'S'

  return (
    <aside
      style={{
        width: '260px',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        backgroundColor: '#000000',
        color: '#FFFFFF',
        padding: '28px 16px 20px',
        zIndex: 100,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Brand */}
      <div style={{ padding: '0 8px', marginBottom: '36px' }}>
        <span
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: '1.2rem',
            fontWeight: '700',
            color: '#fff',
            letterSpacing: '0.3px',
          }}
        >
          SAPT
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all font-semibold text-[0.92rem] no-underline'
                : 'flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-white/5 font-medium text-[0.92rem] no-underline'
            }
            style={({ isActive }) =>
              isActive
                ? { backgroundColor: '#f5a623', color: '#1a1a2e', textDecoration: 'none' }
                : { textDecoration: 'none' }
            }
          >
            {icon}
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* New Submission button */}
      <button
        onClick={() => navigate('/new-submission')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          padding: '11px',
          backgroundColor: '#f5a623',
          color: '#1a1a2e',
          border: 'none',
          borderRadius: '10px',
          fontSize: '0.88rem',
          fontWeight: '600',
          cursor: 'pointer',
          marginBottom: '12px',
          fontFamily: 'inherit',
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e09510')}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f5a623')}
      >
        <svg
          style={{ width: '16px', height: '16px' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2.5"
        >
          <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        New Submission
      </button>

      {/* Profile bottom */}
      <div ref={menuRef} style={{ position: 'relative' }}>
        <div
          style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 8px 16px' }}
        ></div>

        {showMenu && (
          <div
            style={{
              position: 'absolute',
              bottom: '70px',
              left: '8px',
              right: '8px',
              backgroundColor: '#111',
              borderRadius: '12px',
              padding: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              zIndex: 50,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(false)
                navigate('/settings')
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
                fontFamily: 'inherit',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg
                style={{ width: '18px', height: '18px', flexShrink: 0 }}
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
                setShowMenu(false)
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
                fontFamily: 'inherit',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg
                style={{ width: '18px', height: '18px', flexShrink: 0 }}
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
          onClick={() => setShowMenu(!showMenu)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: userObj.profilePicture
                ? 'transparent'
                : 'linear-gradient(135deg, #f5a623, #f7b731)',
              color: '#1a1a2e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '0.95rem',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            {userObj.profilePicture ? (
              <img
                src={userObj.profilePicture}
                alt={displayName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              avatarLetter
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#fff' }}>
              {displayName}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>({displayRoll})</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
