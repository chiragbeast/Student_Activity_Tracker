import { useState, useEffect, Fragment } from 'react'
import { Mail } from 'lucide-react'
import { facultyApi } from '../services/api'
import styles from './FacultyAssignedStudentsPage.module.css'

const PAGE_SIZE = 5

export default function AssignedStudentsPage() {
  const [allStudents, setAllStudents] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [expandedStudentId, setExpandedStudentId] = useState(null)
  const [history, setHistory] = useState({}) // { studentId: [submissions] }
  const [historyState, setHistoryState] = useState({}) // { studentId: { loading: bool, error: string } }

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const res = await facultyApi.getStudents()
      if (res.data.success) {
        const mapped = res.data.data.map((s) => ({
          id: s._id,
          name: s.name,
          email: s.email,
          studentId: s.rollNumber || 'N/A',
          institutePoints: s.stats?.institutePoints || 0,
          deptPoints: s.stats?.departmentPoints || 0,
          total: s.stats?.totalPoints || 0,
        }))
        setAllStudents(mapped)
      }
    } catch (err) {
      console.error('Error fetching assigned students:', err)
    }
  }

  const handleRowClick = async (studentId) => {
    if (expandedStudentId === studentId) {
      setExpandedStudentId(null)
      return
    }

    setExpandedStudentId(studentId)

    // Fetch history if not already loaded or if there was an error
    if (!history[studentId] || historyState[studentId]?.error) {
      try {
        setHistoryState((prev) => ({ ...prev, [studentId]: { loading: true, error: null } }))
        const res = await facultyApi.getStudentHistory(studentId)

        if (res.data.success) {
          setHistory((prev) => ({ ...prev, [studentId]: res.data.data }))
          setHistoryState((prev) => ({ ...prev, [studentId]: { loading: false, error: null } }))
        } else {
          throw new Error(res.data.message || 'Failed to fetch history')
        }
      } catch (err) {
        console.error('Error fetching student history:', err)
        setHistoryState((prev) => ({
          ...prev,
          [studentId]: { loading: false, error: err.response?.data?.message || err.message },
        }))
      }
    }
  }

  const handleExportExcel = async (e, studentId, studentName) => {
    e.stopPropagation() // Prevent row expansion
    try {
      const res = await facultyApi.exportExcel(studentId)
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Report_${studentName.replace(/\s+/g, '_')}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting Excel:', err)
      alert('Failed to export Excel')
    }
  }

  const handleExportAllExcel = async () => {
    try {
      const res = await facultyApi.exportAllExcel()
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Bulk_Student_Report_${new Date().toISOString().split('T')[0]}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting bulk Excel:', err)
      alert('Failed to export bulk Excel')
    }
  }

  const handleMailClick = (e, studentEmail) => {
    e.stopPropagation()

    if (!studentEmail || studentEmail === 'N/A') {
      alert('No valid email found for this student.')
      return
    }

    window.location.href = `mailto:${studentEmail}`
  }

  const filtered = allStudents.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className={styles.page}>
      {/* -- Page Header -- */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Assigned Students</h1>
          <p className={styles.pageSubtitle}>
            Manage and monitor student progress for your current cohort.
          </p>
        </div>
      </div>

      <div className={styles.searchGroup}>
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} width="16" height="16" fill="none" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path
              d="M16.5 16.5L21 21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by student name or ID..."
            className={styles.searchInput}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <button className={styles.searchBtn}>Search</button>

        <button className={styles.exportAllBtn} onClick={handleExportAllExcel}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path
              d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Export All (Excel)
        </button>
      </div>

      {/* -- Table -- */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>STUDENT NAME</th>
              <th>STUDENT ID</th>
              <th>INSTITUTE POINTS</th>
              <th>DEPT. POINTS</th>
              <th>TOTAL</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length > 0 ? (
              paginated.map((s) => (
                <Fragment key={s.id}>
                  <tr className={styles.clickableRow} onClick={() => handleRowClick(s.id)}>
                    <td>
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        className={`${styles.chevron} ${expandedStudentId === s.id ? styles.expanded : ''}`}
                      >
                        <path
                          d="M9 18l6-6-6-6"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </td>
                    <td className={styles.nameCell}>{s.name}</td>
                    <td className={styles.idCell}>{s.studentId}</td>
                    <td className={styles.institutePoints}>{s.institutePoints}</td>
                    <td className={styles.deptPoints}>{s.deptPoints}</td>
                    <td>
                      <span className={styles.totalBadge}>{s.total}</span>
                    </td>
                    <td>
                      <div className={styles.actionGroup}>
                        <button
                          className={styles.mailBtn}
                          onClick={(e) => handleMailClick(e, s.email)}
                        >
                          <Mail size={16} />
                        </button>
                        <button
                          className={styles.exportBtn}
                          onClick={(e) => handleExportExcel(e, s.id, s.name)}
                        >
                          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                            <path
                              d="M12 3v13M7 11l5 5 5-5"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M5 21h14"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          </svg>
                          Export Excel
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedStudentId === s.id && (
                    <tr className={styles.historyRow}>
                      <td colSpan={7}>
                        <div className={styles.historyContent}>
                          <h4 className={styles.historyTitle}>Submission History</h4>
                          {historyState[s.id]?.loading ? (
                            <div className={styles.historyLoader}>Loading history...</div>
                          ) : historyState[s.id]?.error ? (
                            <div className={styles.historyError}>
                              Error: {historyState[s.id].error}
                              <button
                                className={styles.retryBtn}
                                onClick={() => handleRowClick(s.id)}
                              >
                                Retry
                              </button>
                            </div>
                          ) : history[s.id]?.length > 0 ? (
                            <div className={styles.historyTableWrapper}>
                              <table className={styles.historyTable}>
                                <thead>
                                  <tr>
                                    <th className={styles.colName}>ACTIVITY NAME</th>
                                    <th className={styles.colLevel}>LEVEL</th>
                                    <th className={styles.colPoints}>POINTS</th>
                                    <th className={styles.colStatus}>STATUS</th>
                                    <th className={styles.colDate}>DATE</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {history[s.id].map((sub, idx) => (
                                    <tr key={idx}>
                                      <td className={styles.histName}>{sub.activityName}</td>
                                      <td className={styles.histLevel}>
                                        <span
                                          className={`${styles.catBadge} ${styles[sub.activityLevel.toLowerCase()] || ''}`}
                                        >
                                          {sub.activityLevel}
                                        </span>
                                      </td>
                                      <td className={styles.histPoints}>
                                        {sub.status === 'Approved'
                                          ? sub.pointsApproved
                                          : sub.pointsRequested}
                                      </td>
                                      <td className={styles.histStatusCell}>
                                        <span
                                          className={`${styles.histStatus} ${styles[sub.status.toLowerCase()] || ''}`}
                                        >
                                          {sub.status}
                                        </span>
                                      </td>
                                      <td className={styles.histDate}>
                                        {new Date(sub.createdAt).toLocaleDateString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className={styles.noHistory}>
                              No submission history found for this student.
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* -- Pagination -- */}
      <div className={styles.pagination}>
        <span className={styles.paginationInfo}>
          Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–
          {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} students
        </span>
        <div className={styles.paginationControls}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || filtered.length === 0}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path
                d="M9 18l6-6-6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
