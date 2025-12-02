import { useState, useEffect } from 'react'
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
  const [committee, setCommittee] = useState({
    id: 1,
    name: 'Budget Committee',
    sessionActive: true
  })

  const [members, setMembers] = useState([
    { id: 1, name: 'Sarah Johnson', role: 'chair', vote: null },
    { id: 2, name: 'Mike Chen', role: 'floor', vote: null },
    { id: 3, name: 'Alex Rivera', role: 'member', vote: null },
    { id: 4, name: 'Emma Davis', role: 'member', vote: null },
    { id: 5, name: 'David Kim', role: 'member', vote: null },
    { id: 6, name: 'Lisa Park', role: 'member', vote: null },
    { id: 7, name: 'James Wilson', role: 'member', vote: null },
    { id: 8, name: 'Rachel Green', role: 'member', vote: null }
  ])

  const [motions, setMotions] = useState([
    {
      id: 1,
      title: 'Motion to Approve Budget Amendment',
      description: 'Proposed amendment to increase marketing budget by $5,000 for Q4 initiatives.',
      status: 'voting',
      createdBy: 3,
      votes: {
        yes: 0,
        no: 0,
        abstain: 0
      }
    }
  ])

  const [currentMotionId, setCurrentMotionId] = useState(1)
  const currentMotion = motions.find(m => m.id === currentMotionId) || motions[0]

  const [currentUser, setCurrentUser] = useState({
    id: 3,
    name: 'Alex Rivera',
    role: 'member',
    hasVoted: false,
    vote: null
  })

  // if meetingId and participantId are in the query we will try to retrieve a real meeting
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const meetingId = params.get('meetingId')
    const participantId = params.get('participantId')

    if (!meetingId) return

    ;(async () => {
      try {
        const res = await fetch(`/api/meetings/${encodeURIComponent(meetingId)}`)
        if (!res.ok) return
        const body = await res.json().catch(() => null)
        if (!body || !body.meeting) return

        const meet = body.meeting

        // update committee name (use meeting name)
        if (meet.name) {
          setCommittee(prev => ({ ...prev, name: meet.name, sessionActive: !!meet.active }))
        }

        // set members from participants
        if (Array.isArray(meet.participants) && meet.participants.length) {
          const mapped = meet.participants.map((p, idx) => ({ id: idx + 1, name: p.name || 'Guest', role: 'member', vote: null }))
          setMembers(mapped)
        }

        // if we have a participantId, try to make them the current user
        if (participantId && Array.isArray(meet.participants)) {
          const found = meet.participants.find(p => String(p._id) === String(participantId) || String(p._id?.$oid) === String(participantId))
          if (found) setCurrentUser(prev => ({ ...prev, id: found._id || participantId, name: found.name || prev.name }))
        }
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

  // Cast a vote
  const castVote = (vote) => {
    if (currentUser.hasVoted) {
      alert('You have already voted. Use "Change Vote" to modify your vote.')
      return
    }

    // Update user's vote in members
    setMembers(prevMembers =>
      prevMembers.map(member =>
        member.id === currentUser.id ? { ...member, vote } : member
      )
    )

    // Update current user
    setCurrentUser(prev => ({
      ...prev,
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
                [vote]: motion.votes[vote] + 1
              }
            }
          : motion
      )
    )

    // Show confirmation
    setVoteConfirmation(vote)
    setTimeout(() => setVoteConfirmation(null), 3000)

    console.log(`Vote cast: ${vote} by ${currentUser.name}`)
  }

  // Change vote
  const changeVote = () => {
    const oldVote = currentUser.vote

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
      ...prev,
      hasVoted: false
    }))

    console.log('Vote change enabled for user:', currentUser.name)
  }

  // Create new motion
  const createNewMotion = (motionData) => {
    const newMotion = {
      id: nextMotionId,
      title: motionData.title,
      description: motionData.description,
      status: 'voting',
      createdBy: currentUser.id,
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
    
    const votes = currentMotion.votes
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
    const votes = currentMotion.votes
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

  return (
    <>
      <Navigation />

      <div className="meeting-dashboard">
        <div className="dashboard-header">
          <h1>{committee.name}</h1>
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
              <span className={`motion-status ${currentMotion.status}`}>
                {currentMotion.status === 'voting' ? 'Voting Open' : 'Completed'}
              </span>
            </div>
            <div className="motion-content">
              <h3>{currentMotion.title}</h3>
              <p>{currentMotion.description}</p>
            </div>
            <CurrentMotion
              motion={currentMotion}
              currentUser={currentUser}
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
                <div className="stat-value">{currentMotion.votes.yes}</div>
              </div>
              <div className="stat-item no">
                <div className="stat-label">No</div>
                <div className="stat-value">{currentMotion.votes.no}</div>
              </div>
              <div className="stat-item abstain">
                <div className="stat-label">Abstain</div>
                <div className="stat-value">{currentMotion.votes.abstain}</div>
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
          currentUser={currentUser}
        />
      )}

      {voteConfirmation && <VoteConfirmation vote={voteConfirmation} />}
    </>
  )
}

export default Meeting

