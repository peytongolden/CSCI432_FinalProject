import { useState } from 'react'
import './NewMotionModal.css'

function NewMotionModal({ onClose, onCreateMotion, currentUser }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Motion title is required')
      return
    }

    if (!description.trim()) {
      setError('Motion description is required')
      return
    }

    onCreateMotion({
      title: title.trim(),
      description: description.trim()
    })

    onClose()
  }

  return (
    <div className="motion-modal-overlay" onClick={onClose}>
      <div className="motion-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Create New Motion</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="motion-title">Motion Title</label>
            <input
              id="motion-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Motion to Approve Budget Amendment"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="motion-description">Description</label>
            <textarea
              id="motion-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the motion..."
              rows="4"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-buttons">
            <button type="submit" className="primary">
              Create Motion
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewMotionModal

