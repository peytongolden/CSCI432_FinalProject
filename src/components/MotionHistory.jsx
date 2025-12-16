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
      // Handle special results with proper formatting
      const resultText = motion.result === 'overturned' 
        ? '↩ Overturned'
        : motion.result.charAt(0).toUpperCase() + motion.result.slice(1)
      return { 
        text: resultText, 
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
                <div className="history-summary-section">
                  <div className="history-summary">
                    <strong>Decision Summary:</strong>
                    <p>{motion.chairSummary}</p>
                  </div>
                  
                  {motion.pros && motion.pros.length > 0 && (
                    <div className="history-arguments pros">
                      <strong>Arguments In Favor:</strong>
                      <ul>
                        {motion.pros.map((pro, idx) => (
                          <li key={idx} className="arg-item pro">
                            <span className="arg-icon">✓</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {motion.cons && motion.cons.length > 0 && (
                    <div className="history-arguments cons">
                      <strong>Arguments Against:</strong>
                      <ul>
                        {motion.cons.map((con, idx) => (
                          <li key={idx} className="arg-item con">
                            <span className="arg-icon">✗</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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

