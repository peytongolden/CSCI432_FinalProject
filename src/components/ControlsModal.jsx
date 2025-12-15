import './ControlsModal.css'
import { useState } from 'react'

function ControlsModal({ onClose, onEndVoting, onStartNewMotion, onViewResults, members = [], presidingOfficerId = null, onAssignChair }) {
  const [selectedChair, setSelectedChair] = useState(presidingOfficerId || (members[0]?.id) || '')

  const handleAssignChair = () => {
    if (selectedChair && onAssignChair) {
      onAssignChair(selectedChair)
    }
  }

  return (
    <div className="controls-modal-overlay" onClick={onClose}>
      <div className="controls-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="controls-modal-header">
          <h3>Chair Controls</h3>
          <p className="controls-subtitle">Manage the current meeting session</p>
        </div>

        <div className="controls-section">
          <h4>Voting Actions</h4>
          <div className="controls-grid">
            <button 
              className="control-btn end-voting-btn" 
              onClick={() => { onEndVoting(); onClose(); }}
              aria-label="End current voting"
            >
              <span className="btn-icon">🗳️</span>
              <span className="btn-label">End Voting</span>
              <span className="btn-hint">Close the current vote</span>
            </button>
            <button 
              className="control-btn view-results-btn" 
              onClick={onViewResults}
              aria-label="View voting results"
            >
              <span className="btn-icon">📊</span>
              <span className="btn-label">View Results</span>
              <span className="btn-hint">See current tallies</span>
            </button>
          </div>
        </div>

        <div className="controls-section">
          <h4>Motion Management</h4>
          <button 
            className="control-btn new-motion-btn full-width" 
            onClick={() => { onStartNewMotion(); onClose(); }}
            aria-label="Create new motion"
          >
            <span className="btn-icon">➕</span>
            <span className="btn-label">Create New Motion</span>
            <span className="btn-hint">Start a new motion for voting</span>
          </button>
        </div>

        <div className="controls-section">
          <h4>Chair Assignment</h4>
          <div className="chair-assignment">
            <div className="assignment-row">
              <select 
                id="chair-select"
                className="chair-select"
                value={selectedChair} 
                onChange={(e) => setSelectedChair(e.target.value)}
                aria-label="Select new presiding officer"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.role === 'chair' ? '(current chair)' : ''}
                  </option>
                ))}
              </select>
              <button 
                className="assign-btn"
                onClick={handleAssignChair}
                disabled={!selectedChair}
                aria-label="Assign selected member as chair"
              >
                Assign
              </button>
            </div>
            <p className="assignment-hint">Transfer presiding officer role to another member</p>
          </div>
        </div>

        <div className="controls-modal-footer">
          <button className="close-btn" onClick={onClose}>
            Close Controls
          </button>
        </div>
      </div>
    </div>
  )
}

export default ControlsModal
