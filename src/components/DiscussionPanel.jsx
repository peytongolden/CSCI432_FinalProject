import { useState } from 'react'
import './DiscussionPanel.css'

function DiscussionPanel({ discussion, onAddComment, currentUser, motionStatus, hasActiveMotion = true }) {
  const [comment, setComment] = useState('')
  const [stance, setStance] = useState('neutral')

  // Safely handle discussion array - ensure it's always an array
  const safeDiscussion = Array.isArray(discussion) ? discussion : []
  
  // Allow discussion when there's an active motion (voting or completed) - always allow comments
  // Only close if explicitly needed (e.g., meeting ended)
  const canComment = hasActiveMotion

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    if (!currentUser || !currentUser.id) {
      console.warn('[Discussion] Cannot submit comment - user not identified')
      return
    }

    onAddComment(comment.trim(), stance)
    setComment('')
    setStance('neutral')
  }

  const getStanceIcon = (s) => {
    switch (s) {
      case 'pro': return '👍'
      case 'con': return '👎'
      default: return '💬'
    }
  }

  const getStanceClass = (s) => {
    switch (s) {
      case 'pro': return 'stance-pro'
      case 'con': return 'stance-con'
      default: return 'stance-neutral'
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Group comments by stance for summary - use safe discussion array
  const proComments = safeDiscussion.filter(d => d && d.stance === 'pro')
  const conComments = safeDiscussion.filter(d => d && d.stance === 'con')
  const neutralComments = safeDiscussion.filter(d => d && (d.stance === 'neutral' || !d.stance))

  return (
    <div className="discussion-panel">
      <div className="discussion-header">
        <h3>{hasActiveMotion ? 'Motion Discussion' : 'General Discussion'}</h3>
        {hasActiveMotion && (
          <div className="stance-summary">
            <span className="summary-item pro">👍 {proComments.length}</span>
            <span className="summary-item con">👎 {conComments.length}</span>
            <span className="summary-item neutral">💬 {neutralComments.length}</span>
          </div>
        )}
      </div>

      <div className="discussion-messages">
        {!hasActiveMotion ? (
          <div className="no-discussion">
            No motion is currently active. Create a new motion to start the discussion.
          </div>
        ) : safeDiscussion.length === 0 ? (
          <div className="no-discussion">
            No comments yet. Be the first to share your thoughts!
          </div>
        ) : (
          safeDiscussion.map((item, idx) => {
            // Safely handle potentially malformed discussion items
            if (!item) return null
            return (
              <div key={item._id || idx} className={`discussion-item ${getStanceClass(item.stance)}`}>
                <div className="discussion-item-header">
                  <span className="stance-icon">{getStanceIcon(item.stance)}</span>
                  <span className="participant-name">{item.participantName || 'Anonymous'}</span>
                  <span className="timestamp">{formatTime(item.timestamp)}</span>
                </div>
                <div className="discussion-item-content">
                  {item.comment || ''}
                </div>
              </div>
            )
          })
        )}
      </div>

      {canComment && (
        <form className="discussion-form" onSubmit={handleSubmit}>
          {hasActiveMotion && motionStatus === 'voting' && (
            <div className="stance-selector">
              <label>Your stance:</label>
              <div className="stance-buttons">
                <button
                  type="button"
                  className={`stance-btn pro ${stance === 'pro' ? 'active' : ''}`}
                  onClick={() => setStance('pro')}
                >
                  👍 Pro
                </button>
                <button
                  type="button"
                  className={`stance-btn neutral ${stance === 'neutral' ? 'active' : ''}`}
                  onClick={() => setStance('neutral')}
                >
                  💬 Neutral
                </button>
                <button
                  type="button"
                  className={`stance-btn con ${stance === 'con' ? 'active' : ''}`}
                  onClick={() => setStance('con')}
                >
                  👎 Con
                </button>
              </div>
            </div>
          )}

          <div className="comment-input-row">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={hasActiveMotion ? "Share your thoughts on this motion..." : "Share your thoughts with the committee..."}
              className="comment-input"
            />
            <button type="submit" className="submit-comment-btn" disabled={!comment.trim()}>
              Send
            </button>
          </div>
        </form>
      )}

      {!canComment && (
        <div className="discussion-closed">
          {hasActiveMotion ? 'Discussion is closed for this motion.' : 'Start a motion to enable discussion.'}
        </div>
      )}
    </div>
  )
}

export default DiscussionPanel

