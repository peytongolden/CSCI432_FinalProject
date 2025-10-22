import './VotingButtons.css'

function VotingButtons({ hasVoted, currentVote, onCastVote, onChangeVote }) {
  if (hasVoted) {
    return (
      <div className="voting-buttons">
        <div className="vote-status">
          <p>You voted: <strong>{currentVote.toUpperCase()}</strong></p>
          <button className="change-vote-btn" onClick={onChangeVote}>
            Change Vote
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="voting-buttons">
      <button className="vote-button vote-no-btn" onClick={() => onCastVote('no')}>
        No
      </button>
      <button className="vote-button vote-abstain-btn" onClick={() => onCastVote('abstain')}>
        Abstain
      </button>
      <button className="vote-button vote-yes-btn" onClick={() => onCastVote('yes')}>
        Yes
      </button>
    </div>
  )
}

export default VotingButtons

