import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import api from '../api'
import './LoginPage.css' // Reuse login page styling

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setLoading(true)
      const { data } = await api.post(`/auth/reset-password/${token}`, {
        password,
        confirmPassword,
      })
      setMessage(data.message || 'Password reset successful!')

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to reset password. The link might be expired.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <main className="login-content">
        <h1 className="login-title">Reset Password</h1>
        <p className="login-subtitle">Please enter your new password below.</p>

        {error && (
          <div
            className="error-message"
            style={{
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            className="success-message"
            style={{
              color: '#15803d',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
              fontSize: '0.875rem',
            }}
          >
            {message}
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>Redirecting to login...</div>
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              New Password
            </label>
            <div
              className="input-wrapper"
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#fff',
                border: '1.5px solid #e5e1d8',
                borderRadius: '0.75rem',
                padding: '0 1rem',
                transition: 'all 0.2s',
              }}
            >
              <FiLock
                className="input-icon"
                style={{ width: '1.15rem', height: '1.15rem', color: '#9ca3af', flexShrink: 0 }}
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{
                  flex: 1,
                  border: 0,
                  outline: 'none',
                  background: 'transparent',
                  padding: '14px 12px',
                  fontSize: '0.95rem',
                  color: '#1a1a2e',
                }}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm New Password
            </label>
            <div
              className="input-wrapper"
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#fff',
                border: '1.5px solid #e5e1d8',
                borderRadius: '0.75rem',
                padding: '0 1rem',
                transition: 'all 0.2s',
                marginTop: '4px',
              }}
            >
              <FiLock
                className="input-icon"
                style={{ width: '1.15rem', height: '1.15rem', color: '#9ca3af', flexShrink: 0 }}
              />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{
                  flex: 1,
                  border: 0,
                  outline: 'none',
                  background: 'transparent',
                  padding: '14px 12px',
                  fontSize: '0.95rem',
                  color: '#1a1a2e',
                }}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !!message}
            className="login-btn"
            style={{
              width: '100%',
              padding: '1rem',
              border: 0,
              borderRadius: '0.75rem',
              color: '#fff',
              fontSize: '1.05rem',
              fontWeight: 'bold',
              cursor: loading || !!message ? 'not-allowed' : 'pointer',
              opacity: loading || !!message ? 0.8 : 1,
              background: 'linear-gradient(135deg, #f5a623 0%, #f7b731 50%, #f5a623 100%)',
              boxShadow: '0 4px 14px rgba(245, 166, 35, 0.35)',
              transition: 'all 0.2s',
              marginTop: '0.5rem',
            }}
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link
            to="/login"
            style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.9rem' }}
          >
            Back to Login
          </Link>
        </div>
      </main>
    </div>
  )
}
