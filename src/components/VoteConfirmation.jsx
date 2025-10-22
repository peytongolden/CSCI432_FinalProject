import './VoteConfirmation.css'

function VoteConfirmation({ vote }) {
  return (
    <div className="vote-confirmation">
      <p>Vote recorded: <strong>{vote.toUpperCase()}</strong></p>
    </div>
  )
}

export default VoteConfirmation

