import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const validateForm = () => {
    setError('')
    
    if (!email) {
      setError('Email is required.')
      return false
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) {
      setError('Please enter a valid email address.')
      return false
    }
    
    if (!password) {
      setError('Password is required.')
      return false
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (response.status === 200 && data.success) {
        navigate('/meeting')
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError('Network error — please try again')
      console.error(err)
    }
  }

  const handleCreateAccount = () => {
    navigate('/register')
  }

  const handleGuestSignIn = () => {
    sessionStorage.setItem('guest', 'true')
    navigate('/meeting')
  }

  return (
    <main className="login-page">
      <div className="login-header">
        <h1>Robert's Rules of Order App</h1>
      </div>

      <div className="main-container">
        <section className="participants-section">
          <h2 className="section-title">Sign in</h2>

          <form id="loginForm" onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div id="formError" role="alert" aria-live="polite" className="error">
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <button type="submit" className="primary">
                Log in
              </button>
              <button type="button" onClick={handleCreateAccount}>
                Create account
              </button>
              <button type="button" onClick={handleGuestSignIn}>
                Sign in as guest
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}

export default Login

