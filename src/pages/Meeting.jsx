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
import DiscussionPanel from '../components/DiscussionPanel'
import EndVoteModal from '../components/EndVoteModal'
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

    console.log('[Meeting] Loading with params:', { meetingId, participantId })

    if (!meetingId) {
      console.warn('[Meeting] No meetingId in URL - cannot load meeting')
      return
    }

    ;(async () => {
      try {
        console.log('[Meeting] Fetching meeting data from API...')
        const res = await apiFetch(`/api/meetings/${encodeURIComponent(meetingId)}`)
        if (!res.ok) {
          console.error('[Meeting] API call failed:', res.status, res.statusText)
          return
        }
        const body = await res.json().catch(() => null)
        if (!body || !body.meeting) {
          console.error('[Meeting] Invalid response body:', body)
          return
        }

      const meet = body.meeting
      console.log('[Meeting] Successfully loaded meeting:', meet.name, 'with', meet.participants?.length || 0, 'participants')
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

        // set motions if present (convert vote arrays to counts)
        if (Array.isArray(meet.motions) && meet.motions.length) {
          const convertVotes = (votes) => {
            if (!votes) return { yes: 0, no: 0, abstain: 0 }
            return {
              yes: Array.isArray(votes.yes) ? votes.yes.length : (typeof votes.yes === 'number' ? votes.yes : 0),
              no: Array.isArray(votes.no) ? votes.no.length : (typeof votes.no === 'number' ? votes.no : 0),
              abstain: Array.isArray(votes.abstain) ? votes.abstain.length : (typeof votes.abstain === 'number' ? votes.abstain : 0)
            }
          }
          setMotions(meet.motions.map((m, idx) => ({ 
            id: m.id || String(m._id) || String(idx + 1), 
            title: m.title || 'Untitled', 
            description: m.description || '', 
            status: m.status || 'voting', 
            result: m.result || null,
            createdBy: m.createdBy || null, 
            votes: convertVotes(m.votes),
            discussion: m.discussion || [],
            _rawVotes: m.votes
          })))
          const firstMotionId = meet.motions[0]?.id || String(meet.motions[0]?._id) || '1'
          setCurrentMotionId(prev => prev || firstMotionId)
        }

        // if we have a participantId, try to make them the current user
        if (participantId && Array.isArray(meet.participants)) {
          const found = meet.participants.find(p => String(p._id) === String(participantId) || String(p._id?.$oid) === String(participantId))
          if (found) {
            console.log('[Meeting] Found participant by ID:', found.name, 'role:', found.role)
            setCurrentUser({ id: String(found._id || participantId), name: found.name || 'Guest', role: found.role || 'member', hasVoted: false, vote: null })
          } else {
            console.log('[Meeting] Participant ID not found in list, defaulting to member')
            setCurrentUser({ id: String(participantId), name: 'Guest', role: 'member', hasVoted: false, vote: null })
          }
        } else if (userInfo && String(userInfo.id) === String(meet.createdBy)) {
          // if we're the creator (authenticated), make us the current user with chair role
          console.log('[Meeting] User is meeting creator - assigning chair role')
          setCurrentUser(prev => ({ ...(prev || {}), id: String(userInfo.id), name: userInfo.name || 'Guest', role: 'chair', hasVoted: false, vote: null }))
        } else if (meet.participants?.length === 0 || (!participantId && !meet.createdBy)) {
          // If no participants yet and we're the only one here, assume chair role
          console.log('[Meeting] No participants and no createdBy - assuming chair role for first user')
          const tempId = userInfo?.id || 'temp_' + Date.now()
          setCurrentUser({ id: String(tempId), name: userInfo?.name || 'Guest', role: 'chair', hasVoted: false, vote: null })
        } else {
          // Fallback: check if there's a presiding participant and we might be them
          const presidingParticipant = meet.participants?.find(p => String(p._id) === String(meet.presidingParticipantId))
          if (presidingParticipant && userInfo && String(presidingParticipant.uid) === String(userInfo.id)) {
            console.log('[Meeting] User matches presiding participant by uid - assigning chair role')
            setCurrentUser({ id: String(presidingParticipant._id), name: presidingParticipant.name || userInfo.name || 'Guest', role: 'chair', hasVoted: false, vote: null })
          } else {
            console.log('[Meeting] Could not determine user role - defaulting to member')
            setCurrentUser({ id: userInfo?.id || 'guest', name: userInfo?.name || 'Guest', role: 'member', hasVoted: false, vote: null })
          }
        }

        // indicate we've loaded an actual meeting
        console.log('[Meeting] Setting meetingLoaded=true')
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
  const [showEndVoteModal, setShowEndVoteModal] = useState(false)
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

  // Helper to convert backend vote arrays to counts
  const convertVotesToCounts = (votes) => {
    if (!votes) return { yes: 0, no: 0, abstain: 0 }
    return {
      yes: Array.isArray(votes.yes) ? votes.yes.length : (typeof votes.yes === 'number' ? votes.yes : 0),
      no: Array.isArray(votes.no) ? votes.no.length : (typeof votes.no === 'number' ? votes.no : 0),
      abstain: Array.isArray(votes.abstain) ? votes.abstain.length : (typeof votes.abstain === 'number' ? votes.abstain : 0)
    }
  }

  // Helper to find a participant's vote from motion votes arrays
  const findParticipantVote = (motionVotes, participantId) => {
    if (!motionVotes || !participantId) return null
    const pid = String(participantId)
    if (Array.isArray(motionVotes.yes) && motionVotes.yes.some(v => String(v.participantId) === pid)) return 'yes'
    if (Array.isArray(motionVotes.no) && motionVotes.no.some(v => String(v.participantId) === pid)) return 'no'
    if (Array.isArray(motionVotes.abstain) && motionVotes.abstain.some(v => String(v.participantId) === pid)) return 'abstain'
    return null
  }

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

        // Update committee name/code
        if (meet.name) setCommittee(prev => ({ ...(prev || {}), name: meet.name, sessionActive: !!meet.active }))
        if (meet.code) setMeetingCode(meet.code)

        // Update motions with proper vote count conversion
        if (Array.isArray(meet.motions)) {
          const updatedMotions = meet.motions.map((m, idx) => ({
            id: m.id || String(m._id) || String(idx + 1),
            title: m.title || 'Untitled',
            description: m.description || '',
            type: m.type || 'main',
            status: m.status || 'voting',
            result: m.result || null,
            createdBy: m.createdBy || null,
            votingThreshold: m.votingThreshold || 'simple',
            isAnonymous: m.isAnonymous || false,
            parentMotionId: m.parentMotionId || null,
            chairSummary: m.chairSummary || '',
            pros: m.pros || [],
            cons: m.cons || [],
            votes: convertVotesToCounts(m.votes),
            discussion: m.discussion || [],
            _rawVotes: m.votes // Keep raw votes for participant lookup
          }))
          
          // Check if we need to update currentMotionId
          setMotions(prevMotions => {
            // If there are motions but no current motion is selected, select the latest one
            if (updatedMotions.length > 0 && !currentMotionId) {
              const latestMotion = updatedMotions[updatedMotions.length - 1]
              setCurrentMotionId(latestMotion.id)
              console.log('[Meeting] Auto-selected latest motion:', latestMotion.title)
            }
            // If a new motion was added (length increased), switch to the newest one
            else if (updatedMotions.length > prevMotions.length) {
              const newestMotion = updatedMotions[updatedMotions.length - 1]
              setCurrentMotionId(newestMotion.id)
              console.log('[Meeting] New motion detected, switching to:', newestMotion.title)
            }
            return updatedMotions
          })
        }

        // Update participants and their vote displays
        if (Array.isArray(meet.participants) && meet.participants.length) {
          // Find current motion's raw votes for participant vote display
          const currentMotionData = meet.motions?.find(m => 
            (m.id && String(m.id) === String(currentMotionId)) || 
            (m._id && String(m._id) === String(currentMotionId))
          )

          const mapped = meet.participants.map((p, idx) => {
            const pid = p._id || p._id?.$oid || p.uid || (idx + 1)
            const pidStr = String(pid)
            const role = p.role || (String(p._id) === String(meet.presidingParticipantId) || String(p.uid) === String(meet.createdBy) ? 'chair' : 'member')
            // Get vote from current motion if available
            const vote = currentMotionData ? findParticipantVote(currentMotionData.votes, pidStr) : null
            return ({ id: pidStr, name: p.name || 'Guest', role, vote, uid: p.uid || null, _id: p._id })
          })
          setMembers(mapped)
          
          // Update current user's role and vote status
          if (currentUser?.id) {
            // Find current user in the updated participants to sync their role
            const currentUserParticipant = mapped.find(m => String(m.id) === String(currentUser.id))
            if (currentUserParticipant) {
              const myVote = currentMotionData ? findParticipantVote(currentMotionData.votes, currentUser.id) : null
              setCurrentUser(prev => ({ 
                ...(prev || {}), 
                role: currentUserParticipant.role,  // Sync role from backend
                hasVoted: !!myVote, 
                vote: myVote 
              }))
            }
          }
        }
      } catch (err) {
        // ignore polling errors
      }
    }, 5000)

    return () => { mounted = false; clearInterval(timer) }
  }, [meetingLoaded, meetingIdState, currentMotionId, currentUser?.id])

  // Cast a vote
  const castVote = async (vote) => {
    if (safeCurrentUser.hasVoted) {
      alert('You have already voted. Use "Change Vote" to modify your vote.')
      return
    }

    // Optimistically update UI first
    setMembers(prevMembers =>
      prevMembers.map(member =>
        member.id === safeCurrentUser.id ? { ...member, vote } : member
      )
    )

    setCurrentUser(prev => ({
      ...(prev || {}),
      vote,
      hasVoted: true
    }))

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

    // Persist to backend
    if (meetingIdState && currentMotionId) {
      try {
        const token = localStorage.getItem('token')
        const motionId = String(currentMotionId)
        const res = await apiFetch(`/api/motions/${encodeURIComponent(motionId)}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            meetingId: meetingIdState,
            participantId: safeCurrentUser.id,
            participantName: safeCurrentUser.name,
            vote
          })
        })
        if (!res.ok) {
          console.warn('Failed to persist vote to backend')
        }
      } catch (err) {
        console.warn('Failed to persist vote', err)
      }
    }

    console.log(`Vote cast: ${vote} by ${safeCurrentUser.name}`)
  }

  // Change vote - allows user to cast a new vote (the API handles removing old vote)
  const changeVote = () => {
    const oldVote = safeCurrentUser.vote

    // Decrease old vote count locally
    setMotions(prevMotions =>
      prevMotions.map(motion =>
        motion.id === currentMotionId
          ? {
              ...motion,
              votes: {
                ...motion.votes,
                [oldVote]: Math.max(0, motion.votes[oldVote] - 1)
              }
            }
          : motion
      )
    )

    // Clear user's voted status so they can vote again
    setCurrentUser(prev => ({
      ...(prev || {}),
      hasVoted: false,
      vote: null
    }))

    // Clear member's vote display
    setMembers(prevMembers =>
      prevMembers.map(member =>
        member.id === safeCurrentUser.id ? { ...member, vote: null } : member
      )
    )

    console.log('Vote change enabled for user:', safeCurrentUser.name)
  }

  // Create new motion
  const createNewMotion = async (motionData) => {
    // Create optimistic local motion first
    const tempId = `temp_${nextMotionId}`
    const newMotion = {
      id: tempId,
      title: motionData.title,
      description: motionData.description,
      type: motionData.type || 'main',
      status: 'voting',
      createdBy: safeCurrentUser.id,
      votingThreshold: motionData.votingThreshold || 'simple',
      isAnonymous: motionData.isAnonymous || false,
      parentMotionId: motionData.parentMotionId || null,
      votes: {
        yes: 0,
        no: 0,
        abstain: 0
      },
      discussion: []
    }

    setMotions(prev => [...prev, newMotion])
    setCurrentMotionId(tempId)
    setNextMotionId(prev => prev + 1)
    
    // Persist to backend if we have a meeting
    if (meetingIdState) {
      try {
        const token = localStorage.getItem('token')
        const res = await apiFetch('/api/motions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            meetingId: meetingIdState,
            title: motionData.title,
            description: motionData.description,
            type: motionData.type || 'main',
            isAnonymous: motionData.isAnonymous || false,
            ...(motionData.parentMotionId && { parentMotionId: motionData.parentMotionId })
          })
        })
        
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.motion) {
            // Replace temp motion with the real one from backend
            const backendMotion = {
              id: data.motion.id || data.motion._id,
              title: data.motion.title,
              description: data.motion.description,
              type: data.motion.type || 'main',
              status: data.motion.status || 'voting',
              createdBy: data.motion.createdBy,
              votingThreshold: data.motion.votingThreshold || 'simple',
              isAnonymous: data.motion.isAnonymous || false,
              parentMotionId: data.motion.parentMotionId || null,
              votes: {
                yes: Array.isArray(data.motion.votes?.yes) ? data.motion.votes.yes.length : 0,
                no: Array.isArray(data.motion.votes?.no) ? data.motion.votes.no.length : 0,
                abstain: Array.isArray(data.motion.votes?.abstain) ? data.motion.votes.abstain.length : 0
              },
              discussion: data.motion.discussion || []
            }
            setMotions(prev => prev.map(m => m.id === tempId ? backendMotion : m))
            setCurrentMotionId(backendMotion.id)
            console.log('Motion persisted to backend:', backendMotion)
          }
        } else {
          const errorText = await res.text().catch(() => 'No response body')
          console.error('Failed to persist motion to backend - Status:', res.status, 'Error:', errorText)
        }
      } catch (err) {
        console.warn('Failed to create motion on backend', err)
      }
    }
    
    console.log('New motion created:', newMotion)
    return true // Signal success to caller
  }

  // Control functions
  // Helper function to calculate voting result based on threshold
  const calculateVotingResult = (votes, votingThreshold) => {
    const yesVotes = votes.yes
    const noVotes = votes.no
    const totalVotes = yesVotes + noVotes // abstentions don't count toward threshold
    
    if (totalVotes === 0) return 'tied' // No votes cast
    
    let requiredVotes
    let thresholdLabel
    
    switch (votingThreshold) {
      case 'twoThirds':
        requiredVotes = Math.ceil(totalVotes * (2/3))
        thresholdLabel = '2/3 majority'
        break
      case 'unanimous':
        requiredVotes = totalVotes
        thresholdLabel = 'unanimous'
        break
      case 'simple':
      default:
        requiredVotes = Math.ceil(totalVotes / 2)
        thresholdLabel = 'simple majority'
    }
    
    if (yesVotes >= requiredVotes) return 'passed'
    if (noVotes >= requiredVotes) return 'failed'
    return 'tied' // Neither side has required threshold
  }

  // Show the end vote modal (chair will add summary)
  const endVoting = () => {
    setShowControlsModal(false)
    setShowEndVoteModal(true)
  }

  // Handle end vote with summary submission
  const handleEndVoteWithSummary = async (summaryData) => {
    const votes = safeCurrentMotion.votes
    const votingThreshold = safeCurrentMotion.votingThreshold || 'simple'
    const result = calculateVotingResult(votes, votingThreshold)
    const motionType = safeCurrentMotion.type || 'main'
    const parentMotionId = safeCurrentMotion.parentMotionId

    // Update local state - handle overturn motions specially
    setMotions(prevMotions => {
      let updatedMotions = prevMotions.map(motion =>
        motion.id === currentMotionId
          ? { 
              ...motion, 
              status: 'completed', 
              result,
              chairSummary: summaryData.summary,
              pros: summaryData.pros,
              cons: summaryData.cons
            }
          : motion
      )
      
      // If this is an overturn motion that PASSED, update the parent motion to 'overturned'
      if (motionType === 'overturn' && result === 'passed' && parentMotionId) {
        updatedMotions = updatedMotions.map(motion =>
          motion.id === parentMotionId
            ? { ...motion, result: 'overturned', status: 'completed' }
            : motion
        )
        console.log('[Meeting] Overturn motion passed - updating parent motion to overturned')
      }
      
      return updatedMotions
    })
    
    // Persist to backend
    if (meetingIdState && currentMotionId) {
      try {
        const token = localStorage.getItem('token')
        const motionId = String(currentMotionId)
        await apiFetch(`/api/motions/${encodeURIComponent(motionId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            meetingId: meetingIdState,
            status: 'completed',
            result,
            chairSummary: summaryData.summary,
            pros: summaryData.pros,
            cons: summaryData.cons
          })
        })
        console.log('Voting ended with summary saved')
        
        // If overturn motion passed, also update the parent motion on backend
        if (motionType === 'overturn' && result === 'passed' && parentMotionId) {
          await apiFetch(`/api/motions/${encodeURIComponent(parentMotionId)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({
              meetingId: meetingIdState,
              result: 'overturned'
            })
          })
          console.log('Parent motion updated to overturned')
        }
      } catch (err) {
        console.warn('Failed to end voting on backend', err)
      }
    }
    
    setShowEndVoteModal(false)
    
    // Show success message
    const totalVotes = votes.yes + votes.no
    let thresholdLabel = 'simple majority'
    if (votingThreshold === 'twoThirds') thresholdLabel = '2/3 supermajority'
    else if (votingThreshold === 'unanimous') thresholdLabel = 'unanimous vote'
    const requiredForPass = votingThreshold === 'twoThirds' ? Math.ceil(totalVotes * (2/3)) : 
                            votingThreshold === 'unanimous' ? totalVotes :
                            Math.ceil(totalVotes / 2)
    
    alert(
      `Voting ended successfully!\n\n` +
      `Required: ${thresholdLabel}\n` +
      `Needed to pass: ${requiredForPass} yes votes\n\n` +
      `Results:\n` +
      `Yes: ${votes.yes}\n` +
      `No: ${votes.no}\n` +
      `Abstain: ${votes.abstain}\n\n` +
      `Outcome: ${result.charAt(0).toUpperCase() + result.slice(1)}\n\n` +
      `Summary has been recorded.`
    )
  }

  const startNewMotion = () => {
    setShowControlsModal(false)
    setShowNewMotionModal(true)
  }

  const viewResults = () => {
    const votes = safeCurrentMotion.votes
    const votingThreshold = safeCurrentMotion.votingThreshold || 'simple'
    const result = calculateVotingResult(votes, votingThreshold)
    
    const totalVotes = votes.yes + votes.no
    const requiredForPass = votingThreshold === 'twoThirds' ? Math.ceil(totalVotes * (2/3)) : 
                            votingThreshold === 'unanimous' ? totalVotes :
                            Math.ceil(totalVotes / 2)
    
    let thresholdLabel = 'simple majority'
    if (votingThreshold === 'twoThirds') thresholdLabel = '2/3 supermajority'
    else if (votingThreshold === 'unanimous') thresholdLabel = 'unanimous vote'
    
    alert(
      `Motion Results:\n\n` +
      `Required: ${thresholdLabel}\n` +
      `Needed to pass: ${requiredForPass} yes votes\n\n` +
      `Yes: ${votes.yes}\n` +
      `No: ${votes.no}\n` +
      `Abstain: ${votes.abstain}\n\n` +
      `Current Outcome: ${result.charAt(0).toUpperCase() + result.slice(1)}`
    )
  }

  const selectMotion = (motion) => {
    setCurrentMotionId(motion.id)
  }

  // Add discussion comment
  const addDiscussionComment = async (comment, stance) => {
    if (!meetingIdState || !currentMotionId || !comment.trim()) {
      console.warn('[Meeting] Cannot add comment:', { meetingIdState, currentMotionId, comment: !!comment })
      return
    }
    
    if (!safeCurrentUser || !safeCurrentUser.id) {
      console.warn('[Meeting] Cannot add comment - no valid user')
      return
    }

    // Optimistically add to local state
    const newComment = {
      _id: 'temp_' + Date.now(),
      participantId: safeCurrentUser.id || 'anonymous',
      participantName: safeCurrentUser.name || 'Anonymous',
      comment: comment.trim(),
      stance: stance || 'neutral',
      timestamp: new Date().toISOString()
    }

    console.log('[Meeting] Adding discussion comment:', newComment)

    setMotions(prevMotions =>
      prevMotions.map(motion =>
        motion.id === currentMotionId
          ? { ...motion, discussion: [...(Array.isArray(motion.discussion) ? motion.discussion : []), newComment] }
          : motion
      )
    )

    // Persist to backend
    try {
      const token = localStorage.getItem('token')
      const motionId = String(currentMotionId)
      const res = await apiFetch(`/api/motions/${encodeURIComponent(motionId)}/discuss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          meetingId: meetingIdState,
          participantId: safeCurrentUser.id,
          participantName: safeCurrentUser.name,
          comment: comment.trim(),
          stance: stance || 'neutral'
        })
      })
      if (res.ok) {
        console.log('[Meeting] Discussion comment persisted successfully')
      } else {
        console.warn('[Meeting] Failed to persist discussion comment - Status:', res.status)
      }
    } catch (err) {
      console.warn('[Meeting] Failed to add discussion comment:', err)
    }
  }

  // Assign selected member as the presiding officer (chair) and persist if possible
  const assignChair = async (memberId) => {
    console.log('[Meeting] Assigning chair to member:', memberId)
    
    // Optimistically update UI
    setMembers(prev => prev.map(m => ({ ...m, role: String(m.id) === String(memberId) ? 'chair' : 'member' })))
    
    // Update current user's role if they're the new chair
    const isCurrentUserNewChair = String(currentUser?.id) === String(memberId)
    if (isCurrentUserNewChair) {
      setCurrentUser(prev => ({ ...(prev || {}), role: 'chair' }))
      console.log('[Meeting] Current user is now chair')
    } else if (currentUser?.role === 'chair') {
      setCurrentUser(prev => ({ ...(prev || {}), role: 'member' }))
      console.log('[Meeting] Current user role changed to member')
    }

    // Persist to backend
    if (!meetingIdState) return
    try {
      const token = localStorage.getItem('token')
      const res = await apiFetch(`/api/meetings/${encodeURIComponent(meetingIdState)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ presidingParticipantId: memberId })
      })
      
      if (res.ok) {
        console.log('[Meeting] Presiding officer updated successfully')
      } else {
        console.warn('Failed to persist presiding officer change')
        // Revert optimistic update on failure
        setMembers(prev => prev.map(m => ({ ...m, role: m.id === memberId ? 'member' : m.role })))
      }
    } catch (err) {
      console.warn('Failed to update presiding officer', err)
      // Revert optimistic update on error
      setMembers(prev => prev.map(m => ({ ...m, role: m.id === memberId ? 'member' : m.role })))
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
  
  // Ensure safe defaults with proper array initialization
  const safeCurrentMotion = currentMotion 
    ? { ...currentMotion, discussion: Array.isArray(currentMotion.discussion) ? currentMotion.discussion : [] }
    : { id: null, title: 'No current motion', description: '', status: 'completed', votes: { yes: 0, no: 0, abstain: 0 }, discussion: [] }
  
  const safeCurrentUser = currentUser || { id: 'guest_' + Date.now(), name: 'Guest', role: 'member', hasVoted: false, vote: null }

  if (!meetingLoaded) {
    console.log('[Meeting] Rendering empty state - meetingLoaded is false')
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

  console.log('[Meeting] Rendering meeting interface - meetingLoaded is true')

  return (
    <>
      <Navigation />

      <div className="meeting-dashboard">
        <div className="dashboard-header">
          <div className="header-left">
            <h1>{committee?.name || 'Meeting'}</h1>
            {meetingCode && (
              <div className="meeting-code-container">
                <span className="code-label">Join Code</span>
                <span className="code-value">{meetingCode}</span>
                <div className="code-actions">
                  <button
                    type="button"
                    title="Copy meeting code"
                    aria-label="Copy meeting code"
                    className="code-action-btn"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(meetingCode)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      } catch (err) {
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
                  >
                    {copied ? '✓' : '📋'}
                  </button>
                  <button
                    type="button"
                    title="Share meeting link"
                    aria-label="Share meeting link"
                    className="code-action-btn"
                    onClick={async () => {
                      try {
                        const shareUrl = `${window.location.origin}/join-meeting?code=${encodeURIComponent(meetingCode)}`
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
                        const shareUrl = `${window.location.origin}/join-meeting?code=${encodeURIComponent(meetingCode)}`
                        try { await navigator.clipboard.writeText(shareUrl); setShared(true); setTimeout(() => setShared(false), 2000) } catch (e) { /* ignore */ }
                      }
                    }}
                  >
                    {shared ? '✓' : '🔗'}
                  </button>
                </div>
                {(copied || shared) && (
                  <span className="code-toast">{copied ? 'Code copied!' : 'Link copied!'}</span>
                )}
              </div>
            )}
          </div>
          <div className="header-actions">
            {safeCurrentUser.role === 'chair' && (
              <button 
                className="chair-controls-btn"
                onClick={() => setShowControlsModal(true)}
                aria-label="Open chair controls"
              >
                <span className="btn-icon">⚙️</span>
                <span>Chair Controls</span>
              </button>
            )}
            <button 
              className="leave-meeting-btn" 
              onClick={() => setShowLeaveConfirm(true)}
              aria-label="Leave meeting"
            >
              Leave
            </button>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Motion Card - Center/Prominent */}
          <div className="card motion-card">
            <div className="card-header">
              <h2>Current Motion</h2>
              {safeCurrentMotion.id && (
                <span className={`motion-status ${safeCurrentMotion.status} ${safeCurrentMotion.result || ''}`}>
                  {safeCurrentMotion.status === 'voting' 
                    ? 'Voting Open' 
                    : safeCurrentMotion.result === 'passed' 
                      ? '✓ Passed'
                      : safeCurrentMotion.result === 'failed'
                        ? '✗ Failed'
                        : safeCurrentMotion.result === 'tied'
                          ? '⚖ Tied'
                          : safeCurrentMotion.result === 'overturned'
                            ? '↩ Overturned'
                            : 'Completed'}
                </span>
              )}
            </div>
            {safeCurrentMotion.id ? (
              <>
                {/* Motion Type and Threshold Badges */}
                <div className="motion-badges">
                  <span className={`motion-type-badge ${safeCurrentMotion.type || 'main'}`}>
                    {(safeCurrentMotion.type || 'main').charAt(0).toUpperCase() + (safeCurrentMotion.type || 'main').slice(1)} Motion
                  </span>
                  {safeCurrentMotion.isAnonymous && (
                    <span className="anonymous-badge">🔒 Anonymous</span>
                  )}
                </div>

                <div className="motion-content">
                  <h3>{safeCurrentMotion.title}</h3>
                  <p>{safeCurrentMotion.description}</p>
                  
                  {/* Voting Threshold Requirement */}
                  <div className="voting-threshold-info">
                    <span className="threshold-label">Required to Pass:</span>
                    <span className="threshold-value">
                      {safeCurrentMotion.votingThreshold === 'twoThirds' && '⅔ Supermajority (≥67%)'}
                      {safeCurrentMotion.votingThreshold === 'unanimous' && 'Unanimous (100%)'}
                      {(!safeCurrentMotion.votingThreshold || safeCurrentMotion.votingThreshold === 'simple') && 'Simple Majority (>50%)'}
                    </span>
                  </div>

                  {/* Parent Motion Reference */}
                  {safeCurrentMotion.parentMotionId && (
                    <div className="parent-motion-ref">
                      <span className="ref-label">
                        {safeCurrentMotion.type === 'amendment' && '✏️ Amending:'}
                        {safeCurrentMotion.type === 'overturn' && '↩️ Overturning:'}
                      </span>
                      <span className="ref-title">
                        {motions.find(m => m.id === safeCurrentMotion.parentMotionId)?.title || 'Previous Motion'}
                      </span>
                    </div>
                  )}
                </div>
                
                <CurrentMotion
                  motion={safeCurrentMotion}
                  currentUser={safeCurrentUser}
                  onCastVote={castVote}
                  onChangeVote={changeVote}
                />
              </>
            ) : (
              <div className="motion-content empty-state">
                <div className="empty-icon">📋</div>
                <h3>No Active Motion</h3>
                <p>
                  {safeCurrentUser.role === 'chair' 
                    ? 'Use Chair Controls to create a new motion for voting.'
                    : 'Waiting for the chair to propose a motion.'
                  }
                </p>
                {safeCurrentUser.role === 'chair' && (
                  <button 
                    className="create-motion-btn"
                    onClick={() => setShowNewMotionModal(true)}
                  >
                    Create Motion
                  </button>
                )}
              </div>
            )}
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

          {/* Discussion Panel Card */}
          <div className="card discussion-card">
            <DiscussionPanel
              discussion={safeCurrentMotion.discussion || []}
              onAddComment={addDiscussionComment}
              currentUser={safeCurrentUser}
              motionStatus={safeCurrentMotion.status}
              hasActiveMotion={!!safeCurrentMotion.id}
            />
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
          members={members}
          presidingOfficerId={presidingOfficer?.id}
          onAssignChair={assignChair}
        />
      )}

      {showNewMotionModal && (
        <NewMotionModal
          onClose={() => setShowNewMotionModal(false)}
          onCreateMotion={createNewMotion}
          currentUser={safeCurrentUser}
          motions={motions}
        />
      )}

      {showEndVoteModal && (
        <EndVoteModal
          motion={safeCurrentMotion}
          result={calculateVotingResult(safeCurrentMotion.votes, safeCurrentMotion.votingThreshold || 'simple')}
          votes={safeCurrentMotion.votes}
          onSubmit={handleEndVoteWithSummary}
          onCancel={() => setShowEndVoteModal(false)}
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

