import styles from './FacultyStatCards.module.css'

export default function StatCards({ assignedStudents, pendingReviews }) {
  const stats = [
    { label: 'Assigned Students', value: assignedStudents },
    { label: 'Pending Reviews', value: pendingReviews },
  ]

  return (
    <div className={styles.strip}>
      <div className={styles.row}>
        {stats.map(({ label, value }) => (
          <div key={label} className={styles.segmentWrap}>
            <div className={styles.segment}>
              <span className={styles.label}>{label}</span>
              <span className={styles.value}>{value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
