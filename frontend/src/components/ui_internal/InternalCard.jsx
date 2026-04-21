import React from 'react'
import PropTypes from 'prop-types'
import styles from './InternalCard.module.css'

/**
 * InternalCard Component
 *
 * A specialized container component that implements the project's glassmorphism
 * design language. Provides structured slots for headers, content, and footers.
 *
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Context/Body of the card
 * @param {React.ReactNode} [props.header] - Optional header content (title/actions)
 * @param {React.ReactNode} [props.footer] - Optional footer content
 * @param {boolean} [props.hoverable=false] - Whether the card has interactive hover effects
 * @param {string} [props.variant='default'] - Background styles: 'default', 'dark', 'light', 'glass'
 * @param {boolean} [props.noPadding=false] - Remove internal padding for edge-to-edge content
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.style] - Inline style overrides
 */
const InternalCard = ({
  children,
  header,
  footer,
  hoverable = false,
  variant = 'default',
  noPadding = false,
  className = '',
  style = {},
  ...rest
}) => {
  /**
   * Determine classes based on configuration
   */
  const cardClasses = [styles.card, styles[variant], hoverable ? styles.hoverable : '', className]
    .filter(Boolean)
    .join(' ')

  const contentClasses = [styles.cardContent, noPadding ? styles.noPadding : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cardClasses} style={style} {...rest}>
      {/* Optional Header Section */}
      {header && <div className={styles.cardHeader}>{header}</div>}

      {/* Main Body Section */}
      <div className={contentClasses}>{children}</div>

      {/* Optional Footer Section */}
      {footer && <div className={styles.cardFooter}>{footer}</div>}
    </div>
  )
}

InternalCard.propTypes = {
  children: PropTypes.node.isRequired,
  header: PropTypes.node,
  footer: PropTypes.node,
  hoverable: PropTypes.bool,
  variant: PropTypes.oneOf(['default', 'dark', 'light', 'glass', 'amber']),
  noPadding: PropTypes.bool,
  className: PropTypes.string,
  style: PropTypes.object,
}

export default InternalCard
