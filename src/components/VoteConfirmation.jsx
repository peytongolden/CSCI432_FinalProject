import './VoteConfirmation.css'

function VoteConfirmation({ vote }) {
  return (
    <div className="vote-confirmation" role="alert" aria-live="polite">
      <p>Vote recorded: <strong>{vote.toUpperCase()}</strong></p>
    </div>
  )
}

export default VoteConfirmation

