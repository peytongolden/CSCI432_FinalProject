import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { apiFetch } from '../lib/api'
import './Navigation.css'
import ConfirmLeaveModal from './ConfirmLeaveModal'
import { useEffect } from 'react'

function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDestination, setPendingDestination] = useState(null)
  const [pendingCommitteeName, setPendingCommitteeName] = useState('')
  
  const isActive = (path) => location.pathname === path

  const handleNavClick = (e, destination) => {
    // If the user is currently in a meeting, open the modal when navigating away
    const inMeeting = sessionStorage.getItem('inMeeting') === 'true' || location.pathname.startsWith('/meeting')
    if (inMeeting && destination !== '/meeting') {
      e.preventDefault()
      const committeeName = sessionStorage.getItem('committeeName') || ''
      setPendingCommitteeName(committeeName)
      setPendingDestination(destination)

      if (destination === '/login') {
        try { localStorage.removeItem('token'); localStorage.removeItem('userInfo') } catch (err) {}
      }
      
      setConfirmOpen(true)
    }
  }

  const confirmLeave = () => {
    const destination = pendingDestination
    setConfirmOpen(false)
    setPendingDestination(null)
    setPendingCommitteeName('')

    // Attempt to notify server that this participant is leaving (best-effort)
    ;(async () => {
      try {
        const meetingId = sessionStorage.getItem('meetingId')
        const participantId = sessionStorage.getItem('participantId')
        const token = localStorage.getItem('token')
        if (meetingId && participantId) {
          await apiFetch(`/api/meetings/${encodeURIComponent(meetingId)}/leave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ participantId })
          })
        } else if (meetingId && token) {
          // fallback to uid if we don't have participantId
          try {
            const parsed = JSON.parse(atob(token.split('.')[1]))
            const uid = parsed?.id || parsed?.userId || null
            if (uid) {
              await apiFetch(`/api/meetings/${encodeURIComponent(meetingId)}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ uid })
              })
            }
          } catch (err) {
            // ignore parse errors
          }
        }
      } catch (err) {
        // ignore leave errors — proceed to clear local state anyway
      } finally {
        try { sessionStorage.removeItem('inMeeting'); sessionStorage.removeItem('meetingId'); sessionStorage.removeItem('participantId'); sessionStorage.removeItem('committeeName') } catch (err) {}
        if (destination === '/login') {
          try { localStorage.removeItem('token'); localStorage.removeItem('userInfo') } catch (err) {}
        }
        if (destination) navigate(destination)
      }
    })()
  }

  const cancelLeave = () => {
    setConfirmOpen(false)
    setPendingDestination(null)
    setPendingCommitteeName('')
  }

  useEffect(() => {
    if (!confirmOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') cancelLeave()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [confirmOpen])

  return (
    <>
      <nav className="top-navbar">
        <div className="nav-brand">
          <h1>Robert's Rules</h1>
        </div>
        <div className="nav-links">
          <Link 
            to="/lobby" 
            className={`nav-link ${isActive('/lobby') ? 'active' : ''}`}
            onClick={(e) => handleNavClick(e, '/lobby')}
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
            onClick={(e) => handleNavClick(e, '/account')}
          >
            Account
          </Link>
          <Link 
            to="/help" 
            className={`nav-link ${isActive('/help') ? 'active' : ''}`}
            onClick={(e) => handleNavClick(e, '/help')}
          >
            Help
          </Link>
          <Link 
            to="/login" 
            className="nav-link logout"
            onClick={(e) => handleNavClick(e, '/login')}
          >
            Logout
          </Link>
        </div>
      </nav>

      <ConfirmLeaveModal
        isOpen={confirmOpen}
        onConfirm={confirmLeave}
        onCancel={cancelLeave}
        destination={pendingDestination}
        committeeName={pendingCommitteeName}
      />
    </>
  )
}

export default Navigation

