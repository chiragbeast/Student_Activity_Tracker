import { useState, useEffect } from 'react'
import styles from './FacultyPendingSubmissions.module.css'
import { User } from 'lucide-react'
import { facultyApi } from '../services/api'

export default function PendingSubmissions({ onReviewClick }) {
  const [submissions, setSubmissions] = useState([])
  const [search, setSearch] = useState('')

  async function fetchSubmissions() {
    try {
      const res = await facultyApi.getPendingSubmissions()
      if (res.data.success) {
        const mapped = res.data.data.map((s) => ({
          id: s._id,
          name: s.student?.name || 'Unknown Student',
          avatarBg: '#6aab7a',
          initials:
            s.student?.name
              ?.split(' ')
              .map((n) => n[0])
              .join('') || '?',
          studentId: s.student?.rollNumber || 'N/A',
          department: s.student?.department || 'N/A',
          activity: s.activityName || 'Unnamed Activity',
          description: s.description || '',
          category: s.activityLevel || 'N/A',
          categoryType: (s.activityLevel || 'institute').toLowerCase(),
          points: s.pointsRequested || 0,
          date: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A',
          submittedOn: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A',
          fileName: s.documents?.[0]?.fileName || 'No File',
          fileSize: s.documents?.[0]?.fileSize
            ? `${(s.documents[0].fileSize / 1024).toFixed(1)} KB`
            : '0 KB',
          lastUpdated: s.updatedAt ? new Date(s.updatedAt).toLocaleString() : 'N/A',
          ...s,
        }))
        setSubmissions(mapped)
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

  const filtered = submissions.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.activity.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title} data-testid="faculty-dashboard-pending-title">
          Pending Submissions
        </h2>
        <button
          className={styles.viewAll}
          data-testid="faculty-dashboard-pending-view-all"
          onClick={() => onReviewClick('View All')}
        >
          View All
        </button>
      </div>

      <div className={styles.searchGroup}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            data-testid="faculty-dashboard-pending-search"
            placeholder="Search by student or activity..."
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className={styles.searchBtn}>Search</button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>STUDENT NAME</th>
              <th>ACTIVITY</th>
              <th>CATEGORY</th>
              <th>POINTS</th>
              <th>DATE</th>
              <th style={{ textAlign: 'right' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className={styles.studentCell}>
                    <div className={styles.studentAvatar}>
                      <User size={18} />
                    </div>
                    <span className={styles.studentName}>{s.name}</span>
                  </div>
                </td>
                <td className={styles.activity}>{s.activity}</td>
                <td>
                  <span className={`${styles.badge} ${styles[s.categoryType]}`}>{s.category}</span>
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
                      data-testid={`faculty-dashboard-review-${s.id}`}
                      onClick={() => onReviewClick(s)}
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
    </div>
  )
}
