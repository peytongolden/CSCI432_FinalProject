import { useState, useMemo } from 'react'
import './DiscussionPanel.css'

function DiscussionPanel({ 
  generalDiscussion = [],
  motionDiscussion = [], 
  motionTitle = null,
  onAddComment, 
  currentUser, 
  motionStatus, 
  hasActiveMotion = false 
}) {
  const [comment, setComment] = useState('')
  const [stance, setStance] = useState('neutral')

  // Safely handle discussion arrays
  const safeGeneralDiscussion = Array.isArray(generalDiscussion) ? generalDiscussion : []
  const safeMotionDiscussion = Array.isArray(motionDiscussion) ? motionDiscussion : []
  
  // Merge and sort all discussions chronologically with delimiters
  const mergedDiscussion = useMemo(() => {
    const items = []
    
    // Add general discussion items
    safeGeneralDiscussion.forEach(item => {
      if (item) {
        items.push({
          ...item,
          type: 'general',
          timestamp: new Date(item.timestamp || 0)
        })
      }
    })
    
    // Add motion discussion items
    safeMotionDiscussion.forEach(item => {
      if (item) {
        items.push({
          ...item,
          type: 'motion',
          timestamp: new Date(item.timestamp || 0)
        })
      }
    })
    
    // Sort chronologically
    items.sort((a, b) => a.timestamp - b.timestamp)
    
    // Add delimiters when switching between general and motion discussion
    const withDelimiters = []
    let lastType = null
    
    items.forEach((item, idx) => {
      if (item.type !== lastType) {
        // Add delimiter
        withDelimiters.push({
          type: 'delimiter',
          discussionType: item.type,
          motionTitle: item.type === 'motion' ? motionTitle : null,
          key: `delimiter-${idx}-${item.type}`
        })
        lastType = item.type
      }
      withDelimiters.push(item)
    })
    
    return withDelimiters
  }, [safeGeneralDiscussion, safeMotionDiscussion, motionTitle])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    if (!currentUser || !currentUser.id) {
      console.warn('[Discussion] Cannot submit comment - user not identified')
      return
    }

    // Pass isGeneral flag - if there's an active motion in voting, it's motion-specific
    // otherwise it's general discussion
    const isGeneral = !hasActiveMotion || motionStatus !== 'voting'
    onAddComment(comment.trim(), isGeneral ? null : stance, isGeneral)
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
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Group motion comments by stance for summary (only for active motion)
  const proComments = safeMotionDiscussion.filter(d => d && d.stance === 'pro')
  const conComments = safeMotionDiscussion.filter(d => d && d.stance === 'con')
  const neutralComments = safeMotionDiscussion.filter(d => d && (d.stance === 'neutral' || !d.stance))

  // Determine if we should show stance selector
  const showStanceSelector = hasActiveMotion && motionStatus === 'voting'

  return (
    <div className="discussion-panel">
      <div className="discussion-header">
        <h3>Committee Discussion</h3>
        {hasActiveMotion && motionStatus === 'voting' && (
          <div className="stance-summary">
            <span className="summary-item pro">👍 {proComments.length}</span>
            <span className="summary-item con">👎 {conComments.length}</span>
            <span className="summary-item neutral">💬 {neutralComments.length}</span>
          </div>
        )}
      </div>

      <div className="discussion-messages">
        {mergedDiscussion.length === 0 ? (
          <div className="no-discussion">
            No comments yet. Start the conversation!
          </div>
        ) : (
          mergedDiscussion.map((item, idx) => {
            if (!item) return null
            
            // Render delimiter
            if (item.type === 'delimiter') {
              return (
                <div key={item.key || `delimiter-${idx}`} className="discussion-delimiter">
                  <div className="delimiter-line"></div>
                  <div className="delimiter-text">
                    {item.discussionType === 'motion' ? (
                      <>📋 Motion: {item.motionTitle || 'Untitled Motion'}</>
                    ) : (
                      <>💬 General Committee Discussion</>
                    )}
                  </div>
                  <div className="delimiter-line"></div>
                </div>
              )
            }
            
            // Render discussion item
            return (
              <div 
                key={item._id || idx} 
                className={`discussion-item ${getStanceClass(item.stance)} ${item.type === 'general' ? 'general-comment' : ''}`}
              >
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

      <form className="discussion-form" onSubmit={handleSubmit}>
        {showStanceSelector && (
          <div className="stance-selector">
            <label>Your stance on this motion:</label>
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
            placeholder={
              showStanceSelector 
                ? "Share your thoughts on this motion..." 
                : "Share your thoughts with the committee..."
            }
            className="comment-input"
          />
          <button type="submit" className="submit-comment-btn" disabled={!comment.trim()}>
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

export default DiscussionPanel
