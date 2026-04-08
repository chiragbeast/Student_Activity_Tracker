import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HiOutlineArrowLeft } from 'react-icons/hi'
import api from '../api'
import './LoginPage.css' // Reuse login page styling

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    try {
      setLoading(true)
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() })
      setMessage(data.message || 'Password reset link sent to your email.')
      setEmail('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <main className="login-content">
        <Link
          to="/login"
          className="back-link"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            alignSelf: 'flex-start',
            marginBottom: '1rem',
            color: '#6b7280',
            textDecoration: 'none',
            fontSize: '0.9rem',
          }}
        >
          <HiOutlineArrowLeft /> Back to Login
        </Link>

        <h1 className="login-title">Forgot Password</h1>
        <p className="login-subtitle">
          Enter your email address and we'll send you a link to reset your password.
        </p>

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
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
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
              <svg
                className="input-icon"
                style={{ width: '1.15rem', height: '1.15rem', color: '#9ca3af', flexShrink: 0 }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
              <input
                id="email"
                type="email"
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
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="login-btn"
            style={{
              width: '100%',
              padding: '1rem',
              border: 0,
              borderRadius: '0.75rem',
              color: '#fff',
              fontSize: '1.05rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.8 : 1,
              background: 'linear-gradient(135deg, #f5a623 0%, #f7b731 50%, #f5a623 100%)',
              boxShadow: '0 4px 14px rgba(245, 166, 35, 0.35)',
              transition: 'all 0.2s',
              marginTop: '0.5rem',
            }}
          >
            {loading ? 'Sending Link...' : 'Send Reset Link'}
          </button>
        </form>
      </main>
    </div>
  )
}
