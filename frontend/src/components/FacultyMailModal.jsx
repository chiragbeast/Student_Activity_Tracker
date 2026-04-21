import React, { useState } from 'react'
import { facultyApi } from '../services/api'
import styles from './FacultyMailModal.module.css'
import {
  X,
  Send,
  Award,
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle2,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react'

const MAIL_TEMPLATES = [
  {
    id: 'performance',
    title: 'Outstanding Performance',
    icon: <Award size={18} />,
    subject: 'Commendation for Student Activity Points Progress',
    body: (name) =>
      `Dear ${name},\n\nI am writing to commend you on your excellent progress in accumulating Student Activity Points this semester. Your consistent participation in diverse activities is exemplary.\n\nKeep up the great work!`,
  },
  {
    id: 'missing',
    title: 'Missing Documentation',
    icon: <AlertCircle size={18} />,
    subject: 'Action Required: Documentation for Activity Submissions',
    body: (name) =>
      `Dear ${name},\n\nI have reviewed your recent activity submissions and noticed that some required documentation is missing or unclear. Please log into the portal and update your proofs to avoid rejection.\n\nRegards, Faculty Advisor.`,
  },
  {
    id: 'meeting',
    title: 'Meeting Request',
    icon: <Calendar size={18} />,
    subject: 'Request for Meeting: Semester Progress Review',
    body: (name) =>
      `Dear ${name},\n\nI would like to discuss your semester progress and activity point tally. Please visit my office during office hours at your earliest convenience.\n\nBest regards.`,
  },
  {
    id: 'deadline',
    title: 'Deadline Warning',
    icon: <Clock size={18} />,
    subject: 'Urgent: Upcoming Deadline for Activity Submissions',
    body: (name) =>
      `Dear ${name},\n\nThis is a reminder that the semester deadline for submitting activity points is approaching. Ensure all your activities are uploaded and verified before the cutoff date to earn full credits.`,
  },
  {
    id: 'custom',
    title: 'Custom Message',
    icon: <MessageSquare size={18} />,
    subject: '',
    body: (name) => `Dear ${name},\n\n`,
  },
]

export default function MailModal({ isOpen, onClose, studentId, studentName, studentEmail }) {
  const [selectedTemplate, setSelectedTemplate] = useState(MAIL_TEMPLATES[0])
  const [subject, setSubject] = useState(MAIL_TEMPLATES[0].subject)
  const [body, setBody] = useState(MAIL_TEMPLATES[0].body(studentName || 'Student'))
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [emailError, setEmailError] = useState(null)

  const handleTemplateSelect = (tpl) => {
    setSelectedTemplate(tpl)
    setSubject(tpl.subject)
    setBody(tpl.body(studentName || 'Student'))
    setEmailError(null)
  }

  if (!isOpen) return null

  const handleSend = async () => {
    if (!studentEmail || studentEmail === 'N/A') {
      alert('No valid email found for this student.')
      return
    }

    setIsSending(true)
    setEmailError(null)
    try {
      const res = await facultyApi.notifyEmail(studentId, {
        reason: selectedTemplate.id,
        subject: subject,
        htmlContent: `
          <div style="background-color: #fdf7e9; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-top: 5px solid #f5a623; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(26, 26, 46, 0.05);">
              <div style="padding: 40px;">
                <h2 style="color: #1a1a2e; margin-top: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">SAPT: Faculty Communication</h2>
                <div style="height: 1px; background: #e2e8f0; margin: 24px 0;"></div>
                <p style="font-size: 16px; line-height: 1.8; color: #475569; white-space: pre-wrap;">${body}</p>
                <div style="margin-top: 40px; text-align: center;">
                  <a href="http://localhost:5173" style="display: inline-block; background-color: #f5a623; color: #1a1a2e; padding: 14px 32px; border-radius: 12px; font-weight: 800; text-decoration: none; font-size: 14px; box-shadow: 0 4px 12px rgba(245, 166, 35, 0.2);">Login to Dashboard</a>
                </div>
              </div>
              <div style="background-color: #f1f5f9; padding: 24px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0;">This is an automated communication from the Student Activity Points Tracker.</p>
                <p style="margin: 4px 0 0 0;">Please do not reply directly to this system email address.</p>
              </div>
            </div>
          </div>
        `,
      })

      if (res.data.success) {
        if (res.data.emailSent === false) {
          setEmailError(
            res.data.emailError || 'Email delivery failed. Please check your SendGrid settings.'
          )
          setIsSending(false)
        } else {
          setIsSent(true)
          setIsSending(false)
        }
      }
    } catch (err) {
      console.error('Failed to send mail:', err)
      const msg = err.response?.data?.message || 'Failed to send email. Please try again.'
      alert(msg)
      setIsSending(false)
    }
  }

  const handleClose = () => {
    onClose()
    // Reset state for next time
    setTimeout(() => {
      setIsSent(false)
      setIsSending(false)
    }, 300)
  }

  if (isSent) {
    return (
      <div className={styles.overlay} onClick={handleClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.successView}>
            <div className={styles.successIconBox}>
              <div className={styles.confetti}></div>
              <CheckCircle2 size={64} className={styles.successIcon} />
            </div>
            <h3 className={styles.successTitle}>Mail Sent Successfully!</h3>
            <p className={styles.successText}>
              Your message to <strong>{studentName}</strong> has been dispatched and a system
              notification has been sent.
            </p>
            <button className={styles.doneBtn} onClick={handleClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Send Mail: {studentName}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.content}>
          {emailError && (
            <div className={styles.errorBox}>
              <AlertTriangle className={styles.errorIcon} size={20} color="#ef4444" />
              <div className={styles.errorText}>
                <span className={styles.errorTitle}>Delivery Issue:</span>
                {emailError}
              </div>
            </div>
          )}

          <p className={styles.label}>Select a template or Write Custom:</p>
          <div className={styles.templatesGrid}>
            {MAIL_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                className={`${styles.templateCard} ${selectedTemplate.id === tpl.id ? styles.active : ''}`}
                onClick={() => handleTemplateSelect(tpl)}
              >
                <div className={styles.templateIcon}>{tpl.icon}</div>
                <div className={styles.templateTitle}>{tpl.title}</div>
              </button>
            ))}
          </div>

          <p className={styles.label}>Compose Email:</p>
          <div className={styles.previewArea}>
            <div className={styles.editorGroup}>
              <label className={styles.editorLabel}>Subject</label>
              <input
                type="text"
                className={styles.subjectInput}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject..."
              />
            </div>
            <div className={styles.editorGroup}>
              <label className={styles.editorLabel}>Message Body</label>
              <textarea
                className={styles.bodyTextarea}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your message here..."
              />
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.sendBtn} onClick={handleSend} disabled={isSending}>
            {isSending ? (
              'Sending...'
            ) : (
              <>
                <Send size={16} />
                Send Mail
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
