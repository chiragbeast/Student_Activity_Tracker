import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

const AddNewStudentUser = () => {
  const [sendActivationEmail, setSendActivationEmail] = useState(true)
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    rollNumber: '',
    department: '',
    batch: '',
    semester: '',
    phone: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAddStudent = async () => {
    setFormError(null)
    if (!form.name.trim() || !form.email.trim()) {
      setFormError('Full Name and Email Address are required.')
      return
    }
    try {
      setSubmitting(true)
      await api.post('/admin/students', {
        name: form.name,
        email: form.email,
        rollNumber: form.rollNumber || undefined,
        department: form.department || undefined,
        batch: form.batch || undefined,
        semester: form.semester || undefined,
        phone: form.phone || undefined,
      })
      navigate('/admin_student_management')
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add student. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate('/admin_student_management')
  }

  return (
    <div
      className="h-screen overflow-hidden flex font-display text-white"
      style={{ backgroundColor: '#FFFBF2' }}
    >
      {/* Sidebar Navigation */}
      <aside
        className="w-[260px] flex flex-col shrink-0 h-screen sticky top-0 px-4 pt-7 pb-5"
        style={{ backgroundColor: '#000000', color: '#FFFFFF' }}
      >
        <div className="px-2 mb-9 flex items-center gap-2.5">
          <span
            className="text-white text-[1.2rem] font-bold tracking-[0.3px]"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            SAPT
          </span>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          <Link
            to="/admin_dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-white/5 font-medium text-[0.92rem]"
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
            <span>Dashboard</span>
          </Link>
          <Link
            to="/admin_student_management"
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all font-semibold"
            style={{ backgroundColor: '#f5a623', color: '#1a1a2e' }}
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
            <span className="text-[0.92rem]">Students</span>
          </Link>
          <Link
            to="/faculty_advisor_management"
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-white/5 font-medium text-[0.92rem]"
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path d="M12 14l9-5-9-5-9 5 9 5z" strokeLinecap="round" strokeLinejoin="round"></path>
              <path
                d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <path
                d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
            <span>Faculty Members</span>
          </Link>
          <Link
            to="/reports_analytics"
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-white/5 font-medium text-[0.92rem]"
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
            <span>Reports</span>
          </Link>
        </nav>

        <div ref={profileMenuRef} className="mt-auto" style={{ position: 'relative' }}>
          <div
            style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '12px 8px 16px' }}
          ></div>

          {/* Profile Popup Menu */}
          {showProfileMenu && (
            <div
              style={{
                position: 'absolute',
                bottom: '70px',
                left: '8px',
                right: '8px',
                backgroundColor: '#000000',
                borderRadius: '12px',
                padding: '8px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                zIndex: 50,
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowProfileMenu(false)
                  navigate('/profile_settings')
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#e5e7eb',
                  fontSize: '0.88rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  fontFamily: 'inherit',
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')
                }
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg
                  className="w-[18px] h-[18px] flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
                View Profile
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowProfileMenu(false)
                  navigate('/')
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '0.88rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  fontFamily: 'inherit',
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)')
                }
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg
                  className="w-[18px] h-[18px] flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
                Logout
              </button>
            </div>
          )}

          <div
            className="flex items-center gap-2.5 p-2 rounded-[10px] cursor-pointer hover:bg-white/[0.07] transition-colors"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div
              className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-[0.95rem]"
              style={{ background: 'linear-gradient(135deg, #f5a623, #f7b731)', color: '#1a1a2e' }}
            >
              A
            </div>
            <div className="flex flex-col">
              <span className="text-[0.9rem] font-semibold text-white">Admin User</span>
              <span className="text-[0.78rem] text-[#9ca3af]">(Super Admin)</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className="flex-1 overflow-y-auto relative flex flex-col items-center justify-center p-8"
        style={{ backgroundColor: '#FFFBF2' }}
      >
        <div className="w-full max-w-2xl z-10">
          <header className="mb-8 text-center">
            <h2 className="text-4xl font-black tracking-tight mb-2" style={{ color: '#1a1a2e' }}>
              Add New Student User
            </h2>
            <p className="text-base" style={{ color: '#6b7280' }}>
              Register a new student to the SAPT administrative management system.
            </p>
          </header>

          {/* Form Card */}
          <div
            className="rounded-xl p-8 shadow-lg"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e1d8',
            }}
          >
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label
                    className="text-xs font-bold uppercase tracking-widest ml-1"
                    style={{ color: '#1a1a2e' }}
                  >
                    Full Name
                  </label>
                  <div className="relative group">
                    <span
                      className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-xl"
                      style={{ color: '#9ca3af' }}
                    >
                      person
                    </span>
                    <input
                      className="w-full border rounded-lg py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: '#fafaf8',
                        borderColor: '#e5e1d8',
                        color: '#1a1a2e',
                      }}
                      placeholder="Johnathan Doe"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      onFocus={(e) => (e.target.style.borderColor = '#f5a623')}
                      onBlur={(e) => (e.target.style.borderColor = '#e5e1d8')}
                    />
                  </div>
                </div>

                {/* Roll Number */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-xs font-bold uppercase tracking-widest ml-1"
                    style={{ color: '#1a1a2e' }}
                  >
                    Roll Number
                  </label>
                  <div className="relative group">
                    <span
                      className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-xl"
                      style={{ color: '#9ca3af' }}
                    >
                      badge
                    </span>
                    <input
                      className="w-full border rounded-lg py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: '#fafaf8',
                        borderColor: '#e5e1d8',
                        color: '#1a1a2e',
                      }}
                      placeholder="2024CS101"
                      type="text"
                      value={form.rollNumber}
                      onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                      onFocus={(e) => (e.target.style.borderColor = '#f5a623')}
                      onBlur={(e) => (e.target.style.borderColor = '#e5e1d8')}
                    />
                  </div>
                </div>

                {/* Department Dropdown */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-xs font-bold uppercase tracking-widest ml-1"
                    style={{ color: '#1a1a2e' }}
                  >
                    Department
                  </label>
                  <div className="relative group">
                    <span
                      className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-xl z-10 pointer-events-none"
                      style={{ color: '#9ca3af' }}
                    >
                      account_tree
                    </span>
                    <select
                      className="w-full appearance-none border rounded-lg py-3.5 pl-12 pr-10 focus:outline-none focus:ring-2 transition-all cursor-pointer"
                      style={{
                        backgroundColor: '#fafaf8',
                        borderColor: '#e5e1d8',
                        color: '#1a1a2e',
                      }}
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      onFocus={(e) => (e.target.style.borderColor = '#f5a623')}
                      onBlur={(e) => (e.target.style.borderColor = '#e5e1d8')}
                    >
                      <option
                        value=""
                        disabled
                        style={{ backgroundColor: '#ffffff', color: '#6b7280' }}
                      >
                        Select Department
                      </option>
                      <option
                        value="Computer Science & Engineering (CSE)"
                        style={{ backgroundColor: '#ffffff', color: '#1a1a2e' }}
                        className="py-2"
                      >
                        Computer Science & Engineering (CSE)
                      </option>
                      <option
                        value="Electronics & Communication Engineering (ECE)"
                        style={{ backgroundColor: '#ffffff', color: '#1a1a2e' }}
                        className="py-2"
                      >
                        Electronics & Communication Engineering (ECE)
                      </option>
                      <option
                        value="Electrical & Electronics Engineering (EEE)"
                        style={{ backgroundColor: '#ffffff', color: '#1a1a2e' }}
                        className="py-2"
                      >
                        Electrical & Electronics Engineering (EEE)
                      </option>
                      <option
                        value="Chemical Engineering (CH)"
                        style={{ backgroundColor: '#ffffff', color: '#1a1a2e' }}
                        className="py-2"
                      >
                        Chemical Engineering (CH)
                      </option>
                      <option
                        value="Mechanical Engineering (ME)"
                        style={{ backgroundColor: '#ffffff', color: '#1a1a2e' }}
                        className="py-2"
                      >
                        Mechanical Engineering (ME)
                      </option>
                      <option
                        value="Civil Engineering (CE)"
                        style={{ backgroundColor: '#ffffff', color: '#1a1a2e' }}
                        className="py-2"
                      >
                        Civil Engineering (CE)
                      </option>
                      <option
                        value="Biotechnology (BT)"
                        style={{ backgroundColor: '#ffffff', color: '#1a1a2e' }}
                        className="py-2"
                      >
                        Biotechnology (BT)
                      </option>
                      <option
                        value="Materials Science & Engineering (MSE)"
                        style={{ backgroundColor: '#ffffff', color: '#1a1a2e' }}
                        className="py-2"
                      >
                        Materials Science & Engineering (MSE)
                      </option>
                      <option
                        value="Production Engineering (PE)"
                        style={{ backgroundColor: '#ffffff', color: '#1a1a2e' }}
                        className="py-2"
                      >
                        Production Engineering (PE)
                      </option>
                      <option
                        value="Engineering Physics (EP)"
                        style={{ backgroundColor: '#ffffff', color: '#1a1a2e' }}
                        className="py-2"
                      >
                        Engineering Physics (EP)
                      </option>
                    </select>
                    <span
                      className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: '#f5a623' }}
                    >
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-xs font-bold uppercase tracking-widest ml-1"
                    style={{ color: '#1a1a2e' }}
                  >
                    Batch
                  </label>
                  <div className="relative group">
                    <span
                      className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-xl"
                      style={{ color: '#9ca3af' }}
                    >
                      groups
                    </span>
                    <input
                      className="w-full border rounded-lg py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: '#fafaf8',
                        borderColor: '#e5e1d8',
                        color: '#1a1a2e',
                      }}
                      placeholder="2023-2027"
                      type="text"
                      value={form.batch}
                      onChange={(e) => setForm({ ...form, batch: e.target.value })}
                      onFocus={(e) => (e.target.style.borderColor = '#f5a623')}
                      onBlur={(e) => (e.target.style.borderColor = '#e5e1d8')}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    className="text-xs font-bold uppercase tracking-widest ml-1"
                    style={{ color: '#1a1a2e' }}
                  >
                    Semester
                  </label>
                  <div className="relative group">
                    <span
                      className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-xl z-10 pointer-events-none"
                      style={{ color: '#9ca3af' }}
                    >
                      calendar_month
                    </span>
                    <select
                      className="w-full appearance-none border rounded-lg py-3.5 pl-12 pr-10 focus:outline-none focus:ring-2 transition-all cursor-pointer"
                      style={{
                        backgroundColor: '#fafaf8',
                        borderColor: '#e5e1d8',
                        color: '#1a1a2e',
                      }}
                      value={form.semester}
                      onChange={(e) => setForm({ ...form, semester: e.target.value })}
                      onFocus={(e) => (e.target.style.borderColor = '#f5a623')}
                      onBlur={(e) => (e.target.style.borderColor = '#e5e1d8')}
                    >
                      <option value="" style={{ backgroundColor: '#ffffff', color: '#6b7280' }}>
                        Select Semester
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
                    <span
                      className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: '#f5a623' }}
                    >
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-xs font-bold uppercase tracking-widest ml-1"
                    style={{ color: '#1a1a2e' }}
                  >
                    Mobile Number
                  </label>
                  <div className="relative group">
                    <span
                      className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-xl"
                      style={{ color: '#9ca3af' }}
                    >
                      call
                    </span>
                    <input
                      className="w-full border rounded-lg py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: '#fafaf8',
                        borderColor: '#e5e1d8',
                        color: '#1a1a2e',
                      }}
                      placeholder="+91 98765 43210"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      onFocus={(e) => (e.target.style.borderColor = '#f5a623')}
                      onBlur={(e) => (e.target.style.borderColor = '#e5e1d8')}
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="flex flex-col gap-2">
                  <label
                    className="text-xs font-bold uppercase tracking-widest ml-1"
                    style={{ color: '#1a1a2e' }}
                  >
                    Email Address
                  </label>
                  <div className="relative group">
                    <span
                      className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 transition-colors text-xl"
                      style={{ color: '#9ca3af' }}
                    >
                      mail
                    </span>
                    <input
                      className="w-full border rounded-lg py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 transition-all text-[#1a1a2e]"
                      style={{
                        backgroundColor: '#fafaf8',
                        borderColor: '#e5e1d8',
                        color: '#1a1a2e',
                      }}
                      placeholder="student@nitc.ac.in"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      onFocus={(e) => (e.target.style.borderColor = '#f5a623')}
                      onBlur={(e) => (e.target.style.borderColor = '#e5e1d8')}
                    />
                  </div>
                </div>
              </div>

              {/* Activation Toggle */}
              <div
                className="pt-4 flex items-center justify-between p-4 rounded-xl border"
                style={{ backgroundColor: '#fafaf8', borderColor: '#e5e1d8' }}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-bold" style={{ color: '#1a1a2e' }}>
                    Send Activation Email
                  </span>
                  <span className="text-xs" style={{ color: '#6b7280' }}>
                    Student will receive an email to set their password immediately.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendActivationEmail}
                    onChange={(e) => setSendActivationEmail(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 rounded-full peer-focus:outline-none peer-checked:bg-[#f5a623] bg-[#d1d5db] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              {/* Error Message */}
              {formError && (
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '0.88rem',
                    fontWeight: '500',
                  }}
                >
                  {formError}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleAddStudent}
                  disabled={submitting}
                  className="flex-1 text-white font-bold py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #f5a623 0%, #f7b731 100%)',
                    boxShadow: '0 4px 15px rgba(245, 166, 35, 0.4)',
                    opacity: submitting ? 0.7 : 1,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span className="material-symbols-outlined">person_add</span>
                  {submitting ? 'Adding...' : 'Add Student User'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-8 py-4 font-bold rounded-lg transition-all hover:brightness-95"
                  style={{ backgroundColor: '#e5e1d8', color: '#1a1a2e' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AddNewStudentUser
