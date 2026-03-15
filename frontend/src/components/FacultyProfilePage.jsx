import { useState, useEffect } from 'react'
import { Mail, Phone, MapPin, Briefcase, User, Loader2 } from 'lucide-react'
import { facultyApi } from '../services/api'
import styles from './FacultyProfilePage.module.css'

export default function FacultyProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await facultyApi.getProfile()
      if (res.data.success) {
        setProfile(res.data.data)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
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
      <header className={styles.header}>
        <h1 className={styles.title}>My Profile</h1>
        <p className={styles.subtitle}>View and manage your academic profile information.</p>
      </header>

      <div className={styles.grid}>
        {/* Profile Card */}
        <div className={styles.profileCard}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatar}>
              {profile.name?.charAt(0).toUpperCase()}
            </div>
            <div className={styles.roleBadge}>{profile.role}</div>
          </div>
          <h2 className={styles.name}>{profile.name}</h2>
          <p className={styles.department}>{profile.department || 'Academic Faculty'}</p>
        </div>

        {/* Info Grid */}
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <div className={styles.iconCircle}>
              <User size={20} />
            </div>
            <div className={styles.infoBody}>
              <span className={styles.label}>Full Name</span>
              <span className={styles.value}>{profile.name}</span>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.iconCircle}>
              <Briefcase size={20} />
            </div>
            <div className={styles.infoBody}>
              <span className={styles.label}>Position / Department</span>
              <span className={styles.value}>{profile.department || 'N/A'}</span>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.iconCircle}>
              <Mail size={20} />
            </div>
            <div className={styles.infoBody}>
              <span className={styles.label}>Email Address</span>
              <span className={styles.value}>{profile.email}</span>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.iconCircle}>
              <Phone size={20} />
            </div>
            <div className={styles.infoBody}>
              <span className={styles.label}>Contact Number</span>
              <span className={styles.value}>{profile.phone || 'Not Provided'}</span>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.iconCircle}>
              <MapPin size={20} />
            </div>
            <div className={styles.infoBody}>
              <span className={styles.label}>Office Address</span>
              <span className={styles.value}>{profile.office || 'Not Provided'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
