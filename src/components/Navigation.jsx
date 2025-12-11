import { Link, useLocation, useNavigate } from 'react-router-dom'
import './Navigation.css'

function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const isActive = (path) => location.pathname === path

  const handleHomeClick = (e) => {
    // If the user is currently in a meeting, prompt for confirmation
    const inMeeting = sessionStorage.getItem('inMeeting') === 'true' || location.pathname.startsWith('/meeting')
    if (inMeeting) {
      e.preventDefault()
      const committeeName = sessionStorage.getItem('committeeName') || ''
      const leave = window.confirm(committeeName ? `You are currently in the meeting "${committeeName}". Leaving will remove you from the meeting. Do you want to leave and return home?` : 'You are currently in a meeting. Leaving will remove you from the meeting. Do you want to leave and return home?')
      if (leave) {
        try { sessionStorage.removeItem('inMeeting'); sessionStorage.removeItem('meetingId'); sessionStorage.removeItem('participantId'); sessionStorage.removeItem('committeeName') } catch (err) {}
        navigate('/lobby')
      }
    }
  }

  return (
    <nav className="top-navbar">
      <div className="nav-brand">
        <h1>Robert's Rules</h1>
      </div>
      <div className="nav-links">
        <Link 
          to="/lobby" 
          className={`nav-link ${isActive('/lobby') ? 'active' : ''}`}
          onClick={handleHomeClick}
        >
          Home
        </Link>
        <Link 
          to="/meeting" 
          className={`nav-link ${isActive('/meeting') ? 'active' : ''}`}
        >
          Meeting
        </Link>
        <Link 
          to="/account" 
          className={`nav-link ${isActive('/account') ? 'active' : ''}`}
        >
          Account
        </Link>
        <Link 
          to="/help" 
          className={`nav-link ${isActive('/help') ? 'active' : ''}`}
        >
          Help
        </Link>
        <Link 
          to="/login" 
          className="nav-link logout"
        >
          Logout
        </Link>
      </div>
    </nav>
  )
}

export default Navigation

