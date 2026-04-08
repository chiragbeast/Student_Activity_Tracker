import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FaGoogle } from 'react-icons/fa'
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

  return (
    <div className="login-page">
      <main className="login-content">
        <section className="signin-card">
          <h1 className="login-title">Sign in.</h1>
          <p className="login-subtitle">Hey, Enter your details to sign in to your account</p>

          {error && <div className="error-message">{error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                id="email"
                data-testid="login-email"
                type="text"
                className="form-input"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <div className="password-field">
                <input
                  id="password"
                  data-testid="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="password-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="toggle-password-text"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" data-testid="login-submit">
              Sign in
            </button>

            <p className="or-text">or</p>

            <button
              type="button"
              className="google-placeholder-btn"
              data-testid="google-login-placeholder"
              onClick={() => {
                if (!googleClientId) {
                  setError('Google sign in is not configured on this device yet.')
                }
              }}
            >
              <FaGoogle className="google-icon" aria-hidden="true" />
              Continue with Google
            </button>

            <Link to="/forgot-password" className="forgot-password-link">
              Forgot Password?
            </Link>
          </form>
        </section>
      </main>
    </div>
  )
}
