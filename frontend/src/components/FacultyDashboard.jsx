import { useState, useEffect } from 'react'
import Sidebar from './FacultySidebar'
import StatCards from './FacultyStatCards'
import { Bell, X, Check, Info } from 'lucide-react'
import PendingSubmissions from './FacultyPendingSubmissions'
import PendingSubmissionsPage from './FacultyPendingSubmissionsPage'
import AssignedStudentsPage from './FacultyAssignedStudentsPage'
import ReviewDetailPage from './FacultyReviewDetailPage'
import ProfilePage from './FacultyProfilePage'
import { facultyApi, notificationApi } from '../services/api'
import styles from './FacultyDashboard.module.css'

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [reviewSubmission, setReviewSubmission] = useState(null)
  const [showNotif, setShowNotif] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [stats, setStats] = useState({ assignedStudents: 0, pendingReviews: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.getNotifications()
      setNotifications(res.data)
    } catch (err) {
      console.error('Error fetching notifications:', err)
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id)
      fetchNotifications()
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  useEffect(() => {
    if (activeNav === 'Dashboard') {
      fetchStats()
    }
  }, [activeNav])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await facultyApi.getStats()
      if (res.data.success) {
        setStats({
          assignedStudents: res.data.data.totalAssignedStudents,
          pendingReviews: res.data.data.pendingSubmissions
        })
      }
    } catch (err) {
      console.error('Error fetching faculty stats:', err)
    } finally {
      setLoading(false)
    }
  }

  // Called by any Review button — pass the submission object
  const openReview = (submission) => {
    if (submission === 'View All') {
      setActiveNav('Pending Submissions')
      return
    }
    setReviewSubmission(submission)
    setActiveNav('Review Detail')
  }

  // Called by breadcrumb "Submissions" link
  const closeReview = () => {
    setReviewSubmission(null)
    setActiveNav('Pending Submissions')
  }

  const renderPage = () => {
    switch (activeNav) {
      case 'Review Detail':
        return <ReviewDetailPage submission={reviewSubmission} onBack={closeReview} />
      case 'Assigned Students':
        return <AssignedStudentsPage />
      case 'Pending Submissions':
        return <PendingSubmissionsPage onReview={openReview} />
      case 'Profile':
        return <ProfilePage />
      case 'Dashboard':
      default:
        return (
          <>
            <div className={styles.dashHeader}>
              <h1 className={styles.dashTitle}>Faculty Dashboard</h1>
              <div className={styles.notifWrapper}>
                <button className={styles.bell} onClick={() => setShowNotif(!showNotif)}>
                  <Bell size={22} />
                  {Array.isArray(notifications) && notifications.filter(n => !n.read).length > 0 && (
                    <span className={styles.badge}>{notifications.filter(n => !n.read).length}</span>
                  )}
                </button>

                {showNotif && (
                  <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                      <h3>Notifications</h3>
                      <button className={styles.closeBtn} onClick={() => setShowNotif(false)}>
                        <X size={16} />
                      </button>
                    </div>
                    <div className={styles.notifList}>
                      {Array.isArray(notifications) && notifications.length > 0 ? notifications.map((n) => (
                        <div key={n._id} className={styles.notifItem} onClick={() => handleMarkRead(n._id)}>
                          <div className={`${styles.iconCircle} ${styles[n.read ? 'info' : 'success']}`}>
                            {n.read ? <Info size={14} /> : <Check size={14} />}
                          </div>
                          <div className={styles.notifContent}>
                            <p className={styles.notifText} style={{ fontWeight: n.read ? '400' : '600' }}>{n.message}</p>
                            <span className={styles.notifTime}>{new Date(n.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      )) : (
                        <div className={styles.emptyNotif || ''} style={{ padding: '20px', textAlign: 'center', color: '#aaa' }}>No new notifications.</div>
                      )}
                    </div>
                    <button className={styles.viewAllBtn}>View All Notifications</button>
                  </div>
                )}
              </div>
            </div>
            <StatCards assignedStudents={stats.assignedStudents} pendingReviews={stats.pendingReviews} />
            <PendingSubmissions onReviewClick={openReview} />
          </>
        )
    }
  }

  return (
    <div className={styles.layout}>
      <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />
      <div className={styles.main}>
        <div className={styles.content}>
          {renderPage()}
        </div>
      </div>
    </div>
  )
}
