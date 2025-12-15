import { useState } from 'react'
import './EndVoteModal.css'

function EndVoteModal({ motion, result, votes, onSubmit, onCancel }) {
  const [summary, setSummary] = useState('')
  const [proInput, setProInput] = useState('')
  const [conInput, setConInput] = useState('')
  const [pros, setPros] = useState([])
  const [cons, setCons] = useState([])
  const [error, setError] = useState('')

  const addPro = () => {
    if (proInput.trim()) {
      setPros([...pros, proInput.trim()])
      setProInput('')
    }
  }

  const removePro = (index) => {
    setPros(pros.filter((_, i) => i !== index))
  }

  const addCon = () => {
    if (conInput.trim()) {
      setCons([...cons, conInput.trim()])
      setConInput('')
    }
  }

  const removeCon = (index) => {
    setCons(cons.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!summary.trim()) {
      setError('Please provide a summary of the decision')
      return
    }

    onSubmit({
      summary: summary.trim(),
      pros,
      cons
    })
  }

  // Calculate voting threshold display
  let thresholdLabel = 'simple majority'
  if (motion.votingThreshold === 'twoThirds') thresholdLabel = '2/3 supermajority'
  else if (motion.votingThreshold === 'unanimous') thresholdLabel = 'unanimous vote'

  return (
    <div className="end-vote-modal-overlay" onClick={onCancel}>
      <div className="end-vote-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="end-vote-header">
          <h3>End Voting & Record Summary</h3>
          <p className="header-subtitle">Document the decision for future reference</p>
        </div>

        {/* Motion Info */}
        <div className="motion-info-box">
          <h4 className="motion-info-title">{motion.title}</h4>
          <div className="motion-info-stats">
            <div className="stat-row">
              <span className="stat-label">Result:</span>
              <span className={`stat-value result-${result}`}>
                {result.charAt(0).toUpperCase() + result.slice(1)}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Required:</span>
              <span className="stat-value">{thresholdLabel}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Votes:</span>
              <span className="stat-value">
                Yes: {votes.yes} | No: {votes.no} | Abstain: {votes.abstain}
              </span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="form-section">
          <label htmlFor="summary" className="section-label">
            Decision Summary <span className="required">*</span>
          </label>
          <p className="section-hint">Explain why this decision was made and its implications</p>
          <textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Provide context for this decision, reasoning behind the outcome, and what it means for the organization..."
            rows="5"
            className="summary-textarea"
          />
        </div>

        {/* Pros */}
        <div className="form-section">
          <label className="section-label">
            Arguments In Favor <span className="optional">(optional)</span>
          </label>
          <p className="section-hint">Key points that supported this motion</p>
          <div className="input-with-button">
            <input
              type="text"
              value={proInput}
              onChange={(e) => setProInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPro())}
              placeholder="Add a pro argument..."
              className="list-input"
            />
            <button type="button" onClick={addPro} className="add-btn pro-btn">
              Add Pro
            </button>
          </div>
          {pros.length > 0 && (
            <ul className="argument-list">
              {pros.map((pro, idx) => (
                <li key={idx} className="argument-item pro-item">
                  <span className="argument-icon">✓</span>
                  <span className="argument-text">{pro}</span>
                  <button
                    type="button"
                    onClick={() => removePro(idx)}
                    className="remove-btn"
                    aria-label="Remove pro"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cons */}
        <div className="form-section">
          <label className="section-label">
            Arguments Against <span className="optional">(optional)</span>
          </label>
          <p className="section-hint">Key concerns or objections raised</p>
          <div className="input-with-button">
            <input
              type="text"
              value={conInput}
              onChange={(e) => setConInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCon())}
              placeholder="Add a con argument..."
              className="list-input"
            />
            <button type="button" onClick={addCon} className="add-btn con-btn">
              Add Con
            </button>
          </div>
          {cons.length > 0 && (
            <ul className="argument-list">
              {cons.map((con, idx) => (
                <li key={idx} className="argument-item con-item">
                  <span className="argument-icon">✗</span>
                  <span className="argument-text">{con}</span>
                  <button
                    type="button"
                    onClick={() => removeCon(idx)}
                    className="remove-btn"
                    aria-label="Remove con"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Action Buttons */}
        <div className="modal-actions">
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} className="submit-btn">
            End Voting & Save Summary
          </button>
        </div>
      </div>
    </div>
  )
}

export default EndVoteModal

