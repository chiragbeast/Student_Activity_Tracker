import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import ImageCropModal from './ImageCropModal'

const UserProfileSettings = () => {
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [userProfile, setUserProfile] = useState({
    name: 'Administrator',
    email: 'admin@university.edu',
    role: 'Admin',
  })
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [cropImageSrc, setCropImageSrc] = useState(null)
  const [notificationsSaving, setNotificationsSaving] = useState(false)
  const fileInputRef = useRef(null)

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
    const fetchProfile = async () => {
      try {
        setLoadingProfile(true)
        const { data } = await api.get('/auth/me')
        setUserProfile({
          name: data.name || 'Administrator',
          email: data.email || 'admin@university.edu',
          role: data.role || 'Admin',
          profilePicture: data.profilePicture || '',
        })
        setNotifications(Boolean(data.notificationsEnabled))
      } catch {
        setSaveError('Failed to load profile details from database.')
      } finally {
        setLoadingProfile(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()

    setSaveError('')
    setSaveSuccess('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setSaveError('Please fill current, new and confirm password fields.')
      return
    }

    if (newPassword !== confirmPassword) {
      setSaveError('New password and confirm password must match.')
      return
    }

    try {
      setSaving(true)
      const { data } = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      })
      setSaveSuccess(data.message || 'Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to update password.')
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setSaveError('')
    setSaveSuccess('')
  }

  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowed.includes(file.type)) {
      setUploadError('Only JPG and PNG images are allowed')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be under 5 MB')
      return
    }

    setUploadError('')
    const reader = new FileReader()
    reader.onload = () => setCropImageSrc(reader.result)
    reader.readAsDataURL(file)

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCroppedUpload = async (croppedBlob) => {
    setCropImageSrc(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('profilePicture', croppedBlob, 'profile.jpg')

      const { data } = await api.put('/auth/me/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setUserProfile((prev) => ({
        ...prev,
        profilePicture: data.profilePicture,
      }))

      const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
      storedUser.profilePicture = data.profilePicture
      localStorage.setItem('user', JSON.stringify(storedUser))
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveNotifications = async () => {
    try {
      setNotificationsSaving(true)
      setSaveError('')
      setSaveSuccess('')
      await api.put('/auth/me', { notificationsEnabled: notifications })
      setSaveSuccess('Notification preferences updated successfully.')
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to update notification preferences.')
    } finally {
      setNotificationsSaving(false)
    }
  }

  return (
    <div
      className="h-screen overflow-hidden flex font-display"
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
        </nav>

        <div ref={profileMenuRef} className="mt-auto" style={{ position: 'relative' }}>
          <div
            style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '12px 8px 16px' }}
          ></div>

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
                  (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')
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
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)')}
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
            {userProfile.profilePicture ? (
              <img
                src={userProfile.profilePicture}
                alt={userProfile.name || 'Admin'}
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
                {initialsFromName(userProfile.name)}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[0.9rem] font-semibold text-white">
                {userProfile.name || 'Admin User'}
              </span>
              <span className="text-[0.78rem] text-[#9ca3af]">({userProfile.role || 'Admin'})</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area with Cream Background */}
      <main
        style={{
          flex: 1,
          backgroundColor: '#FFFBF2',
          overflowY: 'auto',
          padding: '36px 40px',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontSize: '1.85rem',
                fontWeight: '800',
                color: '#1a1a2e',
                margin: '0 0 6px',
              }}
            >
              Admin Profile & Settings
            </h1>
            <p style={{ fontSize: '0.92rem', color: '#6b7280', margin: 0 }}>
              Manage your administrative account and security preferences.
            </p>
          </div>

          {/* Grid Layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '320px 1fr',
              gap: '24px',
              alignItems: 'start',
            }}
          >
            {/* Left: Profile Card */}
            <div
              style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '32px 28px 28px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              {/* Avatar */}
              <div style={{ marginBottom: '18px' }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fdf8f0 0%, #f5e6c8 100%)',
                    border: '3px solid #f5a623',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                >
                  {userProfile.profilePicture ? (
                    <img
                      src={userProfile.profilePicture}
                      alt={userProfile.name || 'Admin'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <span
                      style={{
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '3rem',
                        fontWeight: '800',
                        color: '#1a1a2e',
                      }}
                    >
                      {initialsFromName(userProfile.name)}
                    </span>
                  )}

                  {uploading && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(255,255,255,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        color: '#1a1a2e',
                      }}
                    >
                      Uploading...
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  style={{ display: 'none' }}
                  onChange={handleProfilePicChange}
                />
              </div>

              <h2
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  color: '#1a1a2e',
                  margin: '0 0 4px',
                }}
              >
                {loadingProfile ? 'Loading...' : userProfile.name}
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0 0 2px' }}>
                Role: {userProfile.role || 'Admin'}
              </p>
              <p style={{ fontSize: '0.82rem', color: '#9ca3af', margin: '0 0 20px' }}>
                {loadingProfile ? 'Loading...' : userProfile.email}
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  borderRadius: '10px',
                  background: '#f5a623',
                  color: '#1a1a2e',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.7 : 1,
                  fontFamily: 'inherit',
                  transition: 'transform 0.15s, box-shadow 0.2s',
                  boxShadow: '0 2px 8px rgba(245,166,35,0.3)',
                  marginBottom: '24px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(245,166,35,0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(245,166,35,0.3)'
                }}
              >
                {uploading ? 'Uploading...' : 'Change Profile Picture'}
              </button>

              {uploadError && (
                <div
                  style={{
                    width: '100%',
                    marginTop: '-12px',
                    marginBottom: '18px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                  }}
                >
                  {uploadError}
                </div>
              )}

              {/* Profile Completion */}
              <div style={{ width: '100%' }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}
                >
                  <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#4C9AFF' }}>
                    Profile Completion
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#1a1a2e' }}>
                    85%
                  </span>
                </div>
                <div
                  style={{
                    height: '6px',
                    background: '#e5e1d8',
                    borderRadius: '999px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: '85%',
                      background: 'linear-gradient(90deg, #4C9AFF, #2d7ae0)',
                      borderRadius: '999px',
                      transition: 'width 0.4s ease',
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Account Settings Card */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '28px 32px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <h2
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#1a1a2e',
                    margin: '0 0 18px',
                  }}
                >
                  Account Settings
                </h2>

                <h3
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    color: '#1a1a2e',
                    margin: '0 0 4px',
                  }}
                >
                  Update Password
                </h3>
                <p
                  style={{
                    fontSize: '0.84rem',
                    color: '#6b7280',
                    margin: '0 0 18px',
                    lineHeight: '1.5',
                  }}
                >
                  Ensure your account is using a long, random password to stay secure.
                </p>

                <form onSubmit={handleSave}>
                  {/* Current Password */}
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.84rem',
                      fontWeight: '600',
                      color: '#1a1a2e',
                      marginBottom: '6px',
                    }}
                  >
                    Current Password
                  </label>
                  <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      placeholder="••••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 44px 12px 16px',
                        border: '1.5px solid #e5e1d8',
                        borderRadius: '10px',
                        fontSize: '0.92rem',
                        color: '#1a1a2e',
                        background: '#fafaf8',
                        fontFamily: 'inherit',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#f5a623')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e1d8')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      style={{
                        position: 'absolute',
                        right: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#9ca3af',
                        fontSize: '1.1rem',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#6b7280')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                        {showCurrent ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>

                  {/* New Password and Confirm Password Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.84rem',
                          fontWeight: '600',
                          color: '#1a1a2e',
                          marginBottom: '6px',
                        }}
                      >
                        New Password
                      </label>
                      <div style={{ position: 'relative', marginBottom: '16px' }}>
                        <input
                          type={showNew ? 'text' : 'password'}
                          placeholder="••••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px 44px 12px 16px',
                            border: '1.5px solid #e5e1d8',
                            borderRadius: '10px',
                            fontSize: '0.92rem',
                            color: '#1a1a2e',
                            background: '#fafaf8',
                            fontFamily: 'inherit',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            boxSizing: 'border-box',
                          }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = '#f5a623')}
                          onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e1d8')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew(!showNew)}
                          style={{
                            position: 'absolute',
                            right: '14px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#9ca3af',
                            fontSize: '1.1rem',
                            display: 'flex',
                            alignItems: 'center',
                            padding: 0,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#6b7280')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: '1.1rem' }}
                          >
                            {showNew ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.84rem',
                          fontWeight: '600',
                          color: '#1a1a2e',
                          marginBottom: '6px',
                        }}
                      >
                        Confirm Password
                      </label>
                      <div style={{ position: 'relative', marginBottom: '16px' }}>
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="••••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px 44px 12px 16px',
                            border: '1.5px solid #e5e1d8',
                            borderRadius: '10px',
                            fontSize: '0.92rem',
                            color: '#1a1a2e',
                            background: '#fafaf8',
                            fontFamily: 'inherit',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            boxSizing: 'border-box',
                          }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = '#f5a623')}
                          onBlur={(e) => (e.currentTarget.style.borderColor = '#e5e1d8')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          style={{
                            position: 'absolute',
                            right: '14px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#9ca3af',
                            fontSize: '1.1rem',
                            display: 'flex',
                            alignItems: 'center',
                            padding: 0,
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#6b7280')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: '1.1rem' }}
                          >
                            {showConfirm ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {saveError && (
                    <div
                      style={{
                        marginBottom: '12px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#dc2626',
                        fontSize: '0.84rem',
                        fontWeight: '600',
                      }}
                    >
                      {saveError}
                    </div>
                  )}

                  {saveSuccess && (
                    <div
                      style={{
                        marginBottom: '12px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        color: '#047857',
                        fontSize: '0.84rem',
                        fontWeight: '600',
                      }}
                    >
                      {saveSuccess}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '12px',
                      marginTop: '8px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleDiscard}
                      style={{
                        padding: '10px 24px',
                        border: 'none',
                        background: 'transparent',
                        color: '#1a1a2e',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#6b7280')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#1a1a2e')}
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      style={{
                        padding: '10px 28px',
                        border: 'none',
                        borderRadius: '10px',
                        background: '#1a1a2e',
                        color: '#fff',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.7 : 1,
                        fontFamily: 'inherit',
                        transition: 'transform 0.15s, box-shadow 0.2s',
                        boxShadow: '0 2px 8px rgba(26,26,46,0.2)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(26,26,46,0.3)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,26,46,0.2)'
                      }}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Notifications Card */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: '16px',
                  padding: '28px 32px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                <h2
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    color: '#1a1a2e',
                    margin: '0 0 18px',
                  }}
                >
                  Notifications
                </h2>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '24px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        color: '#1a1a2e',
                        margin: 0,
                      }}
                    >
                      Notification Preferences
                    </h3>
                    <p
                      style={{
                        fontSize: '0.84rem',
                        color: '#6b7280',
                        margin: '4px 0 0',
                        lineHeight: '1.5',
                      }}
                    >
                      Stay updated with important activity alerts and system announcements.
                    </p>

                    <button
                      type="button"
                      onClick={handleSaveNotifications}
                      disabled={notificationsSaving}
                      style={{
                        marginTop: '14px',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid #1a1a2e',
                        background: '#1a1a2e',
                        color: '#ffffff',
                        fontSize: '0.82rem',
                        fontWeight: '700',
                        cursor: notificationsSaving ? 'not-allowed' : 'pointer',
                        opacity: notificationsSaving ? 0.7 : 1,
                      }}
                    >
                      {notificationsSaving ? 'Saving...' : 'Save Notification Settings'}
                    </button>
                  </div>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      style={{ display: 'none' }}
                    />
                    <div
                      style={{
                        width: '48px',
                        height: '26px',
                        background: notifications ? '#f5a623' : '#d1d5db',
                        borderRadius: '999px',
                        position: 'relative',
                        transition: 'background 0.25s',
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          width: '20px',
                          height: '20px',
                          background: '#fff',
                          borderRadius: '50%',
                          top: '3px',
                          left: notifications ? 'calc(100% - 23px)' : '3px',
                          transition: 'left 0.25s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        }}
                      ></div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: '500',
                        color: '#1a1a2e',
                        lineHeight: '1.3',
                      }}
                    >
                      Receive system notifications
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '28px 0 16px',
              marginTop: '32px',
              borderTop: '1px solid #e5e1d8',
              fontSize: '0.78rem',
              color: '#9ca3af',
            }}
          >
            <span>© 2024 Student Activity Tracker. All rights reserved.</span>
            <div style={{ display: 'flex', gap: '20px' }}>
              <a
                href="#"
                style={{
                  color: '#6b7280',
                  textDecoration: 'none',
                  fontWeight: '500',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1a2e')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
              >
                Privacy Policy
              </a>
              <a
                href="#"
                style={{
                  color: '#6b7280',
                  textDecoration: 'none',
                  fontWeight: '500',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1a2e')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
              >
                Terms of Service
              </a>
              <a
                href="#"
                style={{
                  color: '#6b7280',
                  textDecoration: 'none',
                  fontWeight: '500',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1a1a2e')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
              >
                Help Center
              </a>
            </div>
          </footer>
        </div>
      </main>

      {cropImageSrc && (
        <ImageCropModal
          imageSrc={cropImageSrc}
          onCropDone={handleCroppedUpload}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
    </div>
  )
}

export default UserProfileSettings
