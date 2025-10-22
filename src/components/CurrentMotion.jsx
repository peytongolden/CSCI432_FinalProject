import './CurrentMotion.css'
import VotingButtons from './VotingButtons'

function CurrentMotion({ motion, currentUser, onCastVote, onChangeVote }) {
  return (
    <div className="voting-section">
      <VotingButtons
        hasVoted={currentUser.hasVoted}
        currentVote={currentUser.vote}
        onCastVote={onCastVote}
        onChangeVote={onChangeVote}
      />
    </div>
  )
}

export default CurrentMotion

