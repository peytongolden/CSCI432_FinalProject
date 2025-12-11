import './CurrentMotion.css'
import VotingButtons from './VotingButtons'

function CurrentMotion({ motion, currentUser, onCastVote, onChangeVote }) {
  const showVoting = motion && motion.status === 'voting'
  return (
    <div className="voting-section">
      {showVoting ? (
        <VotingButtons
          hasVoted={currentUser.hasVoted}
          currentVote={currentUser.vote}
          onCastVote={onCastVote}
          onChangeVote={onChangeVote}
        />
      ) : (
        <div className="no-voting">No active vote for this motion.</div>
      )}
    </div>
  )
}

export default CurrentMotion

