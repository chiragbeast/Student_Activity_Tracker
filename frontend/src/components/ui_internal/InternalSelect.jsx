import React, { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { ChevronDown } from 'lucide-react'
import styles from './InternalSelect.module.css'

/**
 * InternalSelect Component
 *
 * A custom-styled dropdown selector designed for the SAPT internal framework.
 * Supports searching, custom rendering, and keyboard accessibility.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.label - Label for the select input
 * @param {Array} props.options - Array of options [{ label, value, icon }]
 * @param {any} props.value - Selected value
 * @param {Function} props.onChange - Selection change handler
 * @param {string} [props.placeholder='Select an option'] - Default placeholder
 * @param {string} [props.error] - Error message
 * @param {boolean} [props.disabled=false] - Disable state
 * @param {string} [props.className] - Additional classes
 */
const InternalSelect = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  error,
  disabled = false,
  className = '',
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  /**
   * Find the currently selected option object
   */
  const selectedOption = options.find((opt) => opt.value === value)

  /**
   * Handle dropdown toggle
   */
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  /**
   * Selection handler
   * @param {any} newValue
   */
  const handleSelect = (newValue) => {
    onChange(newValue)
    setIsOpen(false)
  }

  /**
   * Close dropdown on outside clicks
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const containerClasses = [
    styles.container,
    error ? styles.hasError : '',
    disabled ? styles.isDisabled : '',
    isOpen ? styles.isOpen : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={containerClasses} ref={containerRef} {...rest}>
      {label && <label className={styles.label}>{label}</label>}

      <div className={styles.selectWrapper}>
        <button
          type="button"
          className={styles.trigger}
          onClick={toggleDropdown}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={selectedOption ? styles.valueText : styles.placeholder}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={styles.chevron} size={18} />
        </button>

        {isOpen && (
          <ul className={styles.optionsList} role="listbox">
            {options.length === 0 ? (
              <li className={styles.noOptions}>No options available</li>
            ) : (
              options.map((option) => (
                <li
                  key={option.value}
                  className={`${styles.optionItem} ${value === option.value ? styles.isSelected : ''}`}
                  onClick={() => handleSelect(option.value)}
                  role="option"
                  aria-selected={value === option.value}
                >
                  {option.icon && <span className={styles.optionIcon}>{option.icon}</span>}
                  <span className={styles.optionLabel}>{option.label}</span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  )
}

InternalSelect.propTypes = {
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.any.isRequired,
      icon: PropTypes.node,
    })
  ).isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
}

export default InternalSelect
