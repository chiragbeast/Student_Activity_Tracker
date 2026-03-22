import React, { useState, useEffect } from 'react'
import {
  Search,
  Bell,
  X,
  Info,
  AlertTriangle,
  Check,
  MessageSquare,
  Megaphone,
  Clock,
} from 'lucide-react'
import api from '../api'
import styles from './NotificationCenter.module.css'

const TYPE_CONFIG = {
  submission_approved: { icon: Check, color: '#10b981', label: 'Approved' },
  submission_denied: { icon: X, color: '#ef4444', label: 'Denied' },
  submission_modified: { icon: Info, color: '#f5a623', label: 'Modified' },
  submission_returned: { icon: AlertTriangle, color: '#f5a623', label: 'Returned' },
  deadline_approaching: { icon: Clock, color: '#f43f5e', label: 'Deadline' },
  new_submission: { icon: MessageSquare, color: '#3b82f6', label: 'New Submission' },
  system_announcement: { icon: Megaphone, color: '#8b5cf6', label: 'System' },
  info: { icon: Info, color: '#64748b', label: 'Info' },
}

export default function NotificationCenter({ isPopup = false, onClose }) {
  const [notifications, setNotifications] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchNotifications = async () => {
      console.log('NotificationCenter: fetchNotifications started')
      try {
        setLoading(true)
        const res = await api.get('notifications')
        console.log('NotificationCenter: API Success', res.data)
        setNotifications(Array.isArray(res.data) ? res.data : [])
      } catch (err) {
        console.error('NotificationCenter: API Error', err)
      } finally {
        console.log('NotificationCenter: loading finished')
        setLoading(false)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkRead = async (id) => {
    try {
      await api.put(`notifications/${id}/read`)
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)))
    } catch (err) {
      console.error('Error marking as read:', err)
    }
  }

  const filteredNotifications = notifications.filter(
    (n) =>
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.message?.toLowerCase().includes(search.toLowerCase())
  )

  const content = (
    <div
      className={isPopup ? styles.popupContainer : styles.container}
      style={isPopup ? { backgroundColor: '#ffffff' } : {}}
    >
      {isPopup && (
        <button className={styles.closePopupBtn} onClick={onClose}>
          <X size={20} />
        </button>
      )}
      <header className={styles.header}>
        <div className={styles.titleSection}>
          <Bell color="#f5a623" size={24} />
          <h1>Notification Center</h1>
        </div>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Search notifications..."
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <section className={styles.feedWrapper}>
        <h2 className={styles.feedTitle}>Activity Feed</h2>
        <p className={styles.feedSubtitle}>
          Stay updated with your latest project movements and system alerts.
        </p>

        <div className={styles.scrollArea}>
          <div className={styles.notifList}>
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((n) => {
                const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.info
                const Icon = config.icon
                return (
                  <div
                    key={n._id}
                    className={`${styles.notifCard} ${!n.read ? styles.unread : ''}`}
                    onClick={() => handleMarkRead(n._id)}
                  >
                    <div className={styles.content}>
                      <h3 className={styles.notifTitle}>{n.message}</h3>
                      <p className={styles.notifSender}>
                        Sent by{' '}
                        {n.senderRole === 'System' || !n.senderRole
                          ? 'System'
                          : n.senderRole === 'Faculty'
                            ? 'Faculty Advisor'
                            : n.senderRole}
                        {n.sender && n.sender !== 'System' && n.sender !== 'System Admin'
                          ? ` (${n.sender})`
                          : n.sender === 'System Admin'
                            ? ` (${n.sender})`
                            : ''}
                      </p>
                    </div>
                    <div className={styles.time}>
                      {new Date(n.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                )
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                {loading ? 'Loading notifications...' : 'No notifications yet'}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )

  if (isPopup) {
    return (
      <div
        className={styles.popupOverlay}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {content}
      </div>
    )
  }

  return content
}
