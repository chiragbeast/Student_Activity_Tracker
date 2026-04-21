import { useState, useEffect } from 'react'
import {
  Plus,
  Calendar,
  Trash2,
  Users,
  Bell,
  Search,
  CheckSquare,
  Square,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react'
import styles from './FacultyDeadlinesPage.module.css'
import { deadlineApi, facultyApi } from '../services/api'

export default function FacultyDeadlinesPage() {
  const [deadlines, setDeadlines] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [idToDelete, setIdToDelete] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedStudents: [],
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [deadlinesRes, studentsRes] = await Promise.all([
        deadlineApi.getDeadlines(),
        facultyApi.getStudents(),
      ])
      setDeadlines(deadlinesRes.data.data)
      setStudents(studentsRes.data.data)
    } catch (err) {
      console.error('Error fetching deadlines data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()

    if (!formData.assignedStudents || formData.assignedStudents.length === 0) {
      setErrorMsg('you need to select students for sending the deadline')
      return
    }

    try {
      await deadlineApi.createDeadline(formData)
      setShowModal(false)
      setFormData({ title: '', description: '', assignedStudents: [] })
      fetchData()
      setShowSuccess(true)
    } catch {
      setErrorMsg('Failed to create deadline. Please try again.')
    }
  }

  const handleDelete = (id) => {
    setIdToDelete(id)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    try {
      await deadlineApi.deleteDeadline(idToDelete)
      setShowDeleteConfirm(false)
      setIdToDelete(null)
      fetchData()
    } catch {
      setErrorMsg('Failed to delete deadline. Please try again.')
      setShowDeleteConfirm(false)
    }
  }

  const toggleStudent = (id) => {
    setFormData((prev) => ({
      ...prev,
      assignedStudents: prev.assignedStudents.includes(id)
        ? prev.assignedStudents.filter((s) => s !== id)
        : [...prev.assignedStudents, id],
    }))
  }

  const toggleAllStudents = () => {
    if (formData.assignedStudents.length === filteredStudents.length) {
      setFormData((prev) => ({ ...prev, assignedStudents: [] }))
    } else {
      setFormData((prev) => ({ ...prev, assignedStudents: filteredStudents.map((s) => s._id) }))
    }
  }

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) return <div className={styles.loading}>Loading deadlines...</div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title} data-testid="faculty-manage-deadlines-title">
          Manage Deadlines
        </h1>
        <button className={styles.createBtn} onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span>Create Deadline</span>
        </button>
      </div>

      <div className={styles.grid}>
        {deadlines.length > 0 ? (
          deadlines.map((d) => (
            <div key={d._id} className={styles.deadlineCard}>
              <div className={styles.cardHeader}>
                <div className={styles.metaItem}>
                  <Calendar size={14} />
                  <span>Created: {new Date(d.createdAt).toLocaleDateString()}</span>
                </div>
                <button className={styles.deleteBtn} onClick={() => handleDelete(d._id)}>
                  <Trash2 size={16} />
                </button>
              </div>
              <h3 className={styles.deadlineTitle}>{d.title}</h3>
              <p className={styles.deadlineDesc}>{d.description}</p>
              <div className={styles.deadlineMeta}>
                <div className={styles.metaItem}>
                  <Users size={14} />
                  <span className={styles.assignedCount}>
                    {d.assignedStudents?.length || 0} Students Assigned
                  </span>
                </div>
                {d.assignedStudents && d.assignedStudents.length > 0 && (
                  <div className={styles.assignedList}>
                    {d.assignedStudents.map((s) => (
                      <span key={s._id} className={styles.assignedStudent}>
                        {s.name} ({s.rollNumber})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className={styles.empty}>
            <Calendar size={48} className={styles.emptyIcon} />
            <p>No deadlines found. Create one to get started!</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>Create New Deadline</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreate} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Heading / Title</label>
                <input
                  type="text"
                  className={styles.input}
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. End Semester Project Submission"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  className={styles.textarea}
                  rows={4}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter deadline description and requirements..."
                />
              </div>

              <div className={styles.studentSelector}>
                <div className={styles.selectorHeader}>
                  <label className={styles.selectorLabel}>
                    <Users size={16} />
                    <span>Assign to Students</span>
                  </label>
                  <button type="button" className={styles.selectAllBtn} onClick={toggleAllStudents}>
                    {formData.assignedStudents.length === filteredStudents.length &&
                    filteredStudents.length > 0 ? (
                      <>
                        <CheckSquare size={14} /> Deselect All
                      </>
                    ) : (
                      <>
                        <Square size={14} /> Select All
                      </>
                    )}
                  </button>
                </div>

                <div className={styles.selectionSummary}>
                  <span className={styles.selectedBadge}>
                    {formData.assignedStudents.length} Selected
                  </span>
                </div>

                <div className={styles.searchBox}>
                  <Search size={16} className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>

                <div className={styles.studentList}>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((s) => (
                      <div
                        key={s._id}
                        className={`${styles.studentItem} ${formData.assignedStudents.includes(s._id) ? styles.selected : ''}`}
                        onClick={() => toggleStudent(s._id)}
                      >
                        <input
                          type="checkbox"
                          className={styles.realCheckbox}
                          checked={formData.assignedStudents.includes(s._id)}
                          readOnly
                        />
                        <div className={styles.studentInfo}>
                          <span className={styles.studentName}>{s.name}</span>
                          <span className={styles.studentRoll}>{s.rollNumber}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.noStudents}>
                      <p>
                        {searchTerm
                          ? 'No students match your search.'
                          : 'No students assigned to you.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <div className={styles.notifInfo}>
                  <Bell size={14} />
                  <span>Notifications will be sent instantly on creation.</span>
                </div>
                <div className={styles.btnGroup}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitBtn}>
                    Create & Notify
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {showSuccess && (
        <div className={styles.successOverlay}>
          <div className={styles.successCard}>
            <div className={styles.successIconBox}>
              <CheckCircle size={52} className={styles.successIcon} />
            </div>
            <h2 className={styles.successTitle}>Deadline Created!</h2>
            <p className={styles.successText}>
              The deadline has been successfully set and assigned students have been notified.
            </p>
            <button className={styles.successCloseBtn} onClick={() => setShowSuccess(false)}>
              Excellent
            </button>
          </div>
        </div>
      )}
      {showDeleteConfirm && (
        <div className={styles.successOverlay}>
          <div className={`${styles.successCard} ${styles.deleteCard}`}>
            <div className={`${styles.successIconBox} ${styles.deleteIconBox}`}>
              <AlertTriangle size={52} className={styles.deleteIcon} />
            </div>
            <h2 className={styles.successTitle}>Remove Deadline?</h2>
            <p className={styles.successText}>
              This action cannot be undone. All assigned students will lose access to this
              notification.
            </p>
            <div className={styles.modalBtnGroup}>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setIdToDelete(null)
                }}
              >
                No, Keep it
              </button>
              <button
                className={`${styles.successCloseBtn} ${styles.deleteBtn}`}
                onClick={confirmDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {errorMsg && (
        <div className={styles.successOverlay}>
          <div className={`${styles.successCard} ${styles.errorCard} ${styles.errorShake}`}>
            <div className={`${styles.successIconBox} ${styles.errorIconBox}`}>
              <AlertCircle size={52} className={styles.errorIcon} />
            </div>
            <h2 className={styles.successTitle}>Hold On...</h2>
            <p className={styles.successText}>{errorMsg}</p>
            <button
              className={`${styles.successCloseBtn} ${styles.errorCloseBtn}`}
              onClick={() => setErrorMsg(null)}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
