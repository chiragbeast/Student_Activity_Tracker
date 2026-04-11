import { useState, useEffect } from 'react'
import { facultyApi } from '../services/api'
import api from '../api'
import styles from './FacultyReviewDetailPage.module.css'

export default function ReviewDetailPage({ submission: initialSubmission, onBack }) {
  const [submission, setSubmission] = useState(initialSubmission)
  const [approvedPoints, setApprovedPoints] = useState(
    initialSubmission?.pointsRequested || initialSubmission?.points || 50
  )
  const [feedback, setFeedback] = useState('')
  const [status, setStatus] = useState(null) // null | 'approved' | 'rejected'
  const [loading, setLoading] = useState(false)
  const [downloadingGuidelines, setDownloadingGuidelines] = useState(false)

  // Fetch fresh details if we have an _id
  useEffect(() => {
    if (initialSubmission?._id) {
      fetchDetails(initialSubmission._id)
    }
  }, [initialSubmission])

  const fetchDetails = async (id) => {
    try {
      setLoading(true)
      const res = await facultyApi.getSubmissionDetails(id)
      if (res.data.success) {
        setSubmission(res.data.data)
        setApprovedPoints(res.data.data.pointsRequested || 0)
      }
    } catch (err) {
      console.error('Error fetching submission details:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (approvedPoints === '' || approvedPoints === null || approvedPoints === undefined) {
      alert('Approved points cannot be empty.')
      return
    }

    const points = Number(approvedPoints)
    if (!Number.isFinite(points) || points < 0) {
      alert('Approved points must be greater than or equal to 0.')
      return
    }

    try {
      setStatus('approved')
      await facultyApi.reviewSubmission(submission._id, {
        status: 'Approved',
        pointsApproved: points,
        reviewComments: feedback || 'Submission approved.',
      })
      setTimeout(() => onBack(), 1500)
    } catch {
      alert('Failed to approve submission')
      setStatus(null)
    }
  }

  const handleReject = async () => {
    if (!feedback) {
      alert('Feedback is required for rejection.')
      return
    }
    try {
      setStatus('rejected')
      await facultyApi.reviewSubmission(submission._id, {
        status: 'Denied',
        reviewComments: feedback,
      })
      setTimeout(() => onBack(), 1500)
    } catch {
      alert('Failed to reject submission')
      setStatus(null)
    }
  }

  const handleDownloadGuidelines = async () => {
    try {
      setDownloadingGuidelines(true)
      const { data } = await api.get('/brochure/current')
      const brochure = data?.brochure

      if (!brochure?.brochureUrl) {
        alert('Guidelines brochure is not available yet.')
        return
      }

      try {
        const response = await fetch(brochure.brochureUrl)
        if (!response.ok) {
          throw new Error('Failed to fetch brochure')
        }

        const blob = await response.blob()
        const objectUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = objectUrl
        link.download = brochure.fileName || 'guidelines-brochure'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(objectUrl)
      } catch {
        window.open(brochure.brochureUrl, '_blank', 'noopener,noreferrer')
      }
    } catch {
      alert('Failed to download guidelines.')
    } finally {
      setDownloadingGuidelines(false)
    }
  }

  if (loading || !submission)
    return <div className={styles.loading}>Loading submission details...</div>

  // Map backend object to UI fields
  const uiData = {
    name: submission.student?.name || submission.name || 'Unknown',
    studentId: submission.student?.rollNumber || submission.studentId || 'N/A',
    department: submission.student?.department || submission.department || 'N/A',
    submittedOn: submission.createdAt
      ? new Date(submission.createdAt).toLocaleDateString()
      : submission.submittedOn || 'N/A',
    activity: submission.activityName || submission.activity || 'N/A',
    description: submission.description || submission.notes || '',
    category: submission.activityLevel || submission.category || 'N/A',
    categoryType: (
      submission.activityLevel ||
      submission.categoryType ||
      'institute'
    ).toLowerCase(),
    fileName: submission.documents?.[0]?.fileName || submission.fileName || 'Proof.pdf',
    fileSize: submission.documents?.[0]?.fileSize
      ? `${(submission.documents[0].fileSize / 1024).toFixed(1)} KB`
      : submission.fileSize || 'N/A',
    fileUrl: submission.documents?.[0]?.fileUrl || null,
    points: submission.pointsRequested || submission.points || 0,
    lastUpdated: submission.updatedAt
      ? new Date(submission.updatedAt).toLocaleString()
      : submission.lastUpdated || 'N/A',
  }

  return (
    <div className={styles.page}>
      {/* -- Breadcrumb -- */}
      <nav className={styles.breadcrumb}>
        <button className={styles.breadcrumbLink} onClick={onBack}>
          Submissions
        </button>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
          <path
            d="M9 18l6-6-6-6"
            stroke="#aaa"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className={styles.breadcrumbCurrent} data-testid="faculty-review-detail-title">
          Review Detail
        </span>
      </nav>

      {status && (
        <div className={`${styles.toast} ${styles[status]}`}>
          {status === 'approved'
            ? '✅ Submission approved successfully!'
            : '❌ Submission has been rejected.'}
        </div>
      )}

      <div className={styles.layout}>
        {/* -- Left Column -- */}
        <div className={styles.left}>
          {/* Student Card */}
          <div className={styles.card}>
            <div className={styles.studentRow}>
              <div className={styles.studentAvatar}>
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
                  <circle cx="26" cy="26" r="26" fill="#ddd" />
                  <circle cx="26" cy="20" r="9" fill="#bbb" />
                  <ellipse cx="26" cy="42" rx="14" ry="10" fill="#aaa" />
                </svg>
              </div>
              <div className={styles.studentInfo}>
                <h2 className={styles.studentName}>{uiData.name}</h2>
                <p className={styles.studentMeta}>
                  ID: {uiData.studentId} • {uiData.department}
                </p>
                <span className={styles.pendingBadge}>PENDING REVIEW</span>
              </div>
              <div className={styles.submittedOn}>
                <span className={styles.submittedLabel}>Submitted on</span>
                <span className={styles.submittedDate}>{uiData.submittedOn}</span>
              </div>
            </div>
          </div>

          {/* Activity Details Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <path
                    d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                    stroke="#f5a623"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 2v6h6M8 13h8M8 17h5"
                    stroke="#f5a623"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <h3 className={styles.cardTitle}>Activity Submission Details</h3>
            </div>

            <h4 className={styles.activityTitle}>{uiData.activity}</h4>
            <p className={styles.activityDesc}>{uiData.description}</p>

            <div className={styles.categoryBox}>
              <span className={styles.categoryLabel}>CATEGORY</span>
              <span
                className={`
                ${styles.categoryValue} 
                ${uiData.categoryType === 'department' ? styles.departmentText : ''}
                ${uiData.categoryType === 'institute' ? styles.instituteText : ''}
              `}
              >
                {uiData.category}
              </span>
            </div>

            {/* Proof Upload Area */}
            <div className={styles.proofBox}>
              <div className={styles.proofContent}>
                <div className={styles.pdfIcon}>
                  <svg width="40" height="48" viewBox="0 0 40 48" fill="none">
                    <rect x="0" y="0" width="36" height="44" rx="4" fill="#e8ecf0" />
                    <rect x="4" y="4" width="36" height="44" rx="4" fill="#d0d8e0" />
                    <rect x="6" y="6" width="28" height="36" rx="3" fill="#fff" />
                    <text
                      x="14"
                      y="28"
                      fontSize="10"
                      fontWeight="700"
                      fill="#5a7a9a"
                      fontFamily="sans-serif"
                    >
                      PDF
                    </text>
                  </svg>
                </div>
                <p className={styles.fileName}>{uiData.fileName}</p>
                <p className={styles.fileSize}>
                  {uiData.fileSize} • Preview not available for this format
                </p>
                <button
                  className={styles.reviewProofBtn}
                  onClick={() => {
                    if (!uiData.fileUrl) return

                    const width = 1000
                    const height = 800
                    const left = window.screen.width / 2 - width / 2
                    const top = window.screen.height / 2 - height / 2

                    window.open(
                      uiData.fileUrl,
                      'Review Proof',
                      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
                    )
                  }}
                >
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                    <path
                      d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  Review Proof
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* -- Right Column -- */}
        <div className={styles.right}>
          <div className={styles.card}>
            <h3 className={styles.evalTitle}>Point Evaluation</h3>

            <div className={styles.evalSection}>
              <label className={styles.evalLabel}>Requested Points</label>
              <p
                className={`
                ${styles.requestedPoints} 
                ${uiData.categoryType === 'department' ? styles.departmentText : ''}
                ${uiData.categoryType === 'institute' ? styles.instituteText : ''}
              `}
              >
                {uiData.points}.0
              </p>
            </div>

            <div className={styles.evalSection}>
              <label className={styles.evalLabel}>Approved Points</label>
              <div className={styles.pointsInputWrapper}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className={styles.pointsInput}
                  value={approvedPoints}
                  onChange={(e) => setApprovedPoints(e.target.value)}
                />
                <span className={styles.ptsSuffix}>PTS</span>
              </div>
            </div>

            <div className={styles.evalSection}>
              <label className={styles.evalLabel}>Reviewer Feedback</label>
              <textarea
                className={styles.feedbackTextarea}
                placeholder="Add comments for the student..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
              />
            </div>

            <div className={styles.actionButtons}>
              <button
                className={`${styles.approveBtn} ${status === 'approved' ? styles.activatedApprove : ''}`}
                onClick={handleApprove}
                disabled={!!status}
              >
                Approve Submission
              </button>

              <button
                className={`${styles.rejectBtn} ${status === 'rejected' ? styles.activatedReject : ''}`}
                onClick={handleReject}
                disabled={!!status}
              >
                Reject Submission
              </button>

              <button
                className={styles.downloadGuidelinesBtn}
                onClick={handleDownloadGuidelines}
                disabled={downloadingGuidelines}
              >
                {downloadingGuidelines ? 'Downloading...' : 'Download Guidelines'}
              </button>
            </div>

            <div className={styles.lastUpdated}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" stroke="#bbb" strokeWidth="2" />
                <path d="M12 7v5l3 3" stroke="#bbb" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>Student last updated: {uiData.lastUpdated}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
