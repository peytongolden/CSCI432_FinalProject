import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tokenManager } from '../utils/tokenManager'
import './Login.css'

function Registration() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const validateForm = () => {
    setError('')
    
    if (!formData.name) {
      setError('Name is required.')
      return false
    }
    
    if (!formData.email) {
      setError('Email is required.')
      return false
    }
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(formData.email)) {
      setError('Please enter a valid email address.')
      return false
    }
    
    if (!formData.password) {
      setError('Password is required.')
      return false
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return false
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    try {
      const response = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      })
      
      const data = await response.json()
      
      if (response.status === 201 && data.success) {
        // Store token and user info
        tokenManager.setToken(data.token)
        tokenManager.setUser(data.user)
        navigate('/lobby')
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (err) {
      setError('Network error — please try again')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-header">
        <h1>Robert's Rules of Order App</h1>
      </div>

      <div className="main-container">
        <section className="participants-section">
          <h2 className="section-title">User Registration</h2>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            {error && (
              <div role="alert" aria-live="polite" className="error">
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <button type="submit" className="primary" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
              </button>
              <button type="button" onClick={() => navigate('/login')}>
                Back to Login
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}

export default Registration

