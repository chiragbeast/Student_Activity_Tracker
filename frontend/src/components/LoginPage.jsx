import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiOutlineMail } from 'react-icons/hi'
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import { GoogleLogin } from '@react-oauth/google'
import api from '../api'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      })

      if (response.data?.requires2FA) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.setItem('pendingMfaEmail', response.data.email)
        navigate('/mfa')
        return
      }

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

  const handleGoogleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential
    if (!idToken) {
      setError('Google login failed. Please try again.')
      return
    }

    try {
      setError('')
      const response = await api.post('/auth/google-login', { idToken })

      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data))

      const role = response.data.role
      if (role === 'Admin') {
        navigate('/admin_dashboard')
      } else if (role === 'Faculty') {
        navigate('/faculty_dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed')
    }
  }

  return (
    <div className="login-page">
      {/* Main content */}
      <main className="login-content">
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Enter your email and password to continue.</p>

        {error && (
          <div
            className="error-message"
            style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}
          >
            {error}
          </div>
        )}

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
                data-testid="login-email"
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
                data-testid="login-password"
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

          <button type="submit" className="login-btn" data-testid="login-submit">
            Login
          </button>

          {googleClientId ? (
            <div className="oauth-section" data-testid="google-login-section">
              <div className="oauth-divider">
                <span>or continue with</span>
              </div>
              <div className="google-login-btn-wrap">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google login failed')}
                  width="400"
                  text="continue_with"
                  shape="pill"
                />
              </div>
            </div>
          ) : null}
        </form>
      </main>
    </div>
  )
}
