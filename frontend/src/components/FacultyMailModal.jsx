import React, { useState } from 'react'
import { facultyApi } from '../services/api'
import styles from './FacultyMailModal.module.css'
import { X, Send, Award, AlertCircle, Calendar, Clock, CheckCircle2 } from 'lucide-react'

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
]

export default function MailModal({ isOpen, onClose, studentId, studentName, studentEmail }) {
  const [selectedTemplate, setSelectedTemplate] = useState(MAIL_TEMPLATES[0])
  const [isSending, setIsSending] = useState(false)
  const [isSent, setIsSent] = useState(false)

  if (!isOpen) return null

  const handleSend = async () => {
    if (!studentEmail || studentEmail === 'N/A') {
      alert('No valid email found for this student.')
      return
    }

    setIsSending(true)
    try {
      await facultyApi.notifyEmail(studentId, {
        reason: selectedTemplate.id,
        subject: selectedTemplate.subject,
        htmlContent: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
            <h2 style="color: #f5a623;">SAPT: Faculty Communication</h2>
            <p style="font-size: 16px; line-height: 1.6;">${selectedTemplate.body(studentName).replace(/\n/g, '<br/>')}</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #999;">Sent via Student Activity Points Tracker (SAPT)</p>
          </div>
        `,
      })
      setIsSent(true)
      setIsSending(false)
    } catch (err) {
      console.error('Failed to send mail:', err)
      alert('Failed to send email. Please try again.')
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
          <p className={styles.label}>Select a prestructured template:</p>
          <div className={styles.templatesGrid}>
            {MAIL_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                className={`${styles.templateCard} ${selectedTemplate.id === tpl.id ? styles.active : ''}`}
                onClick={() => setSelectedTemplate(tpl)}
              >
                <div className={styles.templateIcon}>{tpl.icon}</div>
                <div className={styles.templateTitle}>{tpl.title}</div>
              </button>
            ))}
          </div>

          <p className={styles.label}>Message Preview:</p>
          <div className={styles.previewArea}>
            <div className={styles.previewHeader}>Subject:</div>
            <div className={styles.previewSubject}>{selectedTemplate.subject}</div>
            <div className={styles.previewBody}>{selectedTemplate.body(studentName)}</div>
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
