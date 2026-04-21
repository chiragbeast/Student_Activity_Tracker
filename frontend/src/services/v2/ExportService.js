/**
 * ExportService.js - V2 Internal Framework
 *
 * Specialized service for generating client-side reports and exports.
 * Provides functions for CSV generation, plain-text report building, and
 * data sanitization for downstream Excel consumption.
 */

/**
 * Escapes CSV special characters to prevent injection and formatting breakage.
 *
 * @param {string} value - Raw string value
 * @returns {string} Sanitized string
 */
const sanitizeCSVValue = (value) => {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)

  // Wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

/**
 * Generates a CSV string from an array of student objects
 *
 * @param {Array} students - Normalized student data
 * @returns {string} Formatted CSV content
 */
export const generateStudentCSV = (students = []) => {
  if (!students.length) return ''

  const headers = [
    'Roll Number',
    'Full Name',
    'Email',
    'Department',
    'Year',
    'Institute Points',
    'Department Points',
    'Total Points',
    'Status',
  ]

  const rows = students.map((s) => [
    s.rollNumber,
    s.fullName,
    s.email,
    s.department,
    s.year,
    s.stats.institute,
    s.stats.department,
    s.stats.total,
    s.status,
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map(sanitizeCSVValue).join(',')),
  ].join('\n')

  return csvContent
}

/**
 * Creates a downloadable blob from a string and triggers browser download
 *
 * @param {string} content - File content string
 * @param {string} fileName - Destination filename
 * @param {string} mimeType - File MIME type
 */
export const downloadFile = (content, fileName, mimeType = 'text/csv') => {
  try {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)

    document.body.appendChild(link)
    link.click()

    // Cleanup
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('ExportService: Download failed', err)
  }
}

/**
 * Generates a summary text report for a specific batch/department
 *
 * @param {Object} data - { deptName, totalStudents, avgPoints, qualifiedCount }
 * @returns {string} Multi-line formatted text report
 */
export const generateDepartmentSummaryReport = (data) => {
  const {
    deptName = 'All Departments',
    totalStudents = 0,
    avgPoints = 0,
    qualifiedCount = 0,
  } = data

  const timestamp = new Date().toLocaleString()
  const qualifiedPercent =
    totalStudents > 0 ? ((qualifiedCount / totalStudents) * 100).toFixed(2) : 0

  return `
=========================================
      STUDENT SAP ACTIVITY REPORT
=========================================
Generated On: ${timestamp}
Department: ${deptName}

-----------------------------------------
STATISTICAL SUMMARY:
-----------------------------------------
Total Students:      ${totalStudents}
Average SAP Points:  ${avgPoints}
Qualified Students:  ${qualifiedCount}
Qualification Rate:  ${qualifiedPercent}%

-----------------------------------------
SYSTEM STATUS: Active
-----------------------------------------
* This report is generated automatically by 
  the SAPT Faculty Internal Core.
=========================================
  `
}

/**
 * Prepares raw Activity Submissions for a student-specific report
 */
export const prepareActivityAuditLog = (submissions = []) => {
  const headers = ['Date', 'Category', 'Activity Name', 'Points', 'Status']

  const rows = submissions.map((sub) => [
    new Date(sub.createdAt).toLocaleDateString(),
    sub.category,
    sub.activityName,
    sub.pointsAwarded || 0,
    sub.status,
  ])

  return [headers, ...rows]
}
