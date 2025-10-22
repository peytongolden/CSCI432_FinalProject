import './ControlsModal.css'

function ControlsModal({ onClose, onEndVoting, onStartNewMotion, onViewResults }) {
  return (
    <div className="controls-modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Chair Controls</h3>
        <button onClick={onEndVoting}>End Voting</button>
        <button onClick={onStartNewMotion}>New Motion</button>
        <button onClick={onViewResults}>View Results</button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

export default ControlsModal

