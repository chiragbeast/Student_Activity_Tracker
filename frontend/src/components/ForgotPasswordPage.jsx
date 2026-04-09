import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import './LoginPage.css'

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
        <section className="signin-card">
          <h1 className="login-title">Forgot password?</h1>
          <p className="login-subtitle">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          {error && <div className="error-message">{error}</div>}
          {message && (
            <div
              className="success-message"
              style={{
                color: '#15803d',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
                textAlign: 'center',
                fontSize: '0.875rem',
              }}
            >
              {message}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? 'Sending Link...' : 'Send Reset Link'}
            </button>

            <Link to="/login" className="forgot-password-link">
              Back to Login
            </Link>
          </form>
        </section>
      </main>
    </div>
  )
}
