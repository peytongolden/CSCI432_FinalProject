import './ControlsModal.css'
import { useState } from 'react'

function ControlsModal({ onClose, onEndVoting, onStartNewMotion, onViewResults, onStartVoting, members = [], presidingOfficerId = null, onAssignChair, motions = [] }) {
  const [selected, setSelected] = useState(presidingOfficerId || (members[0] && members[0].id) || '')
  const [selectedMotion, setSelectedMotion] = useState(motions[0]?.id || '')
  return (
    <div className="controls-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Chair Controls</h3>
        <button onClick={onEndVoting}>End Voting</button>
        <button onClick={onStartNewMotion}>New Motion</button>
        <div style={{ marginTop: '0.5rem' }}>
          <label htmlFor="start-voting-select">Start Voting On</label>
          <select id="start-voting-select" value={selectedMotion} onChange={(e) => setSelectedMotion(e.target.value)}>
            {(motions || []).filter(m => m.status === 'proposed').map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
          <button style={{ marginLeft: '0.5rem' }} onClick={() => onStartVoting && onStartVoting(selectedMotion)} disabled={!selectedMotion || motions.find(m => m.id === selectedMotion)?.status === 'voting'}>Start</button>
        </div>
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

