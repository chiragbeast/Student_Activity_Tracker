import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api'

const EditStudent = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [isActive, setIsActive] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedAdvisor, setSelectedAdvisor] = useState(null)
  const [form, setForm] = useState({
    name: '',
    rollNumber: '',
    phone: '',
    department: '',
    batch: '',
    semester: '',
  })
  const [facultyList, setFacultyList] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const { data } = await api.get(`/admin/students/${id}`)
        const s = data.student
        setForm({
          name: s.name || '',
          rollNumber: s.rollNumber || '',
          phone: s.phone || '',
          department: s.department || '',
          batch: s.batch || '',
          semester: s.semester || '',
        })
        setIsActive(s.isActive ?? true)
        setSelectedAdvisor(s.facultyAdvisor || null)
        setFacultyList(data.facultyList || [])
      } catch {
        setFetchError('Failed to load student data.')
      } finally {
        setLoading(false)
      }
    }
    fetchStudent()
  }, [id])

  const filteredAdvisors = facultyList.filter(
    (advisor) =>
      advisor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (advisor.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSave = async (e) => {
    e.preventDefault()
    setSaveError(null)
    try {
      setSaving(true)
      await api.put(`/admin/students/${id}`, {
        name: form.name,
        rollNumber: form.rollNumber,
        department: form.department,
        batch: form.batch,
        semester: form.semester,
        phone: form.phone,
        isActive,
        facultyAdvisorId: selectedAdvisor?._id || null,
      })
      navigate('/admin_student_management')
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    navigate('/admin_student_management')
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      await api.delete(`/admin/students/${id}`)
      navigate('/admin_student_management')
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to delete student.')
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  const controlHeight = '50px'
  const fieldClassName =
    'w-full border rounded-[7px] px-4 text-[0.9rem] font-[100] placeholder:text-[#9ca3af] placeholder:font-[100] focus:outline-none transition-all'
  const fieldStyle = {
    background: 'rgba(253, 247, 233, 0.48)',
    borderColor: '#e5e1d8',
    borderRadius: '7px',
    height: controlHeight,
    minHeight: controlHeight,
    maxHeight: controlHeight,
    boxSizing: 'border-box',
    color: '#1a1a2e',
    lineHeight: '1.2',
    backdropFilter: 'blur(8px) saturate(125%)',
    WebkitBackdropFilter: 'blur(8px) saturate(125%)',
  }

  return (
    <div
      className="min-h-screen flex font-display p-6 relative overflow-y-auto overflow-x-hidden"
      style={{ backgroundColor: '#FFFBF2', fontFamily: 'Poppins, sans-serif', fontWeight: 100 }}
    >
      {loading ? (
        <div
          className="w-full flex items-center justify-center"
          style={{ color: '#6b7280', fontSize: '1rem' }}
        >
          Loading student data...
        </div>
      ) : fetchError ? (
        <div
          className="w-full flex items-center justify-center"
          style={{ color: '#ef4444', fontSize: '1rem' }}
        >
          {fetchError}
        </div>
      ) : (
        <main className="w-full max-w-2xl mx-auto">
          {/* Main Edit Card */}
          <div
            className="rounded-[16px] p-8 border"
            style={{
              background: 'rgba(253, 247, 233, 0.62)',
              border: '1.5px solid #e5e1d8',
              backdropFilter: 'blur(5px) saturate(135%)',
              WebkitBackdropFilter: 'blur(5px) saturate(135%)',
              boxShadow: '0 14px 40px rgba(26, 26, 46, 0.08)',
            }}
          >
            {/* Header */}
            <header
              className="mb-8 border-b pb-6 flex items-center justify-between"
              style={{ borderColor: '#e5e1d8' }}
            >
              <div>
                <h1
                  className="text-3xl tracking-tight"
                  style={{ color: '#1a1a2e', fontWeight: 100 }}
                >
                  Edit <span className="text-primary">Student</span>
                </h1>
                <p className="text-sm mt-1" style={{ color: '#6b7280', fontWeight: 100 }}>
                  Manage student identity and academic permissions
                </p>
              </div>
            </header>

            <form className="space-y-8" onSubmit={handleSave}>
              {/* Basic Information Section */}
              <section>
                <h2 className="text-lg mb-6" style={{ color: '#1a1a2e', fontWeight: 100 }}>
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <input
                      className={fieldClassName}
                      style={fieldStyle}
                      type="text"
                      placeholder="Full Name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      onFocus={(e) => (e.target.style.borderColor = '#f5a623')}
                      onBlur={(e) => (e.target.style.borderColor = '#e5e1d8')}
                    />
                  </div>

                  {/* Roll Number */}
                  <div className="space-y-2">
                    <input
                      className={fieldClassName}
                      style={fieldStyle}
                      type="text"
                      placeholder="Roll Number"
                      value={form.rollNumber}
                      onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                      onFocus={(e) => (e.target.style.borderColor = '#f5a623')}
                      onBlur={(e) => (e.target.style.borderColor = '#e5e1d8')}
                    />
                  </div>

                  {/* Mobile Number */}
                  <div className="space-y-2">
                    <input
                      className={fieldClassName}
                      style={fieldStyle}
                      type="text"
                      placeholder="Batch"
                      value={form.batch}
                      onChange={(e) => setForm({ ...form, batch: e.target.value })}
                      onFocus={(e) => (e.target.style.borderColor = '#f5a623')}
                      onBlur={(e) => (e.target.style.borderColor = '#e5e1d8')}
                    />
                  </div>

                  <div className="space-y-2">
                    <select
                      className={`${fieldClassName} cursor-pointer`}
                      style={{ ...fieldStyle, color: form.semester ? '#1a1a2e' : '#9ca3af' }}
                      value={form.semester}
                      onChange={(e) => setForm({ ...form, semester: e.target.value })}
                      onFocus={(e) => (e.target.style.borderColor = '#f5a623')}
                      onBlur={(e) => (e.target.style.borderColor = '#e5e1d8')}
                    >
                      <option value="" style={{ color: '#6b7280' }}>
                        Semester
                      </option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <select
                      className={`${fieldClassName} cursor-pointer`}
                      style={{ ...fieldStyle, color: form.department ? '#1a1a2e' : '#9ca3af' }}
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      onFocus={(e) => (e.target.style.borderColor = '#f5a623')}
                      onBlur={(e) => (e.target.style.borderColor = '#e5e1d8')}
                    >
                      <option value="" style={{ color: '#6b7280' }}>
                        Branch
                      </option>
                      <option value="Computer Science & Engineering (CSE)">
                        Computer Science & Engineering (CSE)
                      </option>
                      <option value="Electronics & Communication Engineering (ECE)">
                        Electronics & Communication Engineering (ECE)
                      </option>
                      <option value="Electrical & Electronics Engineering (EEE)">
                        Electrical & Electronics Engineering (EEE)
                      </option>
                      <option value="Chemical Engineering (CH)">Chemical Engineering (CH)</option>
                      <option value="Mechanical Engineering (ME)">
                        Mechanical Engineering (ME)
                      </option>
                      <option value="Civil Engineering (CE)">Civil Engineering (CE)</option>
                      <option value="Biotechnology (BT)">Biotechnology (BT)</option>
                      <option value="Materials Science & Engineering (MSE)">
                        Materials Science & Engineering (MSE)
                      </option>
                      <option value="Production Engineering (PE)">
                        Production Engineering (PE)
                      </option>
                      <option value="Engineering Physics (EP)">Engineering Physics (EP)</option>
                    </select>
                  </div>

                  {/* Mobile Number */}
                  <div className="space-y-2">
                    <input
                      className={fieldClassName}
                      style={fieldStyle}
                      type="tel"
                      placeholder="Mobile Number"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      onFocus={(e) => (e.target.style.borderColor = '#f5a623')}
                      onBlur={(e) => (e.target.style.borderColor = '#e5e1d8')}
                    />
                  </div>
                </div>
              </section>

              {/* Academic Assignment Section */}
              <section>
                <h2 className="text-lg mb-6" style={{ color: '#1a1a2e', fontWeight: 100 }}>
                  Academic Assignment
                </h2>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      className={`${fieldClassName} cursor-pointer pr-10`}
                      style={fieldStyle}
                      placeholder="Search faculty advisors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={(e) => {
                        setShowDropdown(true)
                        e.target.style.borderColor = '#f5a623'
                      }}
                      onBlur={(e) => {
                        setTimeout(() => setShowDropdown(false), 200)
                        e.target.style.borderColor = '#e5e1d8'
                      }}
                    />
                    <span
                      className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: '#9ca3af', fontSize: '18px' }}
                    >
                      expand_more
                    </span>

                    {/* Dropdown */}
                    {showDropdown && (
                      <div
                        className="absolute z-20 w-full mt-2 border rounded-lg shadow-xl max-h-60 overflow-y-auto"
                        style={{ backgroundColor: '#ffffff', borderColor: '#e5e1d8' }}
                      >
                        {filteredAdvisors.length > 0 ? (
                          filteredAdvisors.map((advisor) => (
                            <div
                              key={advisor._id}
                              className="px-4 py-3 cursor-pointer transition-colors border-b last:border-b-0"
                              style={{ borderColor: '#e5e1d8', backgroundColor: '#f5ead5' }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.backgroundColor = '#f1dfbf')
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.backgroundColor = '#f5ead5')
                              }
                              onClick={() => {
                                setSelectedAdvisor(advisor)
                                setSearchQuery('')
                                setShowDropdown(false)
                              }}
                            >
                              <p className="text-sm" style={{ color: '#1a1a2e', fontWeight: 100 }}>
                                {advisor.name}
                              </p>
                              <p className="text-xs" style={{ color: '#6b7280', fontWeight: 100 }}>
                                {advisor.department || ''}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm" style={{ color: '#6b7280' }}>
                            No faculty advisors found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {!showDropdown && selectedAdvisor && (
                    <p
                      className="text-sm border rounded px-3 py-2 mt-2"
                      style={{
                        color: '#1a1a2e',
                        backgroundColor: '#fff4e6',
                        borderColor: '#f5a623',
                        fontWeight: 100,
                      }}
                    >
                      Selected: {selectedAdvisor.name}
                      {selectedAdvisor.department ? ` (${selectedAdvisor.department})` : ''}
                    </p>
                  )}
                </div>
              </section>

              {/* Account Status Section */}
              <section
                className="p-4 border"
                style={{
                  background: 'rgba(253, 247, 233, 0.48)',
                  borderColor: '#e5e1d8',
                  borderRadius: '7px',
                  backdropFilter: 'blur(8px) saturate(125%)',
                  WebkitBackdropFilter: 'blur(8px) saturate(125%)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm" style={{ color: '#1a1a2e', fontWeight: 100 }}>
                      Account Status
                    </span>
                    <span className="text-xs" style={{ color: '#6b7280', fontWeight: 100 }}>
                      Current state:{' '}
                      <span
                        className={`uppercase ${isActive ? 'text-emerald-500' : 'text-red-500'}`}
                        style={{ fontWeight: 100 }}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 rounded-full peer-focus:outline-none peer-checked:bg-[#f5a623] bg-[#d1d5db] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    <span className="ml-3 text-sm" style={{ color: '#1a1a2e', fontWeight: 100 }}>
                      Activate Account
                    </span>
                  </label>
                </div>
              </section>

              {/* Save Error */}
              {saveError && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                  }}
                >
                  {saveError}
                </div>
              )}

              {/* Action Footer */}
              <footer
                className="flex items-center justify-between gap-4 pt-4 border-t"
                style={{ borderColor: '#e5e1d8' }}
              >
                <button
                  className="px-6 py-2.5 rounded-lg border hover:brightness-95 transition-all text-sm flex items-center gap-2"
                  style={{ borderColor: '#ef4444', backgroundColor: '#ef4444', color: '#111111' }}
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                  Delete Account
                </button>
                <div className="flex items-center gap-4">
                  <button
                    className="flex items-center justify-center gap-2 px-5 text-sm rounded-lg border transition-all"
                    style={{
                      border: '1.5px solid #d1d5db',
                      color: '#111827',
                      background: 'rgba(253, 247, 233, 0.48)',
                      backdropFilter: 'blur(5px) saturate(125%)',
                      WebkitBackdropFilter: 'blur(5px) saturate(125%)',
                      fontWeight: 500,
                      fontFamily: 'inherit',
                      transition: 'background-color 0.2s ease',
                      height: '50px',
                    }}
                    type="button"
                    onClick={handleCancel}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5ab27'
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = 'rgba(253, 247, 233, 0.48)'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-8 py-2.5 rounded-lg text-white hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm flex items-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #f5a623 0%, #f7b731 100%)',
                      boxShadow: '0 4px 15px rgba(245, 166, 35, 0.4)',
                      opacity: saving ? 0.7 : 1,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      color: '#111111',
                      fontWeight: 100,
                    }}
                    type="submit"
                    disabled={saving}
                  >
                    <span className="material-symbols-outlined text-lg">save</span>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </footer>
            </form>
          </div>
        </main>
      )}{' '}
      {/* end loading conditional */}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-2xl" style={{ fontWeight: 100 }}>
                  !
                </span>
              </div>
              <div>
                <h3 className="text-lg" style={{ color: '#1a1a2e', fontWeight: 100 }}>
                  Delete Student Account
                </h3>
                <p className="text-sm" style={{ color: '#6b7280' }}>
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
              Are you sure you want to permanently delete this student account? All associated data
              including activity points and records will be removed from the system.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-lg border hover:brightness-95 transition-all text-sm"
                style={{ borderColor: '#e5e1d8', color: '#1a1a2e', backgroundColor: '#fafaf8' }}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg hover:brightness-90 transition-all text-sm text-white"
                style={{ backgroundColor: '#ef4444', fontWeight: 100 }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditStudent
