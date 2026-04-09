import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import './LoginPage.css'

export default function MFAPage() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timeLeft, setTimeLeft] = useState(60)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const inputRefs = useRef([])
  const pendingMfaEmail = localStorage.getItem('pendingMfaEmail')

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleChange = (index, value) => {
    if (value.length > 1) {
      value = value[0]
    }

    if (/^[0-9]$/.test(value) || value === '') {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      // Auto-focus next input
      if (value !== '' && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (otp[index] === '' && index > 0) {
        inputRefs.current[index - 1]?.focus()
      } else {
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    if (/^[0-9]+$/.test(pastedData)) {
      const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6)
      setOtp(newOtp)
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')

    if (!pendingMfaEmail) {
      setError('MFA session not found. Please login again.')
      return
    }

    const enteredOTP = otp.join('')

    if (enteredOTP.length !== 6) {
      setError('Please enter the 6-digit verification code.')
      return
    }

    try {
      setSubmitting(true)
      const { data } = await api.post('/auth/verify-2fa', {
        email: pendingMfaEmail,
        code: enteredOTP,
      })

      localStorage.removeItem('pendingMfaEmail')
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

      if (data.role === 'Admin') {
        navigate('/admin_dashboard')
      } else if (data.role === 'Faculty') {
        navigate('/faculty_dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired verification code.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!pendingMfaEmail || timeLeft > 0) {
      return
    }

    try {
      setResending(true)
      setError('')
      setInfo('')
      const { data } = await api.post('/auth/resend-2fa', { email: pendingMfaEmail })
      const cooldown = Number(data?.cooldownSeconds || 60)
      setTimeLeft(cooldown)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
      setInfo('A new verification code has been sent to your email.')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification code.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div
      className="font-body min-h-screen overflow-x-hidden"
      style={{ backgroundColor: '#fdf8f0', fontFamily: 'Poppins, sans-serif' }}
    >
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center px-4 py-12">
        <div className="layout-content-container flex flex-col w-full max-w-[520px]">
          <div
            className="rounded-[2rem] p-10 md:p-12 border shadow-lg"
            style={{ backgroundColor: '#fdf7e9', borderColor: '#e5e1d8' }}
          >
            <div className="text-center mb-10">
              <h1
                className="font-display text-3xl font-bold leading-tight mb-3 tracking-tight"
                style={{ color: '#1a1a2e' }}
              >
                Secure Verification
              </h1>
              <p className="text-sm max-w-[320px] mx-auto" style={{ color: '#6b7280' }}>
                Enter the 6 digit code sent to your email
              </p>
            </div>

            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="flex justify-between gap-2 md:gap-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    className="otp-input w-12 h-16 md:w-14 md:h-20 border-2 rounded-[16px] text-center text-2xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
                    style={{ backgroundColor: '#fdf7e9', borderColor: '#e5e1d8', color: '#1a1a2e' }}
                    maxLength="1"
                    type="text"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                  />
                ))}
              </div>

              <button
                className="login-btn w-full"
                type="submit"
                disabled={submitting}
                style={{ marginTop: '20px', opacity: submitting ? 0.8 : 1 }}
              >
                {submitting ? 'Verifying...' : 'Verify'}
              </button>

              {error && (
                <p className="text-sm text-center mt-3" style={{ color: '#dc2626' }}>
                  {error}
                </p>
              )}

              {info && (
                <p className="text-sm text-center mt-3" style={{ color: '#15803d' }}>
                  {info}
                </p>
              )}
            </form>

            <div className="mt-8 text-center space-y-4">
              <p className="text-sm" style={{ color: '#6b7280' }}>
                Didn't receive the code?
                <button
                  className="ml-1 font-bold hover:underline"
                  style={{
                    color: timeLeft > 0 ? '#9ca3af' : '#f5a623',
                    cursor: timeLeft > 0 ? 'not-allowed' : 'pointer',
                  }}
                  onClick={handleResend}
                  disabled={timeLeft > 0 || resending}
                >
                  {resending ? 'Resending...' : 'Resend Code'}
                </button>
              </p>
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border"
                style={{ backgroundColor: '#fef3e2', borderColor: '#f5a623' }}
              >
                <span className="material-symbols-outlined text-primary text-sm">timer</span>
                <span className="text-primary/90 text-xs font-mono font-bold uppercase tracking-widest">
                  {timeLeft > 0
                    ? `Resend available in ${formatTime(timeLeft)}`
                    : 'Code ready to resend'}
                </span>
              </div>

              <Link to="/login" className="forgot-password-link">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
