import { FiX, FiBookOpen, FiExternalLink } from 'react-icons/fi'
import './GuidelinesModal.css'

const WORD_MIME_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const getFileExtension = (name = '') => {
  const parts = name.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
}

const isWordFile = (fileName = '', mimeType = '') => {
  const ext = getFileExtension(fileName)
  return WORD_MIME_TYPES.includes(mimeType) || ext === 'doc' || ext === 'docx'
}

export default function GuidelinesModal({
  onClose,
  brochureUrl,
  brochureFileName,
  brochureMimeType,
  loading,
  error,
}) {
  const isWordBrochure = isWordFile(brochureFileName, brochureMimeType)
  const previewSrc = brochureUrl && !isWordBrochure ? brochureUrl : ''

  return (
    <div className="guidelines-overlay" onClick={onClose}>
      <div className="guidelines-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="guidelines-modal-header">
          <div className="guidelines-header-left">
            <FiBookOpen className="guidelines-header-icon" />
            <h2 className="guidelines-modal-title">Activity Point Guidelines</h2>
          </div>
          <button className="guidelines-close-btn" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        {/* Content */}
        <div className="guidelines-modal-body">
          {loading ? (
            <div className="guidelines-empty-state">Loading brochure...</div>
          ) : error ? (
            <div className="guidelines-empty-state guidelines-error">{error}</div>
          ) : brochureUrl ? (
            <>
              <div className="guidelines-preview-actions">
                <a
                  href={brochureUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="guidelines-open-link"
                >
                  <FiExternalLink />
                  Open in new tab
                </a>
              </div>
              {previewSrc ? (
                <iframe title="Points Brochure" src={previewSrc} className="guidelines-pdf-frame" />
              ) : (
                <div className="guidelines-empty-state">
                  Inline preview is not supported for Word brochures. Use Open in new tab.
                </div>
              )}
            </>
          ) : (
            <div className="guidelines-empty-state">
              Brochure is not available yet. Please contact admin.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
