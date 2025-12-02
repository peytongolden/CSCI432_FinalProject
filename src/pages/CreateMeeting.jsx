import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateJoinMeeting.css';
import './FormStyles.css';

function CreateMeeting() {
  const [groups, setGroups] = useState([])
  const [selectedGroups, setSelectedGroups] = useState([])
  const [loadingGroups, setLoadingGroups] = useState(false)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoadingGroups(true)
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/user/me', { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
            if (res.ok) {
              const data = await res.json()
              if (mounted && data && data.user && Array.isArray(data.user.groups)) {
                setGroups(data.user.groups)
                setSelectedGroups(data.user.groups.length ? [data.user.groups[0].id] : [])
            setLoadingGroups(false)
            return
          }
        }
      } catch (err) {}

      try {
        const raw = localStorage.getItem('userInfo')
        if (raw) {
          const u = JSON.parse(raw)
          if (u && Array.isArray(u.groups) && u.groups.length) {
            if (mounted) {
              setGroups(u.groups)
              setSelectedGroups(u.groups.length ? [u.groups[0].id] : [])
            }
          }
        }
      } catch (err) {}

      setLoadingGroups(false)
    }

    load()
    return () => { mounted = false }
  }, [])
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target)
    const meetingName = form.get('meetingName')
    const meetingDate = form.get('meetingDate')
    const meetingTime = form.get('meetingTime')
    const description = form.get('description')
    // Create a persistent meeting record on the server
    const groupsToOpen = Array.isArray(selectedGroups) ? selectedGroups : []
    console.log('Create meeting requested', { meetingName, meetingDate, meetingTime, description, groupIds: groupsToOpen })

    try {
      const token = localStorage.getItem('token')
      const datetime = meetingDate && meetingTime ? `${meetingDate}T${meetingTime}` : (meetingDate || null)
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name: meetingName, datetime, description, committeeIds: groupsToOpen })
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        console.error('Create meeting failed', errBody)
        alert('Failed to create meeting: ' + (errBody?.message || res.statusText))
        return
      }

      const data = await res.json()
      const meetingId = data.meetingId ? data.meetingId : data.meeting?._id
      const meetingCode = data.code

      // navigate into meeting page with the new meeting id
      if (meetingId) navigate(`/meeting?meetingId=${meetingId}${meetingCode ? `&code=${meetingCode}` : ''}`)
      else navigate('/meeting')
    } catch (err) {
      console.error('Create meeting failed', err)
      alert('Unexpected network error when creating meeting')
    }
  };

  return (
    <div className="container">
      <h1 className="title">Create New Meeting</h1>
      <div className="committees-section">
        {loadingGroups ? (
          <div className="committees-loading">Loading your committees…</div>
        ) : (
          <>
            <div className="committees-header">
              <h3 className="committees-title">Your committees</h3>
            </div>
            {groups.length > 0 ? (
              <div className="committees-controls">
                <select className="committees-select" multiple value={selectedGroups} onChange={(e) => setSelectedGroups(Array.from(e.target.selectedOptions).map(o => o.value))}>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <div className="committees-meta">{groups.length} committee(s)</div>
              </div>
            ) : (
              <div className="committees-empty">You are not a member of any committees yet.</div>
            )}
          </>
        )}
      </div>
      
      <form className="form-container" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="meetingName">Meeting Name</label>
          <input
            type="text"
            id="meetingName"
            name="meetingName"
            required
            placeholder="Enter meeting name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="meetingDate">Date</label>
          <input
            type="date"
            id="meetingDate"
            name="meetingDate"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="meetingTime">Time</label>
          <input
            type="time"
            id="meetingTime"
            name="meetingTime"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description (Optional)</label>
          <textarea
            id="description"
            name="description"
            placeholder="Enter meeting description"
            rows="4"
          />
        </div>

        <div className="form-buttons">
          <button type="button" className="btn" onClick={() => window.history.back()}>
            Back
          </button>
          <button type="submit" className="btn primary">
            Create Meeting
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateMeeting;