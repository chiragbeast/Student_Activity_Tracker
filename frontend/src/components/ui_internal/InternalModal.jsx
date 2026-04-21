import React, { useEffect, useCallback } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import { X } from 'lucide-react'
import styles from './InternalModal.module.css'

/**
 * InternalModal Component
 *
 * A professional modal system that utilizes React Portals for proper DOM placement.
 * Includes scroll locking, entrance animations, and built-in backdrop handling.
 *
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is currently visible
 * @param {Function} props.onClose - Callback triggered when the modal should close
 * @param {string} [props.title] - Modal title displayed in the header
 * @param {React.ReactNode} props.children - Main body content
 * @param {React.ReactNode} [props.footer] - Optional footer content (buttons, etc.)
 * @param {string} [props.size='md'] - Modal width: 'sm', 'md', 'lg', 'xl', 'full'
 * @param {boolean} [props.closeOnOverlayClick=true] - Close when clicking the backdrop
 * @param {boolean} [props.showCloseButton=true] - Display the 'X' button in header
 */
const InternalModal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
}) => {
  /**
   * Handle Escape key press to close modal
   */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  /**
   * Effect to manage scroll lock and key listeners
   */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  /* Don't render if not open */
  if (!isOpen) return null

  /**
   * Handle overlay click events
   */
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  /**
   * Use React Portals to render outside the normal hierarchy
   */
  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className={`${styles.modal} ${styles[size]}`}>
        {/* Header Section */}
        <div className={styles.header}>
          <div className={styles.titleWrapper}>
            {title && <h2 className={styles.title}>{title}</h2>}
          </div>

          {showCloseButton && (
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content Section */}
        <div className={styles.body}>{children}</div>

        {/* Optional Footer Section */}
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

InternalModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  closeOnOverlayClick: PropTypes.bool,
  showCloseButton: PropTypes.bool,
}

export default InternalModal
