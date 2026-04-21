import { useRef, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import SpotlightBackground from './ui/SpotlightBackground'

const WORD_MIME_TYPES = [
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const getFileExtension = (name = '') => {
  const parts = name.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
}

export default function SystemConfiguration() {
  const navigate = useNavigate()
  const [adminUser, setAdminUser] = useState({ name: 'Admin', role: 'Admin', profilePicture: '' })
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const profileMenuRef = useRef(null)

  const [brochure, setBrochure] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fileInputRef = useRef(null)

  useEffect(() => {
    const onClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
    setAdminUser({
      name: storedUser.name || 'Admin',
      role: storedUser.role || 'Admin',
      profilePicture: storedUser.profilePicture || '',
    })
  }, [])

  const initialsFromName = (name = '') => {
    return (
      name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'A'
    )
  }

  const loadBrochure = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/brochure/current')
      setBrochure(data.brochure)
    } catch {
      setError('Failed to load brochure details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBrochure()
  }, [])

  const handleFilePick = (file) => {
    if (!file) return
    setError('')
    setSuccess('')

    const allowedMimeTypes = ['application/pdf', ...WORD_MIME_TYPES]
    const allowedExtensions = ['pdf', 'doc', 'docx']
    const extension = getFileExtension(file.name)

    if (!allowedMimeTypes.includes(file.type) || !allowedExtensions.includes(extension)) {
      setError('Only PDF, DOC, and DOCX files are allowed.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Brochure must be under 10 MB.')
      return
    }
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setUploading(true)
      setError('')
      setSuccess('')
      const fd = new FormData()
      fd.append('brochure', selectedFile)

      const { data } = await api.post('/brochure/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setBrochure(data.brochure)
      setSelectedFile(null)
      setSuccess('Points brochure uploaded successfully.')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload brochure.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="h-screen overflow-hidden flex" style={{ backgroundColor: '#f7f4eb' }}>
      <aside
        className={`admin-sidebar w-[260px] flex flex-col shrink-0 h-screen sticky top-0 px-4 pt-7 pb-5 z-50 ${isMobileMenuOpen ? 'open' : ''}`}
        style={{ backgroundColor: '#000000', color: '#FFFFFF' }}
      >
        <div className="px-2 mb-9 flex items-center justify-between">
          <span
            className="text-white text-[1.2rem] font-bold tracking-[0.3px]"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            SAPT
          </span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
            <span>Students</span>
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
          <Link
            to="/system_configuration"
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all font-semibold text-[0.92rem]"
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
                d="M10.325 4.317a1 1 0 011.35-.936l1.854.78a1 1 0 00.94 0l1.854-.78a1 1 0 011.35.936l.168 2.003a1 1 0 00.55.826l1.73.999a1 1 0 01.364 1.363l-1.02 1.767a1 1 0 000 1l1.02 1.768a1 1 0 01-.364 1.362l-1.73 1a1 1 0 00-.55.825l-.168 2.003a1 1 0 01-1.35.936l-1.854-.78a1 1 0 00-.94 0l-1.854.78a1 1 0 01-1.35-.936l-.168-2.003a1 1 0 00-.55-.826l-1.73-.999a1 1 0 01-.364-1.363l1.02-1.767a1 1 0 000-1l-1.02-1.768a1 1 0 01.364-1.362l1.73-1a1 1 0 00.55-.825l.168-2.003z"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
              <path
                d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></path>
            </svg>
            <span>System Configuration</span>
          </Link>
        </nav>

        <div ref={profileMenuRef} className="mt-auto" style={{ position: 'relative' }}>
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
                }}
              >
                View Profile
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowProfileMenu(false)
                  navigate('/login')
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
                }}
              >
                Logout
              </button>
            </div>
          )}

          <div
            className="flex items-center gap-2.5 p-2 rounded-[10px] cursor-pointer hover:bg-white/[0.07] transition-colors"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            {adminUser.profilePicture ? (
              <img
                src={adminUser.profilePicture}
                alt={adminUser.name || 'Admin'}
                className="w-[38px] h-[38px] rounded-full object-cover"
              />
            ) : (
              <div
                className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-[0.95rem]"
                style={{
                  background: 'linear-gradient(135deg, #f5a623, #f7b731)',
                  color: '#1a1a2e',
                }}
              >
                {initialsFromName(adminUser.name)}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[0.9rem] font-semibold text-white">
                {adminUser.name || 'Admin'}
              </span>
              <span className="text-[0.78rem] text-[#9ca3af]">({adminUser.role || 'Admin'})</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main
        className="flex-1 overflow-y-auto"
        style={{ backgroundColor: '#f7f4eb', fontFamily: 'Poppins, sans-serif' }}
      >
        <SpotlightBackground className="admin-spotlight-surface">
          <header className="mb-10 flex items-start gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg bg-white/10 text-gray-700 hover:bg-white/20 flex-shrink-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1
                className="text-[#111827]"
                style={{ fontWeight: 100, fontSize: '2.05rem', lineHeight: 1.15 }}
              >
                System Configuration
              </h1>
              <p className="text-gray-500 mt-1" style={{ fontWeight: 100, fontSize: '0.92rem' }}>
                Manage documents and global platform settings.
              </p>
            </div>
          </header>

          <section
            className="rounded-[16px] overflow-hidden mb-8"
            style={{
              background: 'rgba(253, 247, 233, 0.62)',
              border: '1.5px solid #e5e1d8',
              backdropFilter: 'blur(5px) saturate(135%)',
              WebkitBackdropFilter: 'blur(5px) saturate(135%)',
              boxShadow: '0 14px 40px rgba(26, 26, 46, 0.08)',
            }}
          >
            <div className="p-8">
              <h2
                className="text-[#111827] mb-4"
                style={{ fontWeight: 100, fontSize: '1.75rem', lineHeight: 1.15 }}
              >
                Points Brochure
              </h2>
              <p className="text-gray-600 mb-5" style={{ fontWeight: 300, fontSize: '0.95rem' }}>
                Upload the latest PDF or Word brochure that students can access from the Download
                Guidelines button.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                style={{ display: 'none' }}
                onChange={(e) => handleFilePick(e.target.files?.[0])}
              />

              <div
                onDragEnter={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                  handleFilePick(e.dataTransfer.files?.[0])
                }}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all"
                style={{
                  borderColor: isDragging ? '#f5a623' : '#d1d5db',
                  backgroundColor: '#f5ead5',
                  backdropFilter: 'blur(5px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(5px) saturate(120%)',
                }}
              >
                <p className="text-sm font-semibold text-[#111827]">
                  Drag and drop brochure file here
                </p>
                <p className="text-sm text-gray-500 mt-1">or click to browse file</p>
              </div>

              <div className="mt-4 flex flex-col items-start gap-3 w-full text-left">
                <span className="text-sm text-gray-700" style={{ fontWeight: 300 }}>
                  {selectedFile
                    ? `Selected: ${selectedFile.name}`
                    : brochure?.fileName
                      ? `Current: ${brochure.fileName}`
                      : loading
                        ? 'Loading brochure details...'
                        : 'No brochure uploaded yet.'}
                </span>

                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="flex items-center justify-center gap-2 px-5 text-sm rounded-lg border transition-all self-start"
                  style={{
                    border: '1.5px solid #e0a129',
                    color: '#111111',
                    background: !selectedFile || uploading ? '#f6c66f' : '#F4AD39',
                    backdropFilter: 'blur(5px) saturate(125%)',
                    WebkitBackdropFilter: 'blur(5px) saturate(125%)',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    height: '42px',
                    transition: 'background-color 0.2s ease',
                    cursor: !selectedFile || uploading ? 'not-allowed' : 'pointer',
                    opacity: !selectedFile || uploading ? 0.8 : 1,
                  }}
                  onMouseOver={(e) => {
                    if (!selectedFile || uploading) return
                    e.currentTarget.style.backgroundColor = '#f5ab27'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor =
                      !selectedFile || uploading ? '#f6c66f' : '#F4AD39'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    upload_file
                  </span>
                  <span>{uploading ? 'Uploading...' : 'Upload Brochure'}</span>
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {success}
                </div>
              )}
            </div>
          </section>
        </SpotlightBackground>
      </main>
    </div>
  )
}
