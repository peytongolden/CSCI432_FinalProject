import { useState } from 'react'
import './NewMotionModal.css'

function NewMotionModal({ onClose, onCreateMotion, currentUser, motions = [] }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [motionType, setMotionType] = useState('main')
  const [parentMotionId, setParentMotionId] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [error, setError] = useState('')

  // Motion type definitions
  const motionTypes = [
    { value: 'main', label: 'Main Motion', threshold: 'Simple Majority (>50%)', description: 'Standard motion for regular decisions' },
    { value: 'procedural', label: 'Procedural Motion', threshold: '2/3 Supermajority (≥67%)', description: 'Change meeting rules or procedures' },
    { value: 'amendment', label: 'Amendment', threshold: 'Simple Majority (>50%)', description: 'Modify an existing motion' },
    { value: 'postpone', label: 'Postpone Motion', threshold: 'Simple Majority (>50%)', description: 'Delay decision to a later time' },
    { value: 'special', label: 'Special Motion', threshold: 'Unanimous (100%)', description: 'Requires all members to agree' },
    { value: 'overturn', label: 'Overturn Previous Decision', threshold: '2/3 Supermajority (≥67%)', description: 'Reverse a past motion' }
  ]

  const selectedMotionType = motionTypes.find(t => t.value === motionType)

  // Get available parent motions (for amendments/overturn)
  const availableParentMotions = motions.filter(m => 
    (motionType === 'amendment' && m.status === 'voting') ||
    (motionType === 'overturn' && m.status === 'completed' && m.result === 'passed')
  )

  const handleSubmit = async (e) => {
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

    if ((motionType === 'amendment' || motionType === 'overturn') && !parentMotionId) {
      setError(`Please select a motion to ${motionType === 'amendment' ? 'amend' : 'overturn'}`)
      return
    }

    const motionData = {
      title: title.trim(),
      description: description.trim(),
      type: motionType,
      isAnonymous,
      ...(parentMotionId && { parentMotionId })
    }

    const ok = await onCreateMotion(motionData)

    if (ok) {
      onClose()
    } else {
      setError('Failed to create motion — please try again or contact the chair')
    }
  }

  return (
    <div className="motion-modal-overlay" onClick={onClose}>
      <div className="motion-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Create New Motion</h3>
        
        <form onSubmit={handleSubmit}>
          {/* Motion Type Selector */}
          <div className="form-group">
            <label htmlFor="motion-type">Motion Type</label>
            <select
              id="motion-type"
              value={motionType}
              onChange={(e) => {
                setMotionType(e.target.value)
                setParentMotionId('') // Reset parent when type changes
              }}
              className="motion-type-select"
            >
              {motionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {selectedMotionType && (
              <div className="motion-type-info">
                <p className="type-description">{selectedMotionType.description}</p>
                <p className="type-threshold">
                  <strong>Required:</strong> {selectedMotionType.threshold}
                </p>
              </div>
            )}
          </div>

          {/* Parent Motion Selector (for amendments/overturn) */}
          {(motionType === 'amendment' || motionType === 'overturn') && (
            <div className="form-group">
              <label htmlFor="parent-motion">
                {motionType === 'amendment' ? 'Motion to Amend' : 'Motion to Overturn'}
              </label>
              {availableParentMotions.length > 0 ? (
                <select
                  id="parent-motion"
                  value={parentMotionId}
                  onChange={(e) => setParentMotionId(e.target.value)}
                  className="parent-motion-select"
                >
                  <option value="">Select a motion...</option>
                  {availableParentMotions.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="no-parent-motions">
                  No {motionType === 'amendment' ? 'active' : 'passed'} motions available to {motionType === 'amendment' ? 'amend' : 'overturn'}.
                </p>
              )}
            </div>
          )}

          {/* Motion Title */}
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

          {/* Description */}
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

          {/* Anonymous Voting Option */}
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <span>Anonymous Voting (votes will not show member names)</span>
            </label>
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

