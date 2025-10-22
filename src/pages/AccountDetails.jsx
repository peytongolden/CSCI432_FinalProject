import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'
import './AccountDetails.css'
import Navigation from '../components/Navigation'

function AccountDetails() {
  const navigate = useNavigate()
  const [userInfo] = useState({
    name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    role: 'Committee Member',
    joinDate: 'January 2024'
  })

  return (
    <>
      <Navigation />

      <div className="account-page">
        <div className="main-container">
        <section className="participants-section">
          <h2 className="section-title">Account Details</h2>

          <div className="account-info">
            <div className="info-row">
              <label>Full Name:</label>
              <p>{userInfo.name}</p>
            </div>

            <div className="info-row">
              <label>Email:</label>
              <p>{userInfo.email}</p>
            </div>

            <div className="info-row">
              <label>Role:</label>
              <p>{userInfo.role}</p>
            </div>

            <div className="info-row">
              <label>Member Since:</label>
              <p>{userInfo.joinDate}</p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '30px', flexWrap: 'wrap' }}>
              <button className="primary" onClick={() => navigate('/lobby')}>
                Go to Lobby
              </button>
              <button onClick={() => navigate('/login')}>
                Logout
              </button>
            </div>
          </div>
        </section>
        </div>
      </div>
    </>
  )
}

export default AccountDetails

