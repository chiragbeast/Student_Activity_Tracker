import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { facultyApi } from '../services/api'

const navItems = [
  {
    label: 'Dashboard',
    icon: <svg style={{ width: '20px', height: '20px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeLinecap="round" strokeLinejoin="round"></path></svg>
  },
  {
    label: 'Assigned Students',
    icon: <svg style={{ width: '20px', height: '20px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round"></path></svg>
  },
  {
    label: 'Pending Submissions',
    icon: <svg style={{ width: '20px', height: '20px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"></path></svg>
  },
]

export default function Sidebar({ activeNav, onNavChange }) {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const [profile, setProfile] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    // Initial fallback from localStorage
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        setProfile(JSON.parse(savedUser))
      } catch (err) { }
    }
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await facultyApi.getProfile()
      if (res.data.success) {
        setProfile(res.data.data)
      }
    } catch (err) {
      console.error('Error fetching faculty profile:', err)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <aside style={{
      width: '260px', display: 'flex', flexDirection: 'column', flexShrink: 0,
      height: '100vh', backgroundColor: '#000000', color: '#FFFFFF',
      padding: '28px 16px 20px', fontFamily: 'Inter, sans-serif'
    }}>
      {/* Brand */}
      <div style={{ padding: '0 8px', marginBottom: '36px' }}>
        <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.2rem', fontWeight: '700', color: '#fff', letterSpacing: '0.3px' }}>SAPT</span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map(({ label, icon }) => {
          const isActive = activeNav === label
          return (
            <button
              key={label}
              onClick={() => onNavChange(label)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '10px', border: 'none',
                width: '100%', textAlign: 'left', cursor: 'pointer',
                fontSize: '0.92rem', fontWeight: isActive ? '600' : '500',
                backgroundColor: isActive ? '#f5a623' : 'transparent',
                color: isActive ? '#1a1a2e' : '#9ca3af',
                transition: 'all 0.2s', fontFamily: 'inherit'
              }}
              onMouseOver={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#e5e7eb' } }}
              onMouseOut={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af' } }}
            >
              {icon}
              <span>{label}</span>
            </button>
          )
        })}
      </nav>

      {/* Profile bottom */}
      <div ref={menuRef} style={{ position: 'relative' }}>
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 8px 16px' }}></div>

        {showMenu && (
          <div style={{
            position: 'absolute', bottom: '70px', left: '8px', right: '8px',
            backgroundColor: '#111', borderRadius: '12px', padding: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)', zIndex: 50
          }}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); onNavChange('Profile') }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', color: '#e5e7eb', fontSize: '0.88rem', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg style={{ width: '18px', height: '18px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"></path></svg>
              View Profile
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); localStorage.clear(); navigate('/') }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', color: '#ef4444', fontSize: '0.88rem', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg style={{ width: '18px', height: '18px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"></path></svg>
              Logout
            </button>
          </div>
        )}

        <div
          onClick={() => setShowMenu(!showMenu)}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #f5a623, #f7b731)', color: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.95rem', flexShrink: 0 }}>
            {profile?.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'F'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '150px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.name || 'Faculty'}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile?.department || (profile?.role === 'Faculty' ? 'Faculty Advisor' : 'Advisor')}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
