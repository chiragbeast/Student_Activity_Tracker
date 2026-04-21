/**
 * DataTransformer.js - V2 Internal Framework
 *
 * This service provides advanced data manipulation utilities for the Student Activity
 * Points Tracker (SAPT). It specializes in aggregating student performance data,
 * normalizing raw back-end responses, and preparing datasets for visual analytics.
 */

import { format, parseISO, isValid } from 'date-fns'

/**
 * Normalizes Student Records for consistent UI rendering
 *
 * @param {Array} students - Raw student array from API
 * @returns {Array} Processed students with calculated stats
 */
export const normalizeStudentData = (students = []) => {
  if (!Array.isArray(students)) return []

  return students.map((student) => {
    const totalPoints = Number(student.stats?.totalPoints || 0)
    const instPoints = Number(student.stats?.institutePoints || 0)
    const deptPoints = Number(student.stats?.departmentPoints || 0)

    return {
      id: student._id,
      fullName: student.name || 'Unknown Student',
      email: student.email,
      rollNumber: student.rollNumber || 'N/A',
      department: student.department || 'General',
      year: student.yearOfStudy || 1,
      stats: {
        total: totalPoints,
        institute: instPoints,
        department: deptPoints,
        completionPercentage: Math.min(100, (totalPoints / 100) * 100),
      },
      status: totalPoints >= 100 ? 'QUALIFIED' : 'PENDING',
    }
  })
}

/**
 * Aggregates Activity Submissions by their Status
 * Useful for summary charts and dashboard stats.
 *
 * @param {Array} submissions - Raw submission array
 * @returns {Object} Grouped stats counts
 */
export const groupSubmissionsByStatus = (submissions = []) => {
  const initial = {
    APPROVED: 0,
    REJECTED: 0,
    PENDING: 0,
    TOTAL: submissions.length,
  }

  return submissions.reduce((acc, sub) => {
    const status = sub.status?.toUpperCase() || 'PENDING'
    if (Object.prototype.hasOwnProperty.call(acc, status)) {
      acc[status]++
    }
    return acc
  }, initial)
}

/**
 * Formats a raw ISO date string into a user-friendly format
 * Handles edge cases like invalid dates or null values.
 *
 * @param {string} dateStr - ISO Date string
 * @param {string} pattern - Desired output pattern (date-fns format)
 * @returns {string} Human readable date
 */
export const safeFormatDate = (dateStr, pattern = 'dd MMM yyyy') => {
  if (!dateStr) return 'N/A'

  try {
    const date = parseISO(dateStr)
    if (!isValid(date)) return 'Invalid Date'
    return format(date, pattern)
  } catch (err) {
    console.error('DataTransformer: Date parsing error', err)
    return 'Formatting Error'
  }
}

/**
 * Calculates a weighted performance score based on activity variety
 *
 * @param {Array} submissions - List of approved submissions
 * @returns {number} Weighted score from 0-10
 */
export const calculateDiversityScore = (submissions = []) => {
  const categories = new Set(submissions.map((s) => s.category))
  const uniqueCount = categories.size

  // Logic: More categories = higher diversity score
  if (uniqueCount === 0) return 0
  if (uniqueCount >= 5) return 10

  return (uniqueCount / 5) * 10
}

/**
 * Filter students based on multi-criteria search
 *
 * @param {Array} students - Normalized student list
 * @param {Object} criteria - Search criteria { name, dept, minPoints }
 * @returns {Array} Filtered list
 */
export const filterStudentRecords = (students, criteria = {}) => {
  const { name = '', dept = '', minPoints = 0 } = criteria

  return students.filter((s) => {
    const matchName =
      s.fullName.toLowerCase().includes(name.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(name.toLowerCase())
    const matchDept = !dept || s.department === dept
    const matchPoints = s.stats.total >= Number(minPoints)

    return matchName && matchDept && matchPoints
  })
}

/**
 * Sorting utility for complex student objects
 */
export const sortStudents = (students, config = { key: 'total', direction: 'desc' }) => {
  const { key, direction } = config

  return [...students].sort((a, b) => {
    let valA, valB

    if (key === 'total') {
      valA = a.stats.total
      valB = b.stats.total
    } else {
      valA = a[key]
      valB = b[key]
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1
    if (valA > valB) return direction === 'asc' ? 1 : -1
    return 0
  })
}
