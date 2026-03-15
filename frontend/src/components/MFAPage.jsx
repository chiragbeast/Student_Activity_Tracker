import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function MFAPage() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timeLeft, setTimeLeft] = useState(114) // 1:54 in seconds
  const inputRefs = useRef([])

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

  const handleSubmit = (e) => {
    e.preventDefault()
    const enteredOTP = otp.join('')

    // Hardcoded MFA pin
    if (enteredOTP === '123456') {
      // Redirect to admin dashboard after successful MFA
      navigate('/admin_dashboard')
    } else {
      alert('Invalid verification code. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    }
  }

  const handleResend = () => {
    setTimeLeft(114)
    setOtp(['', '', '', '', '', ''])
    inputRefs.current[0]?.focus()
  }

  return (
    <div className="font-body min-h-screen overflow-x-hidden" style={{ backgroundColor: '#fdf8f0' }}>

      <div className="relative flex min-h-screen w-full flex-col items-center justify-center px-4 py-12">
        <div className="layout-content-container flex flex-col w-full max-w-[520px]">
          <div className="rounded-[2rem] p-10 md:p-12 border shadow-lg" style={{ backgroundColor: '#fff', borderColor: '#e5e1d8' }}>
            <div className="text-center mb-10">
              <h1 className="font-display text-3xl font-bold leading-tight mb-3 tracking-tight" style={{ color: '#1a1a2e' }}>
                Secure Verification
              </h1>
              <p className="text-base max-w-[320px] mx-auto" style={{ color: '#6b7280' }}>
                Enter the 6-digit code sent to your faculty/admin email
              </p>
            </div>

            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="flex justify-between gap-2 md:gap-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    className="otp-input w-12 h-16 md:w-14 md:h-20 border-2 rounded-[16px] text-center text-2xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
                    style={{ backgroundColor: '#fff', borderColor: '#e5e1d8', color: '#1a1a2e' }}
                    maxLength="1"
                    placeholder="·"
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
                className="w-full text-white font-bold py-5 rounded-2xl text-lg tracking-wide transition-all transform active:scale-[0.98] flex items-center justify-center gap-3"
                type="submit"
                style={{ background: 'linear-gradient(135deg, #f5a623 0%, #f7b731 50%, #f5a623 100%)', boxShadow: '0 4px 14px rgba(245, 166, 35, 0.35)' }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(245, 166, 35, 0.45)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 14px rgba(245, 166, 35, 0.35)';
                }}
              >
                <span>Verify &amp; Access</span>
                <span className="material-symbols-outlined font-bold">lock_open</span>
              </button>
            </form>

            <div className="mt-10 text-center space-y-4">
              <p className="text-sm" style={{ color: '#6b7280' }}>
                Didn't receive the code?
                <button
                  className="ml-1 font-bold hover:underline"
                  style={{ color: timeLeft > 0 ? '#9ca3af' : '#f5a623', cursor: timeLeft > 0 ? 'not-allowed' : 'pointer' }}
                  onClick={handleResend}
                  disabled={timeLeft > 0}
                >
                  Resend Code
                </button>
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border" style={{ backgroundColor: '#fef3e2', borderColor: '#f5a623' }}>
                <span className="material-symbols-outlined text-primary text-sm">timer</span>
                <span className="text-primary/90 text-xs font-mono font-bold uppercase tracking-widest">
                  {timeLeft > 0 ? `Resend available in ${formatTime(timeLeft)}` : 'Code ready to resend'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center items-center gap-6">
            <a className="flex items-center gap-2 text-sm font-medium transition-colors" style={{ color: '#6b7280' }} href="#" onMouseOver={(e) => e.currentTarget.style.color = '#f5a623'} onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}>
              <span className="material-symbols-outlined text-lg">contact_support</span>
              IT Support
            </a>
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#d1d5db' }}></span>
            <Link to="/" className="flex items-center gap-2 text-sm font-medium transition-colors" style={{ color: '#6b7280' }} onMouseOver={(e) => e.currentTarget.style.color = '#f5a623'} onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}>
              <span className="material-symbols-outlined text-lg">logout</span>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
