/**
 * ValidationCore.js - V2 Internal Framework
 *
 * A comprehensive validation engine for the SAPT platform.
 * Contains modular rules for email validation, roll number mapping,
 * password strength analysis, and activity submission sanitization.
 */

/**
 * Validates a University email address based on institutional patterns
 *
 * @param {string} email - Email address to check
 * @returns {boolean} Whether the email is valid
 */
export const validateInstitutionalEmail = (email = '') => {
  if (!email) return false

  // Standard RFC 5322 regex + institutional suffix check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  const isValidFormat = emailRegex.test(email)

  // Check if it's a student email (usually contains student or roll pattern)
  const isStudentEmail =
    email.toLowerCase().includes('.edu') || email.toLowerCase().includes('student')

  return isValidFormat && email.length >= 5 && isStudentEmail
}

/**
 * Validates the structure and length of a student Roll Number
 *
 * @param {string} rollNo - Raw toll number
 * @returns {Object} { isValid, error, metadata }
 */
export const validateRollNumber = (rollNo = '') => {
  if (!rollNo) return { isValid: false, error: 'Roll number is required' }

  const cleanRoll = rollNo.trim().toUpperCase()

  // Example pattern: 19CSE101 (Year, Dept, ID)
  const rollRegex = /^(\d{2})([A-Z]{2,5})(\d{3,4})$/
  const match = cleanRoll.match(rollRegex)

  if (!match) {
    return {
      isValid: false,
      error: 'Invalid format. Use Year+Dept+ID (e.g., 22CSE050)',
    }
  }

  const [_, year, dept, id] = match

  return {
    isValid: true,
    error: null,
    metadata: {
      admissionYear: `20${year}`,
      department: dept,
      studentId: id,
    },
  }
}

/**
 * Analyzes password strength and returns detailed feedback
 *
 * @param {string} password - Raw password
 * @returns {Object} { score (0-100), strength, requirements }
 */
export const analyzePasswordStrength = (password = '') => {
  let score = 0
  const requirements = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }

  if (requirements.length) score += 20
  if (requirements.hasUpper) score += 20
  if (requirements.hasLower) score += 20
  if (requirements.hasNumber) score += 20
  if (requirements.hasSpecial) score += 20

  let strength = 'Weak'
  if (score >= 80) strength = 'Very Strong'
  else if (score >= 60) strength = 'Strong'
  else if (score >= 40) strength = 'Moderate'

  return { score, strength, requirements }
}

/**
 * Validates an activity submission before back-end transmission
 *
 * @param {Object} data - Submission record { title, category, points, proofUrl }
 * @returns {Array} List of validation error strings
 */
export const validateActivitySubmission = (data = {}) => {
  const errors = []

  if (!data.title || data.title.length < 5) {
    errors.push('Activity title must be at least 5 characters long.')
  }

  if (!['CULTURAL', 'TECHNICAL', 'SPORTS', 'OTHER'].includes(data.category?.toUpperCase())) {
    errors.push('Please select a valid activity category.')
  }

  const points = Number(data.points)
  if (isNaN(points) || points <= 0 || points > 50) {
    errors.push('Points must be a number between 1 and 50.')
  }

  // URL Validation
  const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
  if (data.proofUrl && !urlRegex.test(data.proofUrl)) {
    errors.push('The proof URL provided is invalid.')
  }

  return errors
}

/**
 * Sanitizes input text to prevent basic XSS or injection
 */
export const sanitizeString = (str = '') => {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim()
}

/**
 * Validates and normalizes phone numbers
 */
export const validatePhoneNumber = (phone = '') => {
  const cleanPhone = phone.replace(/\D/g, '')

  if (cleanPhone.length !== 10) {
    return { isValid: false, normalized: null }
  }

  return {
    isValid: true,
    normalized: `+91-${cleanPhone.slice(0, 5)}-${cleanPhone.slice(5)}`,
  }
}
