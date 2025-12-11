import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmLeaveModal from '../components/ConfirmLeaveModal'
import { apiFetch } from '../lib/api'
import './Meeting.css'
import MembersList from '../components/MembersList'
import CurrentMotion from '../components/CurrentMotion'
import VotingButtons from '../components/VotingButtons'
import ControlsModal from '../components/ControlsModal'
import VoteConfirmation from '../components/VoteConfirmation'
import NewMotionModal from '../components/NewMotionModal'
import MotionHistory from '../components/MotionHistory'
import Navigation from '../components/Navigation'

function Meeting() {
  // No sample data by default — a meeting will only be shown when
  // valid query params are provided and the backend returns meeting info.
  const [committee, setCommittee] = useState(null)
  const [members, setMembers] = useState([])
  const [motions, setMotions] = useState([])
  const [currentMotionId, setCurrentMotionId] = useState(null)
  const currentMotion = motions.find(m => m.id === currentMotionId) || null

  const [currentUser, setCurrentUser] = useState(null)

  // Track whether a real meeting has been loaded
  const [meetingLoaded, setMeetingLoaded] = useState(false)

  const [meetingCode, setMeetingCode] = useState(null)
    const [meetingIdState, setMeetingIdState] = useState(null)
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)
  // Local user info from localStorage (if authenticated)
  let userInfo = null
  try { userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null') } catch (e) { userInfo = null }

  // if meetingId and participantId are in the query we will try to retrieve a real meeting
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const meetingId = params.get('meetingId')
    const participantId = params.get('participantId')

    if (!meetingId) return

    ;(async () => {
      try {
        const res = await apiFetch(`/api/meetings/${encodeURIComponent(meetingId)}`)
        if (!res.ok) return
        const body = await res.json().catch(() => null)
        if (!body || !body.meeting) return

      const meet = body.meeting
          if (meetingId) setMeetingIdState(meetingId)
        // update committee name and data
        if (meet.name) {
          setCommittee({ id: meet._id || meetingId, name: meet.name, sessionActive: !!meet.active })
        }
        if (meet.code) setMeetingCode(meet.code)

        // set members from participants
        if (Array.isArray(meet.participants) && meet.participants.length) {
          const mapped = meet.participants.map((p, idx) => {
            const pid = p._id || p._id?.$oid || p.uid || (idx + 1)
            const pidStr = String(pid)
            const role = p.role || (String(p._id) === String(meet.presidingParticipantId) || String(p.uid) === String(meet.createdBy) ? 'chair' : 'member')
            return ({ id: pidStr, name: p.name || 'Guest', role, vote: null, uid: p.uid || null, _id: p._id })
          })
          setMembers(mapped)
        }

        // set motions if present
        if (Array.isArray(meet.motions) && meet.motions.length) {
          setMotions(meet.motions.map((m, idx) => ({ id: m.id || idx + 1, title: m.title || 'Untitled', description: m.description || '', status: m.status || 'voting', createdBy: m.createdBy || null, votes: m.votes || { yes: 0, no: 0, abstain: 0 } })))
          setCurrentMotionId(prev => prev || (meet.motions[0]?.id || 1))
        }

        // if we have a participantId, try to make them the current user
        if (participantId && Array.isArray(meet.participants)) {
          const found = meet.participants.find(p => String(p._id) === String(participantId) || String(p._id?.$oid) === String(participantId))
          if (found) setCurrentUser({ id: String(found._id || participantId), name: found.name || 'Guest', role: found.role || 'member', hasVoted: false, vote: null })
          else setCurrentUser({ id: String(participantId), name: 'Guest', role: 'member', hasVoted: false, vote: null })
        } else if (userInfo && String(userInfo.id) === String(meet.createdBy)) {
          // if we're the creator (authenticated), make us the current user with chair role
          setCurrentUser(prev => ({ ...(prev || {}), id: String(userInfo.id), name: userInfo.name || 'Guest', role: 'chair' }))
        }

        // indicate we've loaded an actual meeting
        setMeetingLoaded(true)
        try {
          sessionStorage.setItem('inMeeting', 'true')
          if (meetingId) sessionStorage.setItem('meetingId', meetingId)
          if (participantId) sessionStorage.setItem('participantId', participantId)
          if (meet.name) sessionStorage.setItem('committeeName', meet.name)
        } catch (e) {}
      } catch (err) {
        console.warn('Could not load meeting details', err)
      }
    })()
  }, [])

  const [showControlsModal, setShowControlsModal] = useState(false)
  const [showNewMotionModal, setShowNewMotionModal] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [voteConfirmation, setVoteConfirmation] = useState(null)
  const [nextMotionId, setNextMotionId] = useState(2)

  // Reset member votes when motion changes
  useEffect(() => {
    setMembers(prev =>
      prev.map(member => ({
        ...member,
        vote: null
      }))
    )
    setCurrentUser(prev => ({
      ...prev,
      hasVoted: false,
      vote: null
    }))
  }, [currentMotionId])

  // Clean up 'inMeeting' and IDs when component unmounts
  useEffect(() => {
    return () => {
      try { sessionStorage.removeItem('inMeeting'); sessionStorage.removeItem('meetingId'); sessionStorage.removeItem('participantId') } catch (e) {}
    }
  }, [])

  // Poll the server for meeting updates (participants/motions) while loaded
  useEffect(() => {
    if (!meetingLoaded || !meetingIdState) return
    let mounted = true
    const timer = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/meetings/${encodeURIComponent(meetingIdState)}`)
        if (!res.ok) return
        const body = await res.json().catch(() => null)
        if (!body || !body.meeting) return
        const meet = body.meeting
        if (!mounted) return

        // update committee name/code and participants/motions
        if (meet.name) setCommittee(prev => ({ ...(prev || {}), name: meet.name, sessionActive: !!meet.active }))
        if (meet.code) setMeetingCode(meet.code)
        if (Array.isArray(meet.motions) && meet.motions.length) setMotions(meet.motions.map((m, idx) => ({ id: m.id || idx + 1, title: m.title || 'Untitled', description: m.description || '', status: m.status || 'voting', createdBy: m.createdBy || null, votes: m.votes || { yes: 0, no: 0, abstain: 0 } })))
        if (Array.isArray(meet.participants) && meet.participants.length) {
          const mapped = meet.participants.map((p, idx) => {
            const pid = p._id || p._id?.$oid || p.uid || (idx + 1)
            const pidStr = String(pid)
            const role = p.role || (String(p._id) === String(meet.presidingParticipantId) || String(p.uid) === String(meet.createdBy) ? 'chair' : 'member')
            return ({ id: pidStr, name: p.name || 'Guest', role, vote: null, uid: p.uid || null, _id: p._id })
          })
          setMembers(mapped)
        }
      } catch (err) {
        // ignore polling errors
      }
    }, 5000)

    return () => { mounted = false; clearInterval(timer) }
  }, [meetingLoaded, meetingIdState])

  // Cast a vote
  const castVote = async (vote) => {
    if (safeCurrentUser.hasVoted) {
      alert('You have already voted. Use "Change Vote" to modify your vote.')
      return
    }

    // Update user's vote in members
    setMembers(prevMembers =>
      prevMembers.map(member =>
        member.id === safeCurrentUser.id ? { ...member, vote } : member
      )
    )

    // Update current user
    setCurrentUser(prev => ({
      ...(prev || {}),
      vote,
      hasVoted: true
    }))

    // Update vote counts in motion locally for immediate feedback
    setMotions(prevMotions =>
      prevMotions.map(motion =>
        motion.id === currentMotionId
          ? {
              ...motion,
              votes: {
                ...motion.votes,
                [vote]: (motion.votes[vote] || 0) + 1
              }
            }
          : motion
      )
    )

    // Show confirmation
    setVoteConfirmation(vote)
    setTimeout(() => setVoteConfirmation(null), 3000)

    console.log(`Vote cast: ${vote} by ${safeCurrentUser.name}`)

    // Also persist vote to backend if we have a meeting
    if (meetingIdState) {
      try {
        const token = localStorage.getItem('token')
        let uid = null
        try {
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]))
            uid = payload?.id || payload?.userId
          }
        } catch (e) {}
        const bodyObj = { action: 'castVote', motionId: currentMotionId, vote }
        if (safeCurrentUser.id) bodyObj.participantId = safeCurrentUser.id
        if (uid) bodyObj.uid = uid
        await apiFetch(`/api/meetings/${encodeURIComponent(meetingIdState)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(bodyObj)
        })
      } catch (err) {
        // swallow errors — UI updated optimistically
        console.warn('Failed to persist vote', err)
      }
    }
  }

  // Change vote
  const changeVote = () => {
    const oldVote = safeCurrentUser.vote

    // Decrease old vote count
    setMotions(prevMotions =>
      prevMotions.map(motion =>
        motion.id === currentMotionId
          ? {
              ...motion,
              votes: {
                ...motion.votes,
                [oldVote]: motion.votes[oldVote] - 1
              }
            }
          : motion
      )
    )

    setCurrentUser(prev => ({
      ...(prev || {}),
      hasVoted: false
    }))

    console.log('Vote change enabled for user:', safeCurrentUser.name)
  }

  // Create new motion
  const createNewMotion = (motionData) => {
    // If we don't have a meetingId, fallback to local behavior for now
    if (!meetingIdState) {
      const newMotion = {
        id: nextMotionId,
        title: motionData.title,
        description: motionData.description,
        status: 'proposed',
        createdBy: safeCurrentUser.id,
        votes: {
          yes: 0,
          no: 0,
          abstain: 0
        }
      }
      setMotions(prev => [...prev, newMotion])
      setCurrentMotionId(nextMotionId)
      setNextMotionId(prev => prev + 1)
      console.log('New motion created (local):', newMotion)
      return
    }

    (async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await apiFetch(`/api/meetings/${encodeURIComponent(meetingIdState)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ action: 'addMotion', title: motionData.title, description: motionData.description, createdByParticipantId: safeCurrentUser.id })
        })
        if (!res.ok) {
          const body = await res.json().catch(() => null)
          console.warn('Failed to add motion', body)
          alert('Failed to create motion: ' + (body?.message || res.statusText))
          return
        }
        const body = await res.json().catch(() => null)
        if (!body || !body.motion) return
        const m = body.motion
        const newMotion = { id: m.id, title: m.title, description: m.description, status: m.status || 'proposed', createdBy: m.createdBy || safeCurrentUser.id, votes: { yes: 0, no: 0, abstain: 0 } }
        setMotions(prev => [...prev, newMotion])
        setCurrentMotionId(newMotion.id)
        console.log('New motion created (server):', newMotion)
      } catch (err) {
        console.warn('Failed to create motion', err)
        alert('Failed to create motion')
      }
    })()
  }

  // Control functions
  const endVoting = async () => {
    // Only allow presiding officer to end voting via server
    if (safeCurrentUser.role !== 'chair') {
      alert('Only the presiding officer can end voting')
      return
    }
    if (!meetingIdState) {
      // offline fallback
      setMotions(prevMotions => prevMotions.map(motion => motion.id === currentMotionId ? { ...motion, status: 'completed' } : motion))
      setShowControlsModal(false)
      return
    }
    try {
      const token = localStorage.getItem('token')
      const res = await apiFetch(`/api/meetings/${encodeURIComponent(meetingIdState)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action: 'endVoting', motionId: currentMotionId })
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        console.warn('Failed to end voting', body)
        alert('Failed to end voting: ' + (body?.message || res.statusText))
        return
      }
      // Update local state optimistically
      setMotions(prevMotions => prevMotions.map(motion => motion.id === currentMotionId ? { ...motion, status: 'completed' } : motion))
      const votes = safeCurrentMotion.votes
      const total = votes.yes + votes.no + votes.abstain
      const majority = total / 2
      let result = 'Tied'
      if (votes.yes > majority) result = 'Passed'
      else if (votes.no > majority) result = 'Failed'
      alert(`Voting ended.\n\nResults:\nYes: ${votes.yes}\nNo: ${votes.no}\nAbstain: ${votes.abstain}\n\nOutcome: ${result}`)
      setShowControlsModal(false)
    } catch (err) {
      console.warn('Failed to end voting', err)
      alert('Failed to end voting')
    }
  }

  const startNewMotion = () => {
    setShowControlsModal(false)
    setShowNewMotionModal(true)
  }

  const viewResults = () => {
    const votes = safeCurrentMotion.votes
    const total = votes.yes + votes.no + votes.abstain
    const majority = total / 2
    
    let result = 'Tied'
    if (votes.yes > majority) result = 'Passed'
    else if (votes.no > majority) result = 'Failed'
    
    alert(`Motion Results:\n\nYes: ${votes.yes}\nNo: ${votes.no}\nAbstain: ${votes.abstain}\nTotal Votes: ${total}\n\nOutcome: ${result}`)
  }

  const selectMotion = (motion) => {
    setCurrentMotionId(motion.id)
  }

  // Start voting on selected motion
  const startVoting = async (motionId) => {
    // only chair can start voting
    if (safeCurrentUser.role !== 'chair') {
      alert('Only the presiding officer can start voting')
      return
    }
    if (!meetingIdState) {
      // local fallback
      setMotions(prev => prev.map(m => ({ ...m, status: m.id === motionId ? 'voting' : m.status })))
      setCurrentMotionId(motionId)
      setShowControlsModal(false)
      return
    }
    try {
      const token = localStorage.getItem('token')
      const res = await apiFetch(`/api/meetings/${encodeURIComponent(meetingIdState)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action: 'startVoting', motionId })
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        console.warn('Failed to start voting', body)
        alert('Failed to start voting: ' + (body?.message || res.statusText))
        return
      }
      setMotions(prev => prev.map(m => ({ ...m, status: m.id === motionId ? 'voting' : m.status })))
      setCurrentMotionId(motionId)
      setShowControlsModal(false)
    } catch (err) {
      console.warn('Failed to start voting', err)
      alert('Failed to start voting')
    }
  }

  // Assign selected member as the presiding officer (chair) and persist if possible
  const assignChair = async (memberId) => {
    setMembers(prev => prev.map(m => ({ ...m, role: String(m.id) === String(memberId) ? 'chair' : 'member' })))
    setCurrentUser(prev => ({ ...(prev || {}), role: String(prev?.id) === String(memberId) ? 'chair' : prev?.role }))

    // persist to backend if we have a meeting id
    if (!meetingIdState) return
    try {
      const token = localStorage.getItem('token')
      const res = await apiFetch(`/api/meetings/${encodeURIComponent(meetingIdState)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ presidingParticipantId: memberId })
      })
      if (!res.ok) console.warn('Failed to persist presiding officer change')
    } catch (err) {
      console.warn('Failed to update presiding officer', err)
    }
  }

  // Leave meeting flow
  const navigate = useNavigate()
  const leaveMeeting = async (destination = '/lobby') => {
    try {
      const meetingId = meetingIdState
      const participantId = sessionStorage.getItem('participantId')
      const token = localStorage.getItem('token')
      if (meetingId && participantId) {
        await apiFetch(`/api/meetings/${encodeURIComponent(meetingId)}/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ participantId })
        })
      } else if (meetingId && token) {
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
          // ignore parse
        }
      }
    } catch (err) {
      // ignore errors (best-effort leave)
      console.warn('Failed to call leave endpont', err)
    }
    try { sessionStorage.removeItem('inMeeting'); sessionStorage.removeItem('meetingId'); sessionStorage.removeItem('participantId'); sessionStorage.removeItem('committeeName') } catch (e) {}
    if (destination === '/login') {
      try { localStorage.removeItem('token'); localStorage.removeItem('userInfo') } catch (e) {}
    }
    navigate(destination)
  }

  const completedMotions = motions.filter(m => m.status === 'completed' && m.id !== currentMotionId)

  const presidingOfficer = members.find(m => m.role === 'chair')
  const onFloor = members.find(m => m.role === 'floor')
  const regularMembers = members.filter(m => m.role === 'member')
  const safeCurrentMotion = currentMotion || { id: null, title: 'No current motion', description: '', status: 'completed', votes: { yes: 0, no: 0, abstain: 0 } }
  const safeCurrentUser = currentUser || { id: null, name: 'Guest', role: 'member', hasVoted: false, vote: null }

  if (!meetingLoaded) {
    return (
      <>
        <Navigation />

        <main className="meeting-empty">
          <div className="meeting-empty-card">
            <h2>No active meeting</h2>
            <p>You're not currently in a meeting. Use the <strong>Home</strong> page to create or join a meeting.</p>
            <div style={{ marginTop: '1rem' }}>
              <a href="/lobby" className="primary">Go to Home</a>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navigation />

      <div className="meeting-dashboard">
        <div className="dashboard-header">
          <h1>{committee?.name || 'Meeting'}</h1>
          {meetingCode && (
            <span className="meeting-code">Code: {meetingCode}
              <button
                type="button"
                title="Copy meeting code"
                aria-label="Copy meeting code"
                className="copy-code-btn"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(meetingCode)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  } catch (err) {
                    // fallback
                    const el = document.createElement('textarea')
                    el.value = meetingCode
                    document.body.appendChild(el)
                    el.select()
                    document.execCommand('copy')
                    document.body.removeChild(el)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }
                }}
              >Copy</button>
              <button
                type="button"
                title="Share meeting code"
                aria-label="Share meeting code"
                className="share-code-btn"
                onClick={async () => {
                  try {
                    const shareUrl = `${window.location.origin}/join?meetingCode=${encodeURIComponent(meetingCode)}`
                    if (navigator.share) {
                      await navigator.share({ title: 'Join my meeting', text: `Use this meeting code to join: ${meetingCode}`, url: shareUrl })
                      setShared(true)
                      setTimeout(() => setShared(false), 2000)
                    } else {
                      await navigator.clipboard.writeText(shareUrl)
                      setShared(true)
                      setTimeout(() => setShared(false), 2000)
                    }
                  } catch (err) {
                    console.warn('Share failed', err)
                    const shareUrl = `${window.location.origin}/join?meetingCode=${encodeURIComponent(meetingCode)}`
                    try { await navigator.clipboard.writeText(shareUrl); setShared(true); setTimeout(() => setShared(false), 2000) } catch (e) { /* ignore */ }
                  }
                }}
              >Share</button>
              {copied && <span className="meeting-code-copied">Copied!</span>}
              {shared && <span className="meeting-code-shared">Link copied!</span>}
            </span>
          )}
          {safeCurrentUser.role === 'chair' && (
            <button 
              className="chair-controls-btn"
              onClick={() => setShowControlsModal(true)}
            >
              Chair Controls
            </button>
          )}
          <button className="leave-meeting-btn" onClick={() => setShowLeaveConfirm(true)}>Leave Meeting</button>
        </div>

        <div className="dashboard-grid">
          {/* Motion Card - Center/Prominent */}
          <div className="card motion-card">
            <div className="card-header">
              <h2>Current Motion</h2>
              <span className={`motion-status ${safeCurrentMotion.status}`}>
                {safeCurrentMotion.status === 'voting' ? 'Voting Open' : 'Completed'}
              </span>
            </div>
            <div className="motion-content">
              <h3>{safeCurrentMotion.title}</h3>
              <p>{safeCurrentMotion.description}</p>
            </div>
            <CurrentMotion
              motion={safeCurrentMotion}
              currentUser={safeCurrentUser}
              onCastVote={castVote}
              onChangeVote={changeVote}
            />
          </div>

          {/* Members Card */}
          <div className="card members-card">
            <div className="card-header">
              <h2>Committee Members</h2>
              <span className="member-count">{members.length} members</span>
            </div>
            <MembersList 
              members={members}
              presidingOfficer={presidingOfficer}
              onFloor={onFloor}
              regularMembers={regularMembers}
            />
          </div>

          {/* Vote Tally Card */}
          <div className="card tally-card">
            <div className="card-header">
              <h2>Vote Tally</h2>
            </div>
            <div className="vote-stats">
              <div className="stat-item yes">
                <div className="stat-label">Yes</div>
                <div className="stat-value">{safeCurrentMotion.votes.yes}</div>
              </div>
              <div className="stat-item no">
                <div className="stat-label">No</div>
                <div className="stat-value">{safeCurrentMotion.votes.no}</div>
              </div>
              <div className="stat-item abstain">
                <div className="stat-label">Abstain</div>
                <div className="stat-value">{safeCurrentMotion.votes.abstain}</div>
              </div>
            </div>
          </div>

          {/* Motion History Card */}
          {completedMotions.length > 0 && (
            <div className="card history-card">
              <div className="card-header">
                <h2>Motion History</h2>
              </div>
              <MotionHistory
                motions={completedMotions}
                onSelectMotion={selectMotion}
              />
            </div>
          )}
        </div>
      </div>

      {showControlsModal && (
          <ControlsModal
          onClose={() => setShowControlsModal(false)}
          onEndVoting={endVoting}
          onStartNewMotion={startNewMotion}
          onStartVoting={startVoting}
          onViewResults={viewResults}
          members={members}
          presidingOfficerId={presidingOfficer?.id}
          onAssignChair={assignChair}
          motions={motions}
        />
      )}

      {showNewMotionModal && (
        <NewMotionModal
          onClose={() => setShowNewMotionModal(false)}
          onCreateMotion={createNewMotion}
          currentUser={safeCurrentUser}
        />
      )}

      {voteConfirmation && <VoteConfirmation vote={voteConfirmation} />}
      {showLeaveConfirm && (
        <ConfirmLeaveModal
          isOpen={showLeaveConfirm}
          onConfirm={() => leaveMeeting('/lobby')}
          onCancel={() => setShowLeaveConfirm(false)}
          destination="/lobby"
          committeeName={committee?.name}
          title="Leave meeting"
          message={`You're about to leave the meeting${committee?.name ? ` "${committee.name}"` : ''}. This will remove you from the meeting. Continue?`}
          confirmLabel="Leave"
        />
      )}
    </>
  )
}

export default Meeting

