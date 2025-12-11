import React, { useEffect, useRef } from 'react'
import './ConfirmLeaveModal.css'

function ConfirmLeaveModal({ isOpen, onConfirm, onCancel, destination, committeeName, title: customTitle, message: customMessage, confirmLabel = 'Leave', cancelLabel = 'Stay' }) {
  if (!isOpen) return null
  const stayRef = useRef(null)
  useEffect(() => {
    if (isOpen && stayRef.current) stayRef.current.focus()
  }, [isOpen])

  const destName = (destination || '').replace('/', '') || 'home'
  const defaultTitle = committeeName ? `You are currently in the meeting "${committeeName}".` : `You are currently in a meeting.`
  const title = customTitle || 'Leaving Meeting'
  const message = customMessage || `${defaultTitle} Leaving will remove you from the meeting. Do you want to leave and go to ${destName}?`

  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <h2 id="confirm-modal-title">{title}</h2>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          <button ref={stayRef} className="btn cancel" onClick={onCancel}>{cancelLabel}</button>
          <button className="btn leave" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmLeaveModal
