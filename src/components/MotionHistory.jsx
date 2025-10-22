import './MotionHistory.css'

function MotionHistory({ motions, onSelectMotion }) {
  if (motions.length === 0) {
    return null
  }

  const getMotionResult = (motion) => {
    const votes = motion.votes
    const total = votes.yes + votes.no + votes.abstain
    const majority = total / 2

    if (motion.status === 'voting') {
      return { text: 'In Progress', className: 'in-progress' }
    }

    if (votes.yes > majority) {
      return { text: 'Passed', className: 'passed' }
    } else if (votes.no > majority) {
      return { text: 'Failed', className: 'failed' }
    } else {
      return { text: 'Tied', className: 'tied' }
    }
  }

  return (
    <div className="motion-history">
      <h3 className="history-title">Motion History</h3>
      <div className="history-list">
        {motions.map((motion) => {
          const result = getMotionResult(motion)
          return (
            <div
              key={motion.id}
              className="history-item"
              onClick={() => onSelectMotion(motion)}
            >
              <div className="history-item-header">
                <h4>{motion.title}</h4>
                <span className={`motion-result ${result.className}`}>
                  {result.text}
                </span>
              </div>
              <p className="history-item-description">{motion.description}</p>
              <div className="history-item-votes">
                <span className="vote-badge yes">✓ {motion.votes.yes}</span>
                <span className="vote-badge no">✗ {motion.votes.no}</span>
                <span className="vote-badge abstain">— {motion.votes.abstain}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MotionHistory

