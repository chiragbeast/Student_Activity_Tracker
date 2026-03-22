import { useState, useEffect, useRef } from 'react'
import { FiEye, FiEyeOff, FiCamera } from 'react-icons/fi'
import { Loader2 } from 'lucide-react'
import { facultyApi } from '../services/api'
import api from '../api'
import ImageCropModal from './ImageCropModal'
import styles from './FacultyProfilePage.module.css'

export default function FacultyProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Accordion
  const [activeTab, setActiveTab] = useState('basic') // 'basic' | 'account' | null

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Notifications
  const [notifications, setNotifications] = useState(true)

  // Profile picture state
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)
  const [cropImageSrc, setCropImageSrc] = useState(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await facultyApi.getProfile()
      if (res.data.success) {
        setProfile(res.data.data)
        setNotifications(res.data.data.notificationsEnabled ?? true)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  // Password feedback
  const [pwMessage, setPwMessage] = useState('')
  const [pwError, setPwError] = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    setPwMessage('')
    setPwError('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('All password fields are required')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('New password and confirm password do not match')
      return
    }
    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters')
      return
    }

    try {
      const res = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      })
      setPwMessage(res.data.message || 'Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to update password')
    }
  }

  const handleDiscard = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setUploadError('Only JPG, PNG, and WEBP images are allowed')
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

      const res = await facultyApi.updateProfilePicture(formData)

      setProfile((prev) => ({ ...prev, profilePicture: res.data.profilePicture }))

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

  if (loading) {
    return (
      <div className={styles.loaderBox}>
        <Loader2 className={styles.spinner} size={40} />
        <p>Loading Profile...</p>
      </div>
    )
  }

  if (!profile) return <div className={styles.error}>Could not load profile data.</div>

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Faculty Profile & Settings</h1>
        <p className={styles.subtitle}>Manage your personal information and account security.</p>
      </header>

      <div className={styles.grid}>
        {/* Left: Profile Card */}
        <div className={styles.profileCard}>
          <div className={styles.avatarWrapper} onClick={() => fileInputRef.current?.click()}>
            <div className={`${styles.avatar} ${uploading ? styles.avatarUploading : ''}`}>
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={profile.name}
                  className={styles.avatarImage}
                />
              ) : (
                <span className={styles.avatarLetter}>
                  {profile.name?.charAt(0).toUpperCase() || 'F'}
                </span>
              )}
              <div className={styles.avatarOverlay}>
                <FiCamera className={styles.cameraIcon} />
              </div>
              {uploading && (
                <div className={styles.avatarLoading}>
                  <div className={styles.avatarSpinnerDot} />
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className={styles.fileInput}
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleProfilePicChange}
            />
          </div>
          {uploadError && <p className={styles.uploadError}>{uploadError}</p>}
          <h2 className={styles.name}>{profile.name}</h2>
          <p className={styles.department}>{profile.department || 'Academic Faculty'}</p>
          <p className={styles.email}>{profile.email}</p>

          <button
            className={styles.changePicBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : 'Change Profile Picture'}
          </button>

          <div className={styles.completionSection}>
            <div className={styles.completionHeader}>
              <span className={styles.completionLabel}>Active Status</span>
              <span className={styles.completionValue}>Verified</span>
            </div>
            <div className={styles.completionTrack}>
              <div
                className={styles.completionFill}
                style={{ width: '100%', backgroundColor: '#10b981' }}
              />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className={styles.rightCol}>
          {/* Accordion 1: Basic Info */}
          <div
            className={`${styles.accordionCard} ${activeTab === 'basic' ? styles.accordionOpen : ''}`}
          >
            <div
              className={styles.accordionHeader}
              onClick={() => setActiveTab(activeTab === 'basic' ? null : 'basic')}
            >
              <h2 className={styles.accordionTitle}>Basic Info</h2>
              <span className={styles.accordionIcon}>{activeTab === 'basic' ? '−' : '+'}</span>
            </div>
            {activeTab === 'basic' && (
              <div className={styles.accordionContent}>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Full Name</span>
                    <span className={styles.infoValue}>{profile.name || '—'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Email Address</span>
                    <span className={styles.infoValue}>{profile.email || '—'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Department</span>
                    <span className={styles.infoValue}>{profile.department || '—'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Contact Number</span>
                    <span className={styles.infoValue}>{profile.phone || '—'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Office Address</span>
                    <span className={styles.infoValue}>{profile.office || '—'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Role</span>
                    <span className={styles.infoValue}>{profile.role || '—'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 2: Account Settings */}
          <div
            className={`${styles.accordionCard} ${activeTab === 'account' ? styles.accordionOpen : ''}`}
          >
            <div
              className={styles.accordionHeader}
              onClick={() => setActiveTab(activeTab === 'account' ? null : 'account')}
            >
              <h2 className={styles.accordionTitle}>Account Settings</h2>
              <span className={styles.accordionIcon}>{activeTab === 'account' ? '−' : '+'}</span>
            </div>
            {activeTab === 'account' && (
              <div className={styles.accordionContent}>
                <h3 className={styles.settingsSubheading}>Update Password</h3>
                <p className={styles.settingsDesc}>
                  Ensure your account is using a long, random password to stay secure.
                </p>

                <form onSubmit={handleSave} className={styles.passwordForm}>
                  <label className={styles.fieldLabel}>Current Password</label>
                  <div className={styles.inputWrapper}>
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      className={styles.fieldInput}
                      placeholder="••••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.togglePw}
                      onClick={() => setShowCurrent(!showCurrent)}
                    >
                      {showCurrent ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>

                  <div className={styles.passwordRow}>
                    <div className={styles.passwordCol}>
                      <label className={styles.fieldLabel}>New Password</label>
                      <div className={styles.inputWrapper}>
                        <input
                          type={showNew ? 'text' : 'password'}
                          className={styles.fieldInput}
                          placeholder="••••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className={styles.togglePw}
                          onClick={() => setShowNew(!showNew)}
                        >
                          {showNew ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>
                    <div className={styles.passwordCol}>
                      <label className={styles.fieldLabel}>Confirm Password</label>
                      <div className={styles.inputWrapper}>
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          className={styles.fieldInput}
                          placeholder="••••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className={styles.togglePw}
                          onClick={() => setShowConfirm(!showConfirm)}
                        >
                          {showConfirm ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingsActions}>
                    <button type="button" className={styles.discardBtn} onClick={handleDiscard}>
                      Discard
                    </button>
                    <button type="submit" className={styles.saveBtn}>
                      Save Changes
                    </button>
                  </div>
                  {pwError && (
                    <p
                      style={{
                        color: '#ef4444',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        marginTop: '12px',
                      }}
                    >
                      {pwError}
                    </p>
                  )}
                  {pwMessage && (
                    <p
                      style={{
                        color: '#10b981',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        marginTop: '12px',
                      }}
                    >
                      {pwMessage}
                    </p>
                  )}
                </form>

                <hr className={styles.accordionDivider} />

                <h2 className={styles.settingsHeading}>Notifications</h2>
                <div className={styles.notifRow}>
                  <div>
                    <h3 className={styles.settingsSubheading} style={{ margin: 0 }}>
                      Notification Preferences
                    </h3>
                    <p className={styles.settingsDesc} style={{ margin: '4px 0 0' }}>
                      Stay updated with important activity alerts and system announcements.
                    </p>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                    />
                    <span className={styles.toggleSlider} />
                    <span className={styles.toggleLabel}>Receive alerts</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <span>© 2024 Student Activity Tracker. All rights reserved.</span>
        <div className={styles.footerLinks}>
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
