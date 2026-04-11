import { useState, useRef, useEffect } from 'react'
import { FiBell, FiCheck, FiX, FiEdit3, FiAlertCircle } from 'react-icons/fi'
import { BsBellFill } from 'react-icons/bs'
import api from '../api'
import NotificationCenter from './NotificationCenter'
import { onNotification, offNotification } from '../services/socket' // [NEW] Import socket listeners
import './NotificationPanel.css'

const ICON_MAP = {
  submission_approved: FiCheck,
  submission_denied: FiX,
  submission_returned: FiEdit3,
  deadline_alert: FiAlertCircle,
  info: FiAlertCircle,
  Approved: FiCheck,
  Denied: FiX,
  Returned: FiEdit3,
}

function getInitials(name) {
  if (!name || name === 'System') return null
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return parts[0].substring(0, 2).toUpperCase()
}

export default function NotificationPanel({
  hideTrigger = false,
  open: controlledOpen,
  onOpenChange,
  onViewAllNotifications,
  closeOnOutsideClick = true,
  panelClassName = '',
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showPopup, setShowPopup] = useState(false)
  const panelRef = useRef(null)

  const isOpenControlled = typeof controlledOpen === 'boolean'
  const open = isOpenControlled ? controlledOpen : internalOpen

  const setOpen = (nextValue) => {
    if (!isOpenControlled) {
      setInternalOpen(nextValue)
    }
    onOpenChange?.(nextValue)
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  async function fetchNotifications() {
    try {
      const res = await api.get('notifications')
      setNotifications(res.data)
    } catch (error) {
      console.error('Failed to fetch notifications', error)
    }
  }

  useEffect(() => {
    const initialFetchTimer = setTimeout(() => {
      fetchNotifications()
    }, 0)
    const interval = setInterval(fetchNotifications, 15000)

    // [NEW] Listen for live notifications
    const handleLiveNotification = (notification) => {
      setNotifications((prev) => {
        // Prevent duplicate if polling also fetched it
        if (prev.find((n) => n._id === notification._id)) return prev
        return [notification, ...prev]
      })
    }

    onNotification(handleLiveNotification)

    return () => {
      clearTimeout(initialFetchTimer)
      clearInterval(interval)
      offNotification(handleLiveNotification)
    }
  }, [])

  useEffect(() => {
    if (!closeOnOutsideClick) {
      return undefined
    }

    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [closeOnOutsideClick])

  const markAllRead = async () => {
    try {
      setNotifications(notifications.map((n) => ({ ...n, read: true })))
      await api.put('notifications/mark-all-read')
    } catch (err) {
      console.error(err)
    }
  }

  const markRead = async (id) => {
    try {
      setNotifications(notifications.map((n) => (n._id === id ? { ...n, read: true } : n)))
      await api.put(`notifications/${id}/read`)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <div className="notif-wrapper" ref={panelRef}>
        {!hideTrigger && (
          <button
            className="notification-btn"
            aria-label="Notifications"
            onClick={() => setOpen(!open)}
          >
            {unreadCount > 0 ? <BsBellFill /> : <FiBell />}
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>
        )}

        {open && (
          <div className={`notif-panel ${panelClassName}`.trim()}>
            <div className="notif-panel-header">
              <h3 className="notif-panel-title">Notifications</h3>
              {unreadCount > 0 && (
                <button className="notif-mark-all" onClick={markAllRead}>
                  Mark all as read
                </button>
              )}
            </div>

            <div className="notif-list">
              {notifications.length === 0 ? (
                <div
                  style={{
                    padding: '1rem',
                    textAlign: 'center',
                    color: '#6b7280',
                    fontSize: '0.9rem',
                  }}
                >
                  No notifications
                </div>
              ) : (
                <>
                  {notifications.slice(0, 3).map((n) => {
                    const Icon = ICON_MAP[n.type] || FiAlertCircle
                    const isSystem =
                      !n.sender || n.sender === 'System' || n.sender === 'System Admin'
                    const initials = !isSystem ? getInitials(n.sender) : null

                    return (
                      <div
                        key={n._id}
                        className={`notif-item ${n.read ? '' : 'unread'}`}
                        onClick={() => markRead(n._id)}
                      >
                        <div
                          className={`notif-icon notif-icon-${(n.type || 'info').toLowerCase()}`}
                        >
                          {initials ? (
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                              {initials}
                            </span>
                          ) : (
                            <Icon />
                          )}
                        </div>
                        <div className="notif-content">
                          <p
                            className="notif-message"
                            style={{ fontWeight: '600', color: '#111827', marginBottom: '2px' }}
                          >
                            {n.message}
                          </p>
                          <div className="notif-message-header">
                            <span
                              className="notif-sender"
                              style={{ fontWeight: '400', fontSize: '0.75rem', color: '#6b7280' }}
                            >
                              Sent by{' '}
                              {n.senderRole === 'Faculty'
                                ? 'Faculty Advisor'
                                : n.senderRole || 'System'}
                              {n.sender && n.sender !== 'System' && n.sender !== 'System Admin'
                                ? ` (${n.sender})`
                                : n.sender === 'System Admin'
                                  ? ` (${n.sender})`
                                  : ''}
                            </span>
                            <span className="notif-time">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {n.read ? (
                          <FiCheck
                            className="notif-read-tick"
                            style={{ color: '#10b981', marginLeft: 'auto' }}
                          />
                        ) : (
                          <span className="notif-unread-dot" />
                        )}
                      </div>
                    )
                  })}
                  <button
                    className="notif-view-all"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: 'none',
                      background: '#f8fafc',
                      color: '#f5a623',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                    }}
                    onClick={() => {
                      setOpen(false)
                      if (onViewAllNotifications) {
                        onViewAllNotifications()
                      } else {
                        setShowPopup(true)
                      }
                    }}
                  >
                    View All Notifications
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      {showPopup && <NotificationCenter isPopup={true} onClose={() => setShowPopup(false)} />}
    </>
  )
}
