import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FiUploadCloud, FiFileText, FiTrash2, FiExternalLink } from 'react-icons/fi'
import GuidelinesModal from './GuidelinesModal'
import api from '../api'
import './ActivitySubmissionForm.css'

const WORD_MIME_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const isWordBrochure = (brochure) => {
  const fileName = (brochure?.fileName || '').toLowerCase()
  return (
    WORD_MIME_TYPES.includes(brochure?.fileMimeType) ||
    fileName.endsWith('.doc') ||
    fileName.endsWith('.docx')
  )
}

export default function ActivitySubmissionForm() {
  const navigate = useNavigate()
  const { id } = useParams() // optional — present when editing a draft/submission
  const fileInputRef = useRef(null)

  const [activityName, setActivityName] = useState('')
  const [activityLevel, setActivityLevel] = useState('Department')
  const [requestedPoints, setRequestedPoints] = useState(0)
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState([]) // new files to upload
  const [existingDocs, setExistingDocs] = useState([]) // already-uploaded docs from server
  const [dragActive, setDragActive] = useState(false)
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [guidelinesLoading, setGuidelinesLoading] = useState(false)
  const [guidelinesError, setGuidelinesError] = useState('')
  const [guidelinesBrochureUrl, setGuidelinesBrochureUrl] = useState('')
  const [guidelinesBrochureFileName, setGuidelinesBrochureFileName] = useState('')
  const [guidelinesBrochureMimeType, setGuidelinesBrochureMimeType] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [loadingDraft, setLoadingDraft] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ── Load existing submission when editing ──
  useEffect(() => {
    if (!id) return
    setLoadingDraft(true)
    api
      .get(`/submissions/${id}`)
      .then((res) => {
        const sub = res.data
        setActivityName(sub.activityName || '')
        setActivityLevel(sub.activityLevel || 'Department')
        setRequestedPoints(sub.pointsRequested || 0)
        setNotes(sub.notes || '')
        setExistingDocs(sub.documents || [])
        setIsEditing(true)
      })
      .catch((err) => {
        console.error('Failed to load submission', err)
        alert('Could not load submission data')
      })
      .finally(() => setLoadingDraft(false))
  }, [id])

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles([...files, ...Array.from(e.dataTransfer.files)])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles([...files, ...Array.from(e.target.files)])
    }
  }

  // ── Build FormData and submit ──
  const buildFormData = (status) => {
    const fd = new FormData()
    fd.append('activityName', activityName)
    fd.append('activityLevel', activityLevel)
    fd.append('pointsRequested', requestedPoints)
    fd.append('notes', notes)
    fd.append('status', status)
    files.forEach((file) => {
      fd.append('files', file)
    })
    return fd
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const fd = buildFormData('Pending')
      const config = { headers: { 'Content-Type': 'multipart/form-data' } }
      if (isEditing) {
        await api.put(`/submissions/${id}`, fd, config)
      } else {
        await api.post('/submissions', fd, config)
      }
      navigate('/submissions')
    } catch (error) {
      console.error('Failed to submit activity', error)
      alert('Error submitting activity')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveDraft = async () => {
    setSubmitting(true)
    try {
      const fd = buildFormData('Draft')
      const config = { headers: { 'Content-Type': 'multipart/form-data' } }
      if (isEditing) {
        await api.put(`/submissions/${id}`, fd, config)
      } else {
        await api.post('/submissions', fd, config)
      }
      navigate('/submissions')
    } catch (error) {
      console.error('Failed to save draft', error)
      alert('Error saving draft')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Remove an already-uploaded doc from Cloudinary ──
  const handleRemoveExistingDoc = async (docId) => {
    if (!window.confirm('Remove this uploaded document?')) return
    try {
      const res = await api.delete(`/submissions/${id}/documents/${docId}`)
      setExistingDocs(res.data.documents)
    } catch (error) {
      console.error('Failed to remove document', error)
      alert('Error removing document')
    }
  }

  const handleOpenGuidelines = async () => {
    setGuidelinesLoading(true)
    setGuidelinesError('')
    setGuidelinesBrochureUrl('')
    setGuidelinesBrochureFileName('')
    setGuidelinesBrochureMimeType('')

    try {
      const { data } = await api.get('/brochure/current')
      const brochure = data?.brochure

      if (!brochure?.brochureUrl) {
        setShowGuidelines(true)
        return
      }

      if (isWordBrochure(brochure)) {
        try {
          const response = await fetch(brochure.brochureUrl)
          if (!response.ok) {
            throw new Error('Failed to fetch brochure')
          }

          const blob = await response.blob()
          const objectUrl = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = objectUrl
          link.download = brochure.fileName || 'points-brochure'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(objectUrl)
        } catch {
          window.open(brochure.brochureUrl, '_blank', 'noopener,noreferrer')
        }
        return
      }

      setGuidelinesBrochureUrl(brochure.brochureUrl)
      setGuidelinesBrochureFileName(brochure.fileName || '')
      setGuidelinesBrochureMimeType(brochure.fileMimeType || '')
      setShowGuidelines(true)
    } catch (error) {
      setGuidelinesError(error.response?.data?.message || 'Failed to load brochure.')
      setShowGuidelines(true)
    } finally {
      setGuidelinesLoading(false)
    }
  }

  return (
    <div className="submission-form-page">
      {/* Guidelines Modal */}
      {showGuidelines && (
        <GuidelinesModal
          onClose={() => setShowGuidelines(false)}
          brochureUrl={guidelinesBrochureUrl}
          brochureFileName={guidelinesBrochureFileName}
          brochureMimeType={guidelinesBrochureMimeType}
          loading={guidelinesLoading}
          error={guidelinesError}
        />
      )}

      {/* Loading state */}
      {loadingDraft ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
          Loading submission data...
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="form-page-header">
            <div>
              <h1 className="form-page-title">
                {isEditing ? 'Edit Submission' : 'Activity Submission'}
              </h1>
              <p className="form-page-subtitle">
                {isEditing
                  ? 'Update your activity details and upload documents.'
                  : 'Submit your activity details for point verification.'}
              </p>
            </div>
            <button type="button" className="guidelines-link" onClick={handleOpenGuidelines}>
              <FiFileText className="guidelines-icon" />
              Download Guidelines
            </button>
          </div>

          <form className="submission-form" onSubmit={handleSubmit}>
            {/* Activity Details Section */}
            <div className="form-section">
              <h2 className="section-heading">Activity Details</h2>

              <label className="field-label">Activity Name</label>
              <input
                type="text"
                className="field-input"
                placeholder="e.g., Annual Tech Symposium 2024"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
              />

              <label className="field-label">Activity Level</label>
              <div className="level-toggle">
                <button
                  type="button"
                  className={`level-btn ${activityLevel === 'Department' ? 'active' : ''}`}
                  onClick={() => setActivityLevel('Department')}
                >
                  Department Level
                </button>
                <button
                  type="button"
                  className={`level-btn ${activityLevel === 'Institute' ? 'active' : ''}`}
                  onClick={() => setActivityLevel('Institute')}
                >
                  Institute Level
                </button>
              </div>
            </div>

            {/* Points Request Section */}
            <h2 className="section-heading">Points Request</h2>

            <label className="field-label">Requested Points</label>
            <input
              type="number"
              className="field-input field-input-sm"
              min="0"
              value={requestedPoints}
              onChange={(e) => setRequestedPoints(Number(e.target.value))}
            />
            <p className="field-tip">
              Tip: Refer to the handbook for standard point values per activity level.
            </p>

            {/* Supporting Documents Section */}
            <h2 className="section-heading">Supporting Documents</h2>

            {/* Show already-uploaded documents when editing */}
            {existingDocs.length > 0 && (
              <div className="file-list" style={{ marginBottom: '1rem' }}>
                <p className="field-label" style={{ marginBottom: '0.5rem' }}>
                  Uploaded Documents
                </p>
                {existingDocs.map((doc) => (
                  <div
                    className="file-item"
                    key={doc._id}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        color: '#4C9AFF',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <FiExternalLink size={14} />
                      {doc.fileName}
                    </a>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                      {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : ''}
                    </span>
                    <button
                      type="button"
                      className="file-remove"
                      onClick={() => handleRemoveExistingDoc(doc._id)}
                      title="Remove document"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <FiUploadCloud className="drop-zone-icon" />
              <p className="drop-zone-text">Drag and drop files here</p>
              <p className="drop-zone-hint">PDF, JPG or PNG up to 10MB</p>
              <span className="drop-zone-browse">Or browse files</span>
              <input
                ref={fileInputRef}
                type="file"
                className="drop-zone-input"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={handleFileSelect}
              />
            </div>

            {files.length > 0 && (
              <div className="file-list">
                <p className="field-label" style={{ marginBottom: '0.5rem' }}>
                  New Files to Upload
                </p>
                {files.map((f, i) => (
                  <div className="file-item" key={i}>
                    <span>{f.name}</span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: '#9ca3af',
                        marginLeft: 'auto',
                        marginRight: '0.5rem',
                      }}
                    >
                      {(f.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      type="button"
                      className="file-remove"
                      onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Optional Notes Section */}
            <h2 className="section-heading">Optional Notes</h2>

            <div className="textarea-wrapper">
              <textarea
                className="field-textarea"
                placeholder="Add any additional details about your participation..."
                maxLength={500}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <span className="char-count">{notes.length} / 500</span>
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting
                  ? 'Uploading...'
                  : isEditing
                    ? 'UPDATE & SUBMIT FOR REVIEW'
                    : 'SUBMIT FOR REVIEW'}
              </button>
              <div className="form-actions-secondary">
                <button
                  type="button"
                  className="draft-btn"
                  onClick={handleSaveDraft}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : isEditing ? 'Update Draft' : 'Save as Draft'}
                </button>
                <button type="button" className="cancel-link" onClick={() => navigate(-1)}>
                  Cancel
                </button>
              </div>
            </div>
          </form>

          {/* Footer */}
          <footer className="form-footer">
            © 2024 Student Activity Tracker • Faculty of Engineering • Version 1.2.4
          </footer>
        </> /* end loading guard */
      )}
    </div>
  )
}
