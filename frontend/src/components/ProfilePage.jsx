import { useState, useEffect, useRef } from 'react'
import { FiEye, FiEyeOff, FiCamera } from 'react-icons/fi'
import api from '../api'
import ImageCropModal from './ImageCropModal'
import './ProfilePage.css'

export default function ProfilePage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [activeTab, setActiveTab] = useState('basic') // 'basic', 'fa', 'account'
  const [profile, setProfile] = useState(null)
  const [notifications, setNotifications] = useState(true)
  const [loading, setLoading] = useState(true)

  // Profile picture state
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)
  const [cropImageSrc, setCropImageSrc] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/student/profile')
        setProfile(res.data)
        setNotifications(res.data.notificationsEnabled)
        setLoading(false)
      } catch (err) {
        console.error('Failed to load profile', err)
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSave = (e) => {
    e.preventDefault()
    console.log('Save changes', { currentPassword, newPassword, confirmPassword, notifications })
  }

  const handleDiscard = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setUploadError('Only JPG, PNG, and WEBP images are allowed')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be under 5 MB')
      return
    }

    setUploadError('')
    // Create a data URL and open the crop modal
    const reader = new FileReader()
    reader.onload = () => setCropImageSrc(reader.result)
    reader.readAsDataURL(file)

    // Reset file input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCroppedUpload = async (croppedBlob) => {
    setCropImageSrc(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('profilePicture', croppedBlob, 'profile.jpg')

      const res = await api.put('/student/profile/picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // Update profile state
      setProfile((prev) => ({ ...prev, profilePicture: res.data.profilePicture }))

      // Sync to localStorage so sidebar/header reflect it
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
      storedUser.profilePicture = res.data.profilePicture
      localStorage.setItem('user', JSON.stringify(storedUser))
    } catch (err) {
      console.error('Upload failed:', err)
      setUploadError(err.response?.data?.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>

  const userObj = profile || JSON.parse(localStorage.getItem('user') || '{}')

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <h1 className="profile-page-title">Student Profile & Settings</h1>
        <p className="profile-page-subtitle">
          Manage your personal information and account security.
        </p>
      </div>

      <div className="profile-grid">
        {/* Left: Profile Card */}
        <div className="profile-card">
          <div className="avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
            <div className={`avatar-circle ${uploading ? 'uploading' : ''}`}>
              {userObj.profilePicture ? (
                <img src={userObj.profilePicture} alt={userObj.name} className="avatar-image" />
              ) : (
                <span className="avatar-letter">{userObj.name?.charAt(0) || 'U'}</span>
              )}
              <div className="avatar-overlay">
                <FiCamera className="avatar-camera-icon" />
              </div>
              {uploading && (
                <div className="avatar-loading">
                  <div className="avatar-spinner" />
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="avatar-file-input"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleProfilePicChange}
            />
          </div>
          {uploadError && <p className="upload-error">{uploadError}</p>}
          <h2 className="profile-name">{userObj.name}</h2>
          <p className="profile-roll">Roll Number: {userObj.rollNumber || 'N/A'}</p>
          <p className="profile-email">{userObj.email}</p>

          <button
            className="change-pic-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : 'Change Profile Picture'}
          </button>

          <div className="completion-section">
            <div className="completion-header">
              <span className="completion-label">Active Status</span>
              <span className="completion-value">Verified</span>
            </div>
            <div className="completion-track">
              <div
                className="completion-fill"
                style={{ width: '100%', backgroundColor: '#10b981' }}
              />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="profile-right">
          {/* Accordion 1: Basic Info */}
          <div className={`accordion-card ${activeTab === 'basic' ? 'open' : ''}`}>
            <div
              className="accordion-header"
              onClick={() => setActiveTab(activeTab === 'basic' ? null : 'basic')}
            >
              <h2 className="accordion-title">Basic Info</h2>
              <span className="accordion-icon">{activeTab === 'basic' ? '−' : '+'}</span>
            </div>
            {activeTab === 'basic' && (
              <div className="accordion-content">
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Full Name</span>
                    <span className="info-value">{userObj.name || '—'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Roll Number</span>
                    <span className="info-value">{userObj.rollNumber || '—'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email Address</span>
                    <span className="info-value">{userObj.email || '—'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Branch</span>
                    <span className="info-value">{userObj.department || '—'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Batch</span>
                    <span className="info-value">{userObj.batch || '—'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Current Semester</span>
                    <span className="info-value">{userObj.semester || '—'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 2: Faculty Advisor Info */}
          <div className={`accordion-card ${activeTab === 'fa' ? 'open' : ''}`}>
            <div
              className="accordion-header"
              onClick={() => setActiveTab(activeTab === 'fa' ? null : 'fa')}
            >
              <h2 className="accordion-title">Faculty Advisor Info</h2>
              <span className="accordion-icon">{activeTab === 'fa' ? '−' : '+'}</span>
            </div>
            {activeTab === 'fa' && (
              <div className="accordion-content">
                {userObj.facultyAdvisor ? (
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Faculty Name</span>
                      <span className="info-value">{userObj.facultyAdvisor.name || '—'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email Address</span>
                      <span className="info-value">{userObj.facultyAdvisor.email || '—'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Office Details</span>
                      <span className="info-value">{userObj.facultyAdvisor.office || '—'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="no-data-msg">No faculty advisor assigned yet.</div>
                )}
              </div>
            )}
          </div>

          {/* Accordion 3: Account Settings */}
          <div className={`accordion-card ${activeTab === 'account' ? 'open' : ''}`}>
            <div
              className="accordion-header"
              onClick={() => setActiveTab(activeTab === 'account' ? null : 'account')}
            >
              <h2 className="accordion-title">Account Settings</h2>
              <span className="accordion-icon">{activeTab === 'account' ? '−' : '+'}</span>
            </div>
            {activeTab === 'account' && (
              <div className="accordion-content">
                <h3 className="settings-subheading">Update Password</h3>
                <p className="settings-desc">
                  Ensure your account is using a long, random password to stay secure.
                </p>

                <form onSubmit={handleSave} className="password-form">
                  <label className="prof-field-label">Current Password</label>
                  <div className="prof-input-wrapper">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      className="prof-field-input"
                      placeholder="••••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="prof-toggle-pw"
                      onClick={() => setShowCurrent(!showCurrent)}
                    >
                      {showCurrent ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>

                  <div className="password-row">
                    <div className="password-col">
                      <label className="prof-field-label">New Password</label>
                      <div className="prof-input-wrapper">
                        <input
                          type={showNew ? 'text' : 'password'}
                          className="prof-field-input"
                          placeholder="••••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="prof-toggle-pw"
                          onClick={() => setShowNew(!showNew)}
                        >
                          {showNew ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>
                    <div className="password-col">
                      <label className="prof-field-label">Confirm Password</label>
                      <div className="prof-input-wrapper">
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          className="prof-field-input"
                          placeholder="••••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="prof-toggle-pw"
                          onClick={() => setShowConfirm(!showConfirm)}
                        >
                          {showConfirm ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="settings-actions">
                    <button type="button" className="discard-btn" onClick={handleDiscard}>
                      Discard
                    </button>
                    <button type="submit" className="save-btn">
                      Save Changes
                    </button>
                  </div>
                </form>

                <hr className="accordion-divider" />

                <h2 className="settings-heading" style={{ marginTop: '24px' }}>
                  Notifications
                </h2>
                <div className="notif-row">
                  <div>
                    <h3 className="settings-subheading" style={{ margin: 0 }}>
                      Notification Preferences
                    </h3>
                    <p className="settings-desc" style={{ margin: '4px 0 0' }}>
                      Stay updated with important activity alerts and system announcements.
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                    />
                    <span className="toggle-slider" />
                    <span className="toggle-label">Receive alerts</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="profile-footer">
        <span>© 2024 Student Activity Tracker. All rights reserved.</span>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Help Center</a>
        </div>
      </footer>
      {/* Crop Modal */}
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
