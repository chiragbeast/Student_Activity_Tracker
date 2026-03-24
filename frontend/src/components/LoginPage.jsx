import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiOutlineMail } from 'react-icons/hi'
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import api from '../api'
import './LoginPage.css'

const ROLES = ['Student', 'Faculty', 'Admin']

export default function LoginPage() {
  const navigate = useNavigate()
  const [activeRole, setActiveRole] = useState('Student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        role: activeRole,
      })

      // Store token and user data
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data))

      // Navigate based on role returned from API
      const role = response.data.role
      if (role === 'Admin') {
        navigate('/admin_dashboard')
      } else if (role === 'Faculty') {
        navigate('/faculty_dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login')
    }
  }

  return (
    <div className="login-page">
      {/* Main content */}
      <main className="login-content">
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Select your role to access your dashboard.</p>

        {error && (
          <div
            className="error-message"
            style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}
          >
            {error}
          </div>
        )}

        {/* Role tabs */}
        <div className="role-tabs">
          {ROLES.map((role) => (
            <button
              key={role}
              className={`role-tab ${activeRole === role ? 'active' : ''}`}
              onClick={() => setActiveRole(role)}
              type="button"
            >
              {role}
            </button>
          ))}
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <div className="input-wrapper">
              <HiOutlineMail className="input-icon" />
              <input
                id="email"
                type="text"
                className="form-input"
                placeholder="Enter your ID or Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="input-wrapper">
              <FiLock className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <div className="forgot-row">
              <a href="#" className="forgot-link">
                Forgot Password?
              </a>
            </div>
          </div>

          <button type="submit" className="login-btn">
            Login
          </button>
        </form>
      </main>
    </div>
  )
}
