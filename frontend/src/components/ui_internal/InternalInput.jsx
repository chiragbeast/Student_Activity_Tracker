import React, { useState } from 'react'
import PropTypes from 'prop-types'
import styles from './InternalInput.module.css'

/**
 * InternalInput Component
 *
 * A robust input component for the SAPT internal framework, featuring built-in
 * labeling, error states, and specialized focus animation.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.label - Label text for the input
 * @param {string} [props.type='text'] - HTML input type (text, password, email, etc.)
 * @param {string} [props.placeholder] - Placeholder text
 * @param {string} [props.value] - Controlled value
 * @param {Function} [props.onChange] - Change handler
 * @param {string} [props.error] - Error message to display
 * @param {boolean} [props.required=false] - Whether the field is mandatory
 * @param {string} [props.helperText] - Subtle helper text below the input
 * @param {React.ReactNode} [props.icon] - Icon to display inside the input
 * @param {boolean} [props.disabled=false] - Disable state
 * @param {string} [props.autoComplete] - Autocomplete attribute
 * @param {string} [props.name] - Input name attribute
 */
const InternalInput = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  helperText,
  icon,
  disabled = false,
  autoComplete,
  name,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false)

  /**
   * Handle dynamic class generation for the input container
   */
  const containerClasses = [
    styles.inputContainer,
    error ? styles.hasError : '',
    disabled ? styles.isDisabled : '',
    isFocused ? styles.isFocused : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={containerClasses}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.requiredMark}>*</span>}
        </label>
      )}

      <div className={styles.inputWrapper}>
        {icon && <span className={styles.icon}>{icon}</span>}

        <input
          type={type}
          name={name}
          className={styles.input}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          autoComplete={autoComplete}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          required={required}
          {...rest}
        />
      </div>

      {/* Conditional Rendering of status text */}
      {error ? (
        <p className={styles.errorText} role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className={styles.helperText}>{helperText}</p>
      ) : null}
    </div>
  )
}

InternalInput.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  error: PropTypes.string,
  required: PropTypes.bool,
  helperText: PropTypes.string,
  icon: PropTypes.node,
  disabled: PropTypes.bool,
  autoComplete: PropTypes.string,
  name: PropTypes.string,
}

export default InternalInput
