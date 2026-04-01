import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!formData.email.trim() || !formData.password.trim()) {
      setFormError('Email and password are required.')
      return
    }

    try {
      setLoading(true)
      const { data } = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      })

      if (data?.requires2FA) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.setItem('pendingMfaEmail', data.email)
        navigate('/mfa')
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem(
        'user',
        JSON.stringify({
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
        })
      )

      navigate('/admin_dashboard')
    } catch (err) {
      setFormError(err.response?.data?.message || 'Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center overflow-hidden"
      style={{ backgroundColor: '#fdf8f0', fontFamily: 'Poppins, sans-serif' }}
    >
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-6 pt-[124px] pb-8 w-full relative z-10">
        <h1
          data-testid="admin-login-title"
          className="text-[2rem] font-extrabold mb-2"
          style={{ color: '#1a1a2e', letterSpacing: '-0.5px' }}
        >
          Admin Login
        </h1>
        <p className="text-[0.95rem] mb-7" style={{ color: '#6b7280' }}>
          Enter your admin credentials to access the dashboard.
        </p>

        {/* Form */}
        <form className="w-full max-w-[400px]" onSubmit={handleSubmit}>
          <div className="mb-5">
            <label
              htmlFor="email"
              className="block text-[0.85rem] font-semibold mb-2"
              style={{ color: '#1a1a2e' }}
            >
              ID/Email
            </label>
            <div
              className="flex items-center bg-white border-[1.5px] rounded-xl px-4 transition-all focus-within:border-[#f5a623] focus-within:shadow-[0_0_0_3px_rgba(245,166,35,0.12)]"
              style={{ borderColor: '#e5e1d8' }}
            >
              <svg
                className="w-[1.15rem] h-[1.15rem] flex-shrink-0"
                style={{ color: '#9ca3af' }}
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
                data-testid="admin-email-input"
                id="email"
                type="text"
                placeholder="Enter your ID or Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="flex-1 border-0 outline-none bg-transparent py-[14px] px-3 text-[0.95rem]"
                style={{ color: '#1a1a2e', fontFamily: 'inherit' }}
              />
            </div>
          </div>

          <div className="mb-5">
            <label
              htmlFor="password"
              className="block text-[0.85rem] font-semibold mb-2"
              style={{ color: '#1a1a2e' }}
            >
              Password
            </label>
            <div
              className="flex items-center bg-white border-[1.5px] rounded-xl px-4 transition-all focus-within:border-[#f5a623] focus-within:shadow-[0_0_0_3px_rgba(245,166,35,0.12)]"
              style={{ borderColor: '#e5e1d8' }}
            >
              <svg
                className="w-[1.15rem] h-[1.15rem] flex-shrink-0"
                style={{ color: '#9ca3af' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
              <input
                data-testid="admin-password-input"
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="flex-1 border-0 outline-none bg-transparent py-[14px] px-3 text-[0.95rem]"
                style={{ color: '#1a1a2e', fontFamily: 'inherit' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="bg-transparent border-0 cursor-pointer flex items-center p-1 rounded transition-colors"
                style={{ color: '#9ca3af', fontSize: '1.15rem' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg
                    className="w-[1.15rem] h-[1.15rem]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-[1.15rem] h-[1.15rem]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                    <path
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                  </svg>
                )}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <a
                href="#"
                className="text-[0.85rem] font-medium no-underline transition-colors"
                style={{ color: '#f5a623' }}
                onMouseOver={(e) => (e.target.style.color = '#d4891a')}
                onMouseOut={(e) => (e.target.style.color = '#f5a623')}
              >
                Forgot Password?
              </a>
            </div>
          </div>

          {formError && (
            <div
              data-testid="admin-login-error"
              className="mb-5 rounded-lg border px-4 py-3 text-sm"
              style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}
            >
              {formError}
            </div>
          )}

          <button
            data-testid="admin-login-submit"
            type="submit"
            disabled={loading}
            className="w-full py-4 border-0 rounded-xl text-white text-[1.05rem] font-bold cursor-pointer transition-all mt-2"
            style={{
              background: 'linear-gradient(135deg, #f5a623 0%, #f7b731 50%, #f5a623 100%)',
              letterSpacing: '0.5px',
              boxShadow: '0 4px 14px rgba(245, 166, 35, 0.35)',
              opacity: loading ? 0.8 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            onMouseOver={(e) => {
              if (loading) return
              e.target.style.transform = 'translateY(-1px)'
              e.target.style.boxShadow = '0 6px 20px rgba(245, 166, 35, 0.45)'
            }}
            onMouseOut={(e) => {
              if (loading) return
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 14px rgba(245, 166, 35, 0.35)'
            }}
            onMouseDown={(e) => {
              if (loading) return
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 2px 8px rgba(245, 166, 35, 0.3)'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </main>
    </div>
  )
}
