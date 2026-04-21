import React from 'react'
import PropTypes from 'prop-types'
import styles from './InternalBadge.module.css'

/**
 * InternalBadge Component
 *
 * A versatile badge component for status indicators, tags, and category labels.
 * Supports multiple colored themes and optional animated pulse effects.
 *
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Badge text or icon
 * @param {string} [props.type='info'] - Visual type: 'success', 'warning', 'danger', 'info', 'amber', 'neutral'
 * @param {boolean} [props.pulse=false] - Whether to show an animated pulse indicator
 * @param {boolean} [props.pill=true] - Rounded (pill) or slightly rounded shape
 * @param {string} [props.size='md'] - Badge size: 'sm', 'md'
 * @param {string} [props.className] - Additional CSS classes
 */
const InternalBadge = ({
  children,
  type = 'info',
  pulse = false,
  pill = true,
  size = 'md',
  className = '',
  ...rest
}) => {
  const badgeClasses = [
    styles.badge,
    styles[type],
    styles[size],
    pill ? styles.pill : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={badgeClasses} {...rest}>
      {pulse && (
        <span className={`${styles.pulse} ${styles[`pulse_${type}`]}`} aria-hidden="true" />
      )}
      <span className={styles.label}>{children}</span>
    </span>
  )
}

InternalBadge.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['success', 'warning', 'danger', 'info', 'amber', 'neutral', 'indigo']),
  pulse: PropTypes.bool,
  pill: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md']),
  className: PropTypes.string,
}

export default InternalBadge
