import { useState, useEffect } from 'react'
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
        // update committee name and data
        if (meet.name) {
          setCommittee({ id: meet._id || meetingId, name: meet.name, sessionActive: !!meet.active })
        }

        // set members from participants
        if (Array.isArray(meet.participants) && meet.participants.length) {
          const mapped = meet.participants.map((p, idx) => ({ id: idx + 1, name: p.name || 'Guest', role: 'member', vote: null }))
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
          if (found) setCurrentUser({ id: found._id || participantId, name: found.name || 'Guest', role: 'member', hasVoted: false, vote: null })
          else setCurrentUser({ id: participantId, name: 'Guest', role: 'member', hasVoted: false, vote: null })
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

  // Cast a vote
  const castVote = (vote) => {
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

    // Update vote counts in motion
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
    const newMotion = {
      id: nextMotionId,
      title: motionData.title,
      description: motionData.description,
      status: 'voting',
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
    
    console.log('New motion created:', newMotion)
  }

  // Control functions
  const endVoting = () => {
    setMotions(prevMotions =>
      prevMotions.map(motion =>
        motion.id === currentMotionId
          ? { ...motion, status: 'completed' }
          : motion
      )
    )
    
    const votes = safeCurrentMotion.votes
    const total = votes.yes + votes.no + votes.abstain
    const majority = total / 2
    
    let result = 'Tied'
    if (votes.yes > majority) result = 'Passed'
    else if (votes.no > majority) result = 'Failed'
    
    alert(`Voting ended.\n\nResults:\nYes: ${votes.yes}\nNo: ${votes.no}\nAbstain: ${votes.abstain}\n\nOutcome: ${result}`)
    setShowControlsModal(false)
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
          <button 
            className="chair-controls-btn"
            onClick={() => setShowControlsModal(true)}
          >
            Chair Controls
          </button>
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
          onViewResults={viewResults}
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
    </>
  )
}

export default Meeting

