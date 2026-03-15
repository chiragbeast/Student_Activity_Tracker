import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

const AdminUserManagement = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data } = await api.get('/admin/students');
        setStudents(data);
      } catch (err) {
        setError('Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-screen overflow-hidden flex font-[Inter,sans-serif]" style={{backgroundColor: '#FFFBF2'}}>
      {/* Sidebar */}
      <aside className="w-[260px] flex flex-col shrink-0 h-screen sticky top-0 px-4 pt-7 pb-5" style={{backgroundColor: '#000000', color: '#FFFFFF'}}>
        <div className="px-2 mb-9 flex items-center gap-2.5">
          <span className="text-white text-[1.2rem] font-bold tracking-[0.3px]" style={{fontFamily: 'Poppins, sans-serif'}}>SAPT</span>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          <Link 
            to="/admin_dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-white/5 font-medium text-[0.92rem]"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>Dashboard</span>
          </Link>
          <Link 
            to="/admin_student_management"
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all font-semibold text-[0.92rem]"
            style={{backgroundColor: '#f5a623', color: '#1a1a2e'}}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>Students</span>
          </Link>
          <Link 
            to="/faculty_advisor_management"
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-white/5 font-medium text-[0.92rem]"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M12 14l9-5-9-5-9 5 9 5z" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" strokeLinecap="round" strokeLinejoin="round"></path>
              <path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>Faculty Members</span>
          </Link>
          <Link 
            to="/reports_analytics"
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-white/5 font-medium text-[0.92rem]"
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <span>Reports</span>
          </Link>
        </nav>

        <div ref={profileMenuRef} className="mt-auto" style={{position: 'relative'}}>
          <div style={{height: '1px', background: 'rgba(255,255,255,0.1)', margin: '12px 8px 16px'}}></div>
          
          {/* Profile Popup Menu */}
          {showProfileMenu && (
            <div style={{
              position: 'absolute',
              bottom: '70px',
              left: '8px',
              right: '8px',
              backgroundColor: '#000000',
              borderRadius: '12px',
              padding: '8px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              zIndex: 50
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileMenu(false);
                  navigate('/profile_settings');
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
                  fontFamily: 'inherit'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                View Profile
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileMenu(false);
                  navigate('/');
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
                  fontFamily: 'inherit'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                Logout
              </button>
            </div>
          )}
          
          <div 
            className="flex items-center gap-2.5 p-2 rounded-[10px] cursor-pointer hover:bg-white/[0.07] transition-colors"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center font-bold text-[0.95rem]" style={{background: 'linear-gradient(135deg, #f5a623, #f7b731)', color: '#1a1a2e'}}>
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
      <main className="flex-1 overflow-y-auto p-10" style={{backgroundColor: '#FFFBF2'}}>
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-[#111827]">Student Management</h1>
            <p className="text-gray-500 mt-1">Manage access and assignments for {loading ? '...' : `${students.length} active`} students.</p>
          </div>
          <div className="flex items-center gap-6">
            <Link 
              to="/add_new_student"
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-lg shadow-lg hover:opacity-90 transition-all"
              style={{backgroundColor: '#F4AD39'}}
            >
              <span>+</span>
              <span>Create New Student</span>
            </Link>
          </div>
        </header>

        <div>
          {/* Search  */}
          <div className="mb-6">
            <div className="relative flex items-center w-full h-11 rounded-lg border bg-white border-gray-200">
              <svg className="w-5 h-5 absolute left-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <input
                className="w-full h-full bg-transparent border-none focus:ring-0 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400"
                placeholder="Search by name, email, or department..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* User Table */}
          <div className="rounded-[24px] shadow-sm overflow-hidden bg-white">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-2xl font-bold text-[#111827]">Students</h4>
              </div>
              <div className="overflow-hidden rounded-[10px]" style={{ border: '1px solid #f3f4f6' }}>
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-white text-[10px] font-bold uppercase tracking-widest" style={{backgroundColor: '#14213D'}}>
                      <th className="py-4 px-6" style={{borderTopLeftRadius: '10px'}}>Name</th>
                      <th className="py-4 px-6">Points</th>
                      <th className="py-4 px-6">Department</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right" style={{borderTopRightRadius: '10px'}}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {loading ? (
                      <tr><td colSpan={5} className="py-10 text-center text-gray-400">Loading...</td></tr>
                    ) : error ? (
                      <tr><td colSpan={5} className="py-10 text-center text-red-400">{error}</td></tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr><td colSpan={5} className="py-10 text-center text-gray-400">No students found.</td></tr>
                    ) : filteredStudents.map((student) => (
                      <tr key={student._id} className="border-b last:border-0 transition-colors hover:bg-[#fffbf2]" style={{borderColor: '#f3f4f6'}}>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                              style={{background: 'linear-gradient(135deg, #f5a623, #f7b731)', color: '#1a1a2e'}}
                            >
                              {student.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#111827]">{student.name}</p>
                              <p className="text-xs text-gray-400">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-lg font-bold text-[#111827]">{student.totalPoints ?? 0}</span>
                          <span className="text-xs ml-1 text-gray-500">pts</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-medium text-gray-700">{student.department ? student.department.toUpperCase() : '—'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '5px 14px',
                            borderRadius: '999px',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            color: student.isActive ? '#16a34a' : '#6b7280',
                            border: student.isActive ? '1.5px solid #bbf7d0' : '1.5px solid #e5e7eb',
                            backgroundColor: student.isActive ? '#f0fdf4' : '#f9fafb'
                          }}>
                            <span style={{
                              width: '7px', height: '7px', borderRadius: '50%',
                              backgroundColor: student.isActive ? '#16a34a' : '#9ca3af'
                            }}></span>
                            {student.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => console.log('Download transcript for student:', student._id)}
                              className="inline-block p-1.5 hover:opacity-70 transition-colors"
                              style={{color: '#F4AD39'}}
                              title="Download Transcript"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                              </svg>
                            </button>
                            <Link
                              to={`/edit_student/${student._id}`}
                              className="inline-block p-1.5 hover:opacity-70 transition-colors"
                              style={{color: '#F4AD39'}}
                              title="Edit Student"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                              </svg>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminUserManagement;