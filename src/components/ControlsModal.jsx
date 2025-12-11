import './ControlsModal.css'
import { useState } from 'react'

function ControlsModal({ onClose, onEndVoting, onStartNewMotion, onViewResults, members = [], presidingOfficerId = null, onAssignChair }) {
  const [selected, setSelected] = useState(presidingOfficerId || (members[0] && members[0].id) || '')
  return (
    <div className="controls-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Chair Controls</h3>
        <button onClick={onEndVoting}>End Voting</button>
        <button onClick={onStartNewMotion}>New Motion</button>
        <button onClick={onViewResults}>View Results</button>
        <div style={{ marginTop: '0.5rem' }}>
          <label htmlFor="assign-chair-select">Assign Presiding Officer</label>
          <select id="assign-chair-select" value={selected} onChange={(e) => setSelected(e.target.value)}>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name} {m.role === 'chair' ? '(current)' : ''}</option>
            ))}
          </select>
          <button style={{ marginLeft: '0.5rem' }} onClick={() => onAssignChair && onAssignChair(selected)}>Assign Chair</button>
        </div>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

export default ControlsModal

