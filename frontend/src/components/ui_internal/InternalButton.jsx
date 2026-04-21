import React from 'react'
import PropTypes from 'prop-types'
import styles from './InternalButton.module.css'

/**
 * InternalButton Component
 *
 * A premium, highly customizable button component designed for the SAPT Internal Framework.
 * Supports various themes (glass, glow, solid), sizes, and interactive states.
 *
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button label or nested elements
 * @param {string} [props.variant='primary'] - Visual style: 'primary', 'secondary', 'danger', 'glass', 'glow'
 * @param {string} [props.size='md'] - Button size: 'sm', 'md', 'lg', 'xl'
 * @param {boolean} [props.loading=false] - Whether to show a spinner state
 * @param {boolean} [props.disabled=false] - Whether the button is interactable
 * @param {string} [props.type='button'] - Native HTML button type
 * @param {React.ReactNode} [props.iconLeft] - Icon element to display before text
 * @param {React.ReactNode} [props.iconRight] - Icon element to display after text
 * @param {Function} [props.onClick] - Click handler function
 * @param {string} [props.className] - Additional CSS classes
 * @param {Object} [props.style] - Inline style overrides
 */
const InternalButton = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  iconLeft,
  iconRight,
  onClick,
  className = '',
  style = {},
  ...rest
}) => {
  // Combine variant and size classes from the CSS module
  const buttonClasses = [
    styles.internalBtn,
    styles[variant],
    styles[size],
    loading ? styles.loading : '',
    disabled ? styles.disabled : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  /**
   * Internal click handler to prevent interaction when loading or disabled
   * @param {React.MouseEvent} e
   */
  const handleClick = (e) => {
    if (loading || disabled) {
      e.preventDefault()
      return
    }
    if (onClick) {
      onClick(e)
    }
  }

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      style={style}
      aria-busy={loading}
      {...rest}
    >
      {/* Loading Spinner Overlay */}
      {loading && (
        <span className={styles.spinner} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" strokeWidth="4" />
            <path
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              fill="currentColor"
            />
          </svg>
        </span>
      )}

      {/* Content Container */}
      <span className={loading ? styles.hiddenContent : styles.content}>
        {iconLeft && <span className={styles.iconBox}>{iconLeft}</span>}
        <span className={styles.text}>{children}</span>
        {iconRight && <span className={styles.iconBox}>{iconRight}</span>}
      </span>
    </button>
  )
}

InternalButton.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'glass', 'glow', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  iconLeft: PropTypes.node,
  iconRight: PropTypes.node,
  onClick: PropTypes.func,
  className: PropTypes.string,
  style: PropTypes.object,
}

export default InternalButton
