import { useState, useEffect } from 'react'
import { Mail } from 'lucide-react'
import MailModal from './FacultyMailModal'
import { facultyApi } from '../services/api'
import styles from './FacultyAssignedStudentsPage.module.css'

const PAGE_SIZE = 5

export default function AssignedStudentsPage() {
  const [allStudents, setAllStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [mailTarget, setMailTarget] = useState(null)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const res = await facultyApi.getStudents()
      if (res.data.success) {
        const mapped = res.data.data.map(s => ({
          id: s._id,
          name: s.name,
          studentId: s.rollNumber || 'N/A',
          institutePoints: s.stats?.institutePoints || 0,
          deptPoints: s.stats?.departmentPoints || 0,
          total: s.stats?.totalPoints || 0
        }))
        setAllStudents(mapped)
      }
    } catch (err) {
      console.error('Error fetching assigned students:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const res = await facultyApi.exportCSV()
      const blob = new Blob([res.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'students_export.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting CSV:', err)
      alert('Failed to export CSV')
    }
  }

  const filtered = allStudents.filter(s =>
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
          <p className={styles.pageSubtitle}>Manage and monitor student progress for your current cohort.</p>
        </div>
      </div>

      <div className={styles.searchGroup}>
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} width="16" height="16" fill="none" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search by student name or ID..."
            className={styles.searchInput}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <button className={styles.searchBtn}>Search</button>
      </div>


      {/* -- Table -- */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>STUDENT NAME</th>
              <th>STUDENT ID</th>
              <th>INSTITUTE POINTS</th>
              <th>DEPT. POINTS</th>
              <th>TOTAL</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length > 0 ? paginated.map((s) => (
              <tr key={s.id}>
                <td className={styles.nameCell}>{s.name}</td>
                <td className={styles.idCell}>{s.studentId}</td>
                <td className={styles.institutePoints}>{s.institutePoints}</td>
                <td className={styles.deptPoints}>{s.deptPoints}</td>
                <td><span className={styles.totalBadge}>{s.total}</span></td>
                <td>
                  <div className={styles.actionGroup}>
                    <button
                      className={styles.mailBtn}
                      onClick={() => setMailTarget(s)}
                    >
                      <Mail size={16} />
                    </button>
                    <button className={styles.exportBtn} onClick={handleExportCSV}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                        <path d="M12 3v13M7 11l5 5 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M5 21h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                      Export
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className={styles.emptyState}>No students found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* -- Pagination -- */}
      <div className={styles.pagination}>
        <span className={styles.paginationInfo}>
          Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} students
        </span>
        <div className={styles.paginationControls}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || filtered.length === 0}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* -- Mail Modal -- */}
      <MailModal
        isOpen={!!mailTarget}
        onClose={() => setMailTarget(null)}
        studentName={mailTarget?.name}
      />

    </div>
  )
}
