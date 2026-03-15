import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ReportsAnalytics = () => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('CSE');
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const branches = ['CSE', 'ECE', 'EEE', 'CH', 'ME', 'CE', 'BT', 'MSE', 'PE', 'EP'];

  // Mock data: Average activity points per student for each year and branch
  const yearWiseData = {
    'CSE': [320, 380, 450, 520],
    'ECE': [310, 370, 430, 490],
    'EEE': [290, 350, 410, 470],
    'CH': [340, 410, 480, 550],
    'ME': [305, 365, 425, 485],
    'CE': [280, 330, 390, 450],
    'BT': [360, 430, 510, 590],
    'MSE': [315, 375, 440, 500],
    'PE': [325, 390, 460, 530],
    'EP': [300, 360, 420, 480]
  };

  // Students data for top performers table
  const students = [
    {
      id: 1,
      name: 'Alexander Wright',
      email: 'a.wright@sapt.com',
      totalPoints: 1450,
      department: 'Computer Science & Engineering',
      status: 'active',
      avatar: 'https://i.pravatar.cc/150?img=1'
    },
    {
      id: 2,
      name: 'Sarah Jenkins',
      email: 's.jenkins@sapt.com',
      totalPoints: 1120,
      department: 'Electronics & Communication',
      status: 'active',
      avatar: 'https://i.pravatar.cc/150?img=5'
    },
    {
      id: 3,
      name: 'Marcus Thorne',
      email: 'm.thorne@sapt.com',
      totalPoints: 980,
      department: 'Mechanical Engineering',
      status: 'active',
      avatar: 'https://i.pravatar.cc/150?img=12'
    },
    {
      id: 4,
      name: 'Elena Rodriguez',
      email: 'e.rod@sapt.com',
      totalPoints: 750,
      department: 'Civil Engineering',
      status: 'deactivated',
      avatar: null
    },
    {
      id: 5,
      name: 'David Kim',
      email: 'd.kim@sapt.com',
      totalPoints: 1350,
      department: 'Electrical & Electronics',
      status: 'active',
      avatar: 'https://i.pravatar.cc/150?img=33'
    },
    {
      id: 6,
      name: 'Priya Sharma',
      email: 'p.sharma@sapt.com',
      totalPoints: 1580,
      department: 'Computer Science & Engineering',
      status: 'active',
      avatar: 'https://i.pravatar.cc/150?img=25'
    },
    {
      id: 7,
      name: 'James Wilson',
      email: 'j.wilson@sapt.com',
      totalPoints: 890,
      department: 'Chemical Engineering',
      status: 'active',
      avatar: 'https://i.pravatar.cc/150?img=15'
    },
    {
      id: 8,
      name: 'Aisha Patel',
      email: 'a.patel@sapt.com',
      totalPoints: 1240,
      department: 'Biotechnology',
      status: 'pending',
      avatar: 'https://i.pravatar.cc/150?img=45'
    },
    {
      id: 9,
      name: 'Ryan Cooper',
      email: 'r.cooper@sapt.com',
      totalPoints: 1095,
      department: 'Materials Science & Engineering',
      status: 'active',
      avatar: 'https://i.pravatar.cc/150?img=52'
    },
    {
      id: 10,
      name: 'Lakshmi Nair',
      email: 'l.nair@sapt.com',
      totalPoints: 1670,
      department: 'Production Engineering',
      status: 'active',
      avatar: 'https://i.pravatar.cc/150?img=38'
    }
  ];

  const departmentData = [
    { label: 'CSE', value: 385, height: 70 },
    { label: 'ECE', value: 342, height: 60 },
    { label: 'EEE', value: 298, height: 50 },
    { label: 'CH', value: 412, height: 80 },
    { label: 'ME', value: 365, height: 65 },
    { label: 'CE', value: 278, height: 45 },
    { label: 'BT', value: 456, height: 90 },
    { label: 'MSE', value: 321, height: 55 },
    { label: 'PE', value: 389, height: 72 },
    { label: 'EP', value: 334, height: 58 }
  ];

  const topStudents = [
    {
      rank: 1,
      name: 'Alex Johnson',
      department: 'Computer Science',
      points: 4200,
      status: 'On Track',
      trend: 'up',
      avatar: 'https://i.pravatar.cc/150?img=11'
    },
    {
      rank: 2,
      name: 'Maria Garcia',
      department: 'Engineering',
      points: 3950,
      status: 'On Track',
      trend: 'up',
      avatar: 'https://i.pravatar.cc/150?img=24'
    },
    {
      rank: 3,
      name: 'Liam Chen',
      department: 'Biology',
      points: 3800,
      status: 'On Track',
      trend: 'stable',
      avatar: 'https://i.pravatar.cc/150?img=32'
    },
    {
      rank: 4,
      name: 'Sarah Smith',
      department: 'Mathematics',
      points: 3650,
      status: 'At Risk',
      trend: 'down',
      avatar: 'https://i.pravatar.cc/150?img=40'
    }
  ];

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
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-white/5 font-medium text-[0.92rem]"
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
            className="flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all font-semibold text-[0.92rem]"
            style={{backgroundColor: '#f5a623', color: '#1a1a2e'}}
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
            <h1 className="text-3xl font-bold text-[#111827]">Reports Analytics</h1>
            <p className="text-gray-500 mt-1">Comprehensive performance insights and data visualization.</p>
          </div>
        </header>

        <div>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-[24px] shadow-sm">
              <p className="text-gray-500 font-medium uppercase tracking-wider text-xs">Total Points Awarded</p>
              <h3 className="text-5xl font-bold text-[#15173D] mt-2">384,250</h3>
            </div>
            <div className="bg-white p-6 rounded-[24px] shadow-sm">
              <p className="text-gray-500 font-medium uppercase tracking-wider text-xs">Active Students</p>
              <h3 className="text-5xl font-bold text-[#15173D] mt-2">1,248</h3>
            </div>
            <div className="bg-white p-6 rounded-[24px] shadow-sm">
              <p className="text-gray-500 font-medium uppercase tracking-wider text-xs">Avg Points/Student</p>
              <h3 className="text-5xl font-bold text-[#15173D] mt-2">1,325</h3>
            </div>
            <div className="bg-white p-6 rounded-[24px] shadow-sm">
              <p className="text-gray-500 font-medium uppercase tracking-wider text-xs">Activities</p>
              <h3 className="text-5xl font-bold text-[#15173D] mt-2">456</h3>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Department Chart */}
            <div className="bg-white p-8 rounded-[24px] shadow-sm">
              <h4 className="text-lg font-bold text-[#111827] mb-6">Department Distribution</h4>
              <div className="flex items-end justify-between h-64 gap-2 px-4">
                {departmentData.map((dept, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 flex-1 group relative">
                    <div className="flex items-end h-48 w-full justify-center">
                      <div className="w-full rounded-t-sm relative group/bar" style={{height: `${dept.height}%`, backgroundColor: '#F4AD39'}}>
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">{dept.value} pts</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400">{dept.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Year-wise Average Points Line Graph */}
            <div className="bg-white p-8 rounded-[24px] shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-bold text-[#111827]">Average Activity Points by Year</h4>
              <select 
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-4 py-2 rounded-lg border-2 border-gray-200 text-sm font-medium text-[#111827] focus:outline-none focus:border-[#F4AD39] transition-colors cursor-pointer"
                style={{backgroundColor: '#FFFBF2'}}
              >
                {branches.map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
            
            <div className="relative" style={{height: '400px'}}>
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-12 w-12 flex flex-col justify-between text-right pr-2 text-xs text-gray-500 font-medium">
                <span>600</span>
                <span>500</span>
                <span>400</span>
                <span>300</span>
                <span>200</span>
                <span>100</span>
                <span>0</span>
              </div>

              {/* Graph area */}
              <div className="absolute left-14 right-0 top-0 bottom-0">
                <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="none" className="overflow-visible">
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={i * 60}
                      x2="800"
                      y2={i * 60}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}

                  {/* Line path */}
                  <polyline
                    points={yearWiseData[selectedBranch].map((value, index) => {
                      const x = (index * 800) / 3;
                      const y = 360 - (value / 600) * 360;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#F4AD39"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />

                  {/* Data points */}
                  {yearWiseData[selectedBranch].map((value, index) => {
                    const x = (index * 800) / 3;
                    const y = 360 - (value / 600) * 360;
                    return (
                      <g key={index}>
                        <circle
                          cx={x}
                          cy={y}
                          r="6"
                          fill="#F4AD39"
                          vectorEffect="non-scaling-stroke"
                        />
                        <circle
                          cx={x}
                          cy={y}
                          r="3"
                          fill="white"
                          vectorEffect="non-scaling-stroke"
                        />
                        {/* Value label */}
                        <text
                          x={x}
                          y={y - 15}
                          textAnchor="middle"
                          className="text-xs font-bold"
                          fill="#111827"
                          style={{fontSize: '12px'}}
                        >
                          {value}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* X-axis labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-0">
                  <span className="text-sm font-bold text-gray-600">1st Year</span>
                  <span className="text-sm font-bold text-gray-600">2nd Year</span>
                  <span className="text-sm font-bold text-gray-600">3rd Year</span>
                  <span className="text-sm font-bold text-gray-600">4th Year</span>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Top Performers Table */}
          <div className="rounded-[24px] shadow-sm overflow-hidden bg-white">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h4 className="text-2xl font-bold text-[#111827]">Top Performers</h4>
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
                    {students.map((student) => (
                      <tr key={student.id} className="border-b last:border-0 transition-colors hover:bg-[#fffbf2]" style={{borderColor: '#f3f4f6'}}>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-full bg-center bg-cover"
                              style={{backgroundImage: student.avatar ? `url('${student.avatar}')` : 'none', backgroundColor: student.avatar ? 'transparent' : '#ddd'}}
                            ></div>
                            <div>
                              <p className="text-sm font-bold text-[#111827]">{student.name}</p>
                              <p className="text-xs text-gray-400">{student.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-lg font-bold text-[#111827]">{student.totalPoints}</span>
                          <span className="text-xs ml-1 text-gray-500">pts</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-medium text-gray-700">{student.department}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className={`flex items-center gap-2 ${student.status === 'deactivated' ? 'opacity-50' : ''}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${student.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                            <span className="text-sm text-gray-700">
                              {student.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => console.log('Download transcript for student:', student.id)}
                              className="inline-block p-1.5 hover:opacity-70 transition-colors" 
                              style={{color: '#F4AD39'}}
                              title="Download Transcript"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                              </svg>
                            </button>
                            <Link 
                              to={`/edit_student/${student.id}`}
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

export default ReportsAnalytics;
