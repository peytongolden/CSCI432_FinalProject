import './MotionHistory.css'

function MotionHistory({ motions, onSelectMotion }) {
  if (motions.length === 0) {
    return null
  }

  const getVoteCount = (votes, type) => {
    if (!votes) return 0
    if (typeof votes[type] === 'number') return votes[type]
    if (Array.isArray(votes[type])) return votes[type].length
    if (votes[`${type}Voters`]) return votes[`${type}Voters`].length
    return 0
  }

  const getMotionResult = (motion) => {
    if (motion.result) {
      return { 
        text: motion.result.charAt(0).toUpperCase() + motion.result.slice(1), 
        className: motion.result 
      }
    }

    if (motion.status === 'voting') {
      return { text: 'In Progress', className: 'in-progress' }
    }

    if (motion.status === 'postponed') {
      return { text: 'Postponed', className: 'postponed' }
    }

    const yesCount = getVoteCount(motion.votes, 'yes')
    const noCount = getVoteCount(motion.votes, 'no')
    const total = yesCount + noCount
    const majority = total / 2

    if (yesCount > majority) {
      return { text: 'Passed', className: 'passed' }
    } else if (noCount > majority) {
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
          const yesCount = getVoteCount(motion.votes, 'yes')
          const noCount = getVoteCount(motion.votes, 'no')
          const abstainCount = getVoteCount(motion.votes, 'abstain')
          
          return (
            <div
              key={motion._id || motion.id}
              className="history-item"
              onClick={() => onSelectMotion(motion)}
            >
              <div className="history-item-header">
                <h4>{motion.title}</h4>
                <div className="history-badges">
                  {motion.type && motion.type !== 'main' && (
                    <span className={`motion-type-badge ${motion.type}`}>
                      {motion.type}
                    </span>
                  )}
                  <span className={`motion-result ${result.className}`}>
                    {result.text}
                  </span>
                </div>
              </div>
              <p className="history-item-description">{motion.description}</p>
              <div className="history-item-votes">
                <span className="vote-badge yes">✓ {yesCount}</span>
                <span className="vote-badge no">✗ {noCount}</span>
                <span className="vote-badge abstain">— {abstainCount}</span>
              </div>
              {motion.chairSummary && (
                <div className="history-summary">
                  <strong>Summary:</strong> {motion.chairSummary}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MotionHistory

