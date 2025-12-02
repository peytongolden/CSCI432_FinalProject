import { Link, useLocation } from 'react-router-dom'
import './Navigation.css'

function Navigation() {
  const location = useLocation()
  
  const isActive = (path) => location.pathname === path

  return (
    <nav className="top-navbar">
      <div className="nav-brand">
        <h1>Robert's Rules</h1>
      </div>
      <div className="nav-links">
        <Link 
          to="/lobby" 
          className={`nav-link ${isActive('/lobby') ? 'active' : ''}`}
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

