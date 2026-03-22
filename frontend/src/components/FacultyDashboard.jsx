import { useState, useEffect } from 'react'
import Sidebar from './FacultySidebar'
import StatCards from './FacultyStatCards'
import { Bell, X, Check, Info } from 'lucide-react'
import PendingSubmissions from './FacultyPendingSubmissions'
import PendingSubmissionsPage from './FacultyPendingSubmissionsPage'
import AssignedStudentsPage from './FacultyAssignedStudentsPage'
import ReviewDetailPage from './FacultyReviewDetailPage'
import ProfilePage from './FacultyProfilePage'
import DeadlinesPage from './FacultyDeadlinesPage'
import NotificationCenter from './NotificationCenter'
import { facultyApi, notificationApi } from '../services/api'
import './NotificationPanel.css'
import styles from './FacultyDashboard.module.css'

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [reviewSubmission, setReviewSubmission] = useState(null)
  const [showNotif, setShowNotif] = useState(false)
  const [showAllNotif, setShowAllNotif] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [stats, setStats] = useState({ assignedStudents: 0, pendingReviews: 0 })
  const unreadCount = Array.isArray(notifications) ? notifications.filter((n) => !n.read).length : 0

  async function fetchNotifications() {
    try {
      const res = await notificationApi.getNotifications()
      setNotifications(res.data)
    } catch (err) {
      console.error('Error fetching notifications:', err)
    }
  }

  async function fetchStats() {
    try {
      const res = await facultyApi.getStats()
      if (res.data.success) {
        setStats({
          assignedStudents: res.data.data.totalAssignedStudents,
          pendingReviews: res.data.data.pendingSubmissions,
        })
      }
    } catch (err) {
      console.error('Error fetching faculty stats:', err)
    }
  }

  useEffect(() => {
    const initialFetchTimer = setTimeout(() => {
      fetchNotifications()
    }, 0)
    const interval = setInterval(fetchNotifications, 30000)
    return () => {
      clearTimeout(initialFetchTimer)
      clearInterval(interval)
    }
  }, [])

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
      const statsFetchTimer = setTimeout(() => {
        fetchStats()
      }, 0)
      return () => clearTimeout(statsFetchTimer)
    }
  }, [activeNav])

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
      case 'Manage Deadlines':
        return <DeadlinesPage />
      case 'Profile':
        return <ProfilePage />
      case 'Dashboard':
      default:
        return (
          <>
            <div className={styles.dashHeader}>
              <h1 className={styles.dashTitle}>Faculty Dashboard</h1>
              <div className={styles.notifWrapper}>
                <button className="notification-btn" onClick={() => setShowNotif(!showNotif)}>
                  <Bell size={22} fill={unreadCount > 0 ? 'currentColor' : 'none'} />
                  {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
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
                      {Array.isArray(notifications) && notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            className={styles.notifItem}
                            onClick={() => handleMarkRead(n._id)}
                          >
                            <div
                              className={`${styles.iconCircle} ${styles[n.read ? 'info' : 'success']}`}
                            >
                              {n.read ? <Info size={14} /> : <Check size={14} />}
                            </div>
                            <div className={styles.notifContent}>
                              <p
                                className={styles.notifText}
                                style={{
                                  fontWeight: n.read ? '500' : '700',
                                  marginBottom: '2px',
                                  fontSize: '0.85rem',
                                }}
                              >
                                {n.message}
                              </p>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <span
                                  className={styles.notifSenderInfo}
                                  style={{ fontSize: '0.72rem', color: '#64748b' }}
                                >
                                  Sent by{' '}
                                  {n.senderRole === 'Student'
                                    ? 'Student'
                                    : n.senderRole || 'System'}
                                  {n.sender && n.sender !== 'System' && n.sender !== 'System Admin'
                                    ? ` (${n.sender})`
                                    : n.sender === 'System Admin'
                                      ? ` (${n.sender})`
                                      : ''}
                                </span>
                                <span className={styles.notifTime} style={{ fontSize: '0.7rem' }}>
                                  {new Date(n.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div
                          className={styles.emptyNotif || ''}
                          style={{ padding: '20px', textAlign: 'center', color: '#aaa' }}
                        >
                          No new notifications.
                        </div>
                      )}
                    </div>
                    <button
                      className={styles.viewAllBtn}
                      onClick={() => {
                        setShowNotif(false)
                        setShowAllNotif(true)
                      }}
                    >
                      View All Notifications
                    </button>
                  </div>
                )}
              </div>
            </div>
            <StatCards
              assignedStudents={stats.assignedStudents}
              pendingReviews={stats.pendingReviews}
            />
            <PendingSubmissions onReviewClick={openReview} />
          </>
        )
    }
  }

  return (
    <>
      <div className={styles.layout}>
        <Sidebar activeNav={activeNav} onNavChange={setActiveNav} />
        <div className={styles.main}>
          <div className={styles.content}>{renderPage()}</div>
        </div>
      </div>
      {showAllNotif && <NotificationCenter isPopup={true} onClose={() => setShowAllNotif(false)} />}
    </>
  )
}
