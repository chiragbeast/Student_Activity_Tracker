import { useState, useEffect } from 'react'
import { facultyApi } from '../services/api'
import styles from './FacultyPendingSubmissionsPage.module.css'

export default function PendingSubmissionsPage({ onReview }) {
  const [submissionsData, setSubmissionsData] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [sortOrder, setSortOrder] = useState('newest')

  async function fetchSubmissions() {
    try {
      const res = await facultyApi.getPendingSubmissions()
      if (res.data.success) {
        const mapped = res.data.data.map((s) => ({
          id: s._id,
          name: s.student?.name || 'Unknown Student',
          initials:
            s.student?.name
              ?.split(' ')
              .map((n) => n[0])
              .join('') || '?',
          avatarBg: '#6aab7a',
          activity: s.activityName || 'Unnamed Activity',
          category: s.activityLevel || 'N/A',
          categoryType: (s.activityLevel || 'institute').toLowerCase(),
          points: s.pointsRequested || 0,
          date: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A',
          ...s,
        }))
        setSubmissionsData(mapped)
      }
    } catch (err) {
      console.error('Error fetching pending submissions:', err)
    }
  }

  useEffect(() => {
    const fetchTimer = setTimeout(() => {
      fetchSubmissions()
    }, 0)
    return () => clearTimeout(fetchTimer)
  }, [])

  const filteredAndSorted = submissionsData
    .filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.activity.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'All' || s.category === categoryFilter
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const handleBulkApprove = async () => {
    try {
      await facultyApi.bulkReviewSubmissions({
        submissionIds: selectedIds,
        status: 'Approved',
        feedback: 'Approved via bulk action',
      })
      alert(`Approved ${selectedIds.length} submissions`)
      setSelectedIds([])
      fetchSubmissions()
    } catch {
      alert('Failed to bulk approve')
    }
  }

  const handleBulkReject = async () => {
    try {
      await facultyApi.bulkReviewSubmissions({
        submissionIds: selectedIds,
        status: 'Denied',
        feedback: 'Rejected via bulk action',
      })
      alert(`Rejected ${selectedIds.length} submissions`)
      setSelectedIds([])
      fetchSubmissions()
    } catch {
      alert('Failed to bulk reject')
    }
  }

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle} data-testid="faculty-pending-submissions-title">
          Pending Submissions
        </h1>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statsCard}>
          <span className={styles.statsLabel}>TOTAL PENDING</span>
          <span className={styles.statsValue}>{submissionsData.length}</span>
        </div>
      </div>

      {/* Filter & Search Area */}
      <div className={styles.filterRow}>
        <div className={styles.searchGroup}>
          <div className={styles.searchWrapper}>
            <svg
              className={styles.searchIcon}
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
            >
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
              data-testid="faculty-pending-submissions-search"
              placeholder="Search submissions..."
              className={styles.searchInput}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className={styles.searchBtn}>Search</button>
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.selectWrapper}>
            <span className={styles.selectLabel}>Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={styles.select}
            >
              <option value="All">All Categories</option>
              <option value="Institute">Institute</option>
              <option value="Department">Department</option>
            </select>
          </div>
          <div className={styles.selectWrapper}>
            <span className={styles.selectLabel}>Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className={styles.select}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>STUDENT NAME</th>
              <th>ACTIVITY NAME</th>
              <th>CATEGORY</th>
              <th>REQUESTED POINTS</th>
              <th>SUBMISSION DATE</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((s) => (
              <tr key={s.id} className={selectedIds.includes(s.id) ? styles.rowSelected : ''}>
                <td>
                  <div className={styles.studentCell}>
                    <div
                      className={`${styles.avatar} ${selectedIds.includes(s.id) ? styles.selected : ''}`}
                      style={{ background: s.avatarBg }}
                      onClick={() => toggleSelect(s.id)}
                    >
                      <div className={styles.checkboxOverlay}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={selectedIds.includes(s.id)}
                          readOnly
                        />
                      </div>
                      {s.initials}
                    </div>
                    <span className={styles.studentName}>{s.name}</span>
                  </div>
                </td>
                <td className={styles.activityName}>{s.activity}</td>
                <td>
                  <span className={`${styles.badge} ${styles[s.categoryType]}`}>
                    {s.category.toUpperCase()}
                  </span>
                </td>
                <td
                  className={`
                  ${styles.points} 
                  ${s.categoryType === 'department' ? styles.departmentPoints : ''}
                  ${s.categoryType === 'institute' ? styles.institutePoints : ''}
                `}
                >
                  {s.points}
                </td>
                <td className={styles.date}>{s.date}</td>
                <td>
                  <div className={styles.actionGroup}>
                    <button
                      className={styles.reviewBtn}
                      data-testid={`faculty-pending-review-${s.id}`}
                      onClick={() => onReview && onReview(s)}
                    >
                      Review
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedIds.length > 0 && (
        <div className={styles.bulkActions}>
          <span className={styles.bulkCount}>{selectedIds.length} submissions selected</span>
          <div className={styles.bulkBtnGroup}>
            <button className={styles.bulkApproveBtn} onClick={handleBulkApprove}>
              Bulk Approve
            </button>
            <button className={styles.bulkRejectBtn} onClick={handleBulkReject}>
              Bulk Reject
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
