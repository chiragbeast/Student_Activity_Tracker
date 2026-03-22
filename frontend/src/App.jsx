import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Student components
import LoginPage from './components/LoginPage'
import DashboardLayout from './components/DashboardLayout'
import StudentDashboard from './components/StudentDashboard'
import MySubmissions from './components/MySubmissions'
import ActivitySubmissionForm from './components/ActivitySubmissionForm'
import ProfilePage from './components/ProfilePage'
import RegisterPage from './components/RegisterPage'

// Admin components
import AdminLoginPage from './components/AdminLoginPage'
import MFAPage from './components/MFAPage'
import AdminDashboard from './components/AdminDashboard'
import AdminUserManagement from './components/AdminUserManagement'
import FacultyAdvisorManagement from './components/FacultyAdvisorManagement'
import ReportsAnalytics from './components/ReportsAnalytics'
import AddNewStudentUser from './components/AddNewStudentUser'
import AddFacultyAdvisor from './components/AddFacultyAdvisor'
import UserProfileSettings from './components/UserProfileSettings'
import EditStudent from './components/EditStudent'
import EditFaculty from './components/EditFaculty'
import AssignStudents from './components/AssignStudents'
import NotificationCenter from './components/NotificationCenter'

// Faculty components
import FacultyDashboard from './components/FacultyDashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing & Auth */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/mfa" element={<MFAPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Student routes (with sidebar layout) */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/submissions" element={<MySubmissions />} />
          <Route path="/new-submission/:id?" element={<ActivitySubmissionForm />} />
          <Route path="/settings" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationCenter />} />
        </Route>

        {/* Admin routes */}
        <Route path="/admin_dashboard" element={<AdminDashboard />} />
        <Route path="/admin_student_management" element={<AdminUserManagement />} />
        <Route path="/faculty_advisor_management" element={<FacultyAdvisorManagement />} />
        <Route path="/reports_analytics" element={<ReportsAnalytics />} />
        <Route path="/add_new_student" element={<AddNewStudentUser />} />
        <Route path="/add_faculty_advisor" element={<AddFacultyAdvisor />} />
        <Route path="/profile_settings" element={<UserProfileSettings />} />
        <Route path="/edit_student/:id" element={<EditStudent />} />
        <Route path="/edit_faculty/:id" element={<EditFaculty />} />
        <Route path="/assign_students/:id" element={<AssignStudents />} />
        <Route path="/admin_notifications" element={<NotificationCenter />} />

        {/* Faculty routes */}
        <Route path="/faculty_dashboard" element={<FacultyDashboard />} />
        <Route path="/faculty_notifications" element={<NotificationCenter />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
