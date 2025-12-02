import React, { useEffect, useState } from 'react';
import './CreateJoinMeeting.css';
import './FormStyles.css';

function JoinMeeting() {
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState('')
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
          if (mounted && data && data.user) {
            if (Array.isArray(data.user.groups) && data.user.groups.length) {
              setGroups(data.user.groups)
              setSelectedGroup(data.user.groups[0]?.id ?? '')
              setLoadingGroups(false)
              return
            }

            if (Array.isArray(data.user.committee_memberships) && data.user.committee_memberships.length) {
              const ids = data.user.committee_memberships.map(String)
              const fetched = await Promise.all(ids.map(async (id) => {
                try {
                  const r = await fetch(`/api/committee/${encodeURIComponent(id)}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
                  if (!r.ok) return null
                  const committee = await r.json().catch(() => null)
                  if (!committee) return null
                  return { id: String(committee._id || committee._id?.toString?.()), name: committee.CommitteeName || committee.name }
                } catch (err) { return null }
              }))

              const final = fetched.filter(Boolean)
              if (final.length) {
                setGroups(final)
                setSelectedGroup(final[0].id ?? '')
                setLoadingGroups(false)
                return
              }
            }
          }
        }
      } catch (err) {
        // ignore and fallback
      }

      try {
        const raw = localStorage.getItem('userInfo')
        if (raw) {
          const u = JSON.parse(raw)
          if (u) {
            if (Array.isArray(u.groups) && u.groups.length) {
              if (mounted) {
                setGroups(u.groups)
                setSelectedGroup(u.groups[0].id ?? '')
              }
            } else if (Array.isArray(u.committee_memberships) && u.committee_memberships.length) {
              const ids = u.committee_memberships.map(id => String(id))
              const placeholders = ids.map(id => ({ id, name: `Committee ${id.slice(0,6)}` }))
              if (mounted) {
                setGroups(placeholders)
                setSelectedGroup(placeholders[0].id ?? '')
              }
            }
          }
        }
      } catch (err) {}

      setLoadingGroups(false)
    }

    load()
    return () => { mounted = false }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = new FormData(e.target)
    const meetingCode = form.get('meetingCode')
    const displayName = form.get('displayName')
    console.log('Join requested', { meetingCode, displayName, groupId: selectedGroup })

    // Lookup meeting by code and attempt to join
    (async () => {
      try {
        const lookup = await fetch(`/api/meetings/code/${encodeURIComponent(meetingCode)}`)
        if (!lookup.ok) {
          const body = await lookup.json().catch(() => ({}))
          alert('Meeting not found or code invalid: ' + (body.message || lookup.statusText))
          return
        }

        const { meeting } = await lookup.json()
        if (!meeting) { alert('Meeting not found'); return }

        // ensure the selected group (if any) is part of this meeting's committeeIds
        if (selectedGroup) {
          const ids = Array.isArray(meeting.committeeIds) ? meeting.committeeIds.map(i => (i && i.toString) ? i.toString() : String(i)) : []
          if (ids.length && !ids.includes(String(selectedGroup))) {
            if (!confirm('The meeting you provided does not appear to be for the selected committee. Continue joining anyway?')) return
          }
        }

        // request to join
        const joinRes = await fetch(`/api/meetings/${meeting._id || meeting.meetingId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName })
        })

        if (!joinRes.ok) {
          const jb = await joinRes.json().catch(() => ({}))
          alert('Failed to join meeting: ' + (jb.message || joinRes.statusText))
          return
        }

        const joinData = await joinRes.json()
        const participantId = joinData.participantId
        const meetingId = joinData.meetingId || meeting._id

        // Navigate into meeting with meetingId and participant id
        if (meetingId) window.location.href = `/meeting?meetingId=${meetingId}${participantId ? `&participantId=${participantId}` : ''}`
        else alert('Joined — but could not determine meeting location')
      } catch (err) {
        console.error('Join flow failed', err)
        alert('Network error while joining meeting')
      }
    })()
  };

  return (
    <div className="container">
      <h1 className="title">Join Meeting</h1>
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
                <select className="committees-select" value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
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
          <label htmlFor="meetingCode">Meeting Code</label>
          <input
            type="text"
            id="meetingCode"
            name="meetingCode"
            required
            placeholder="Enter meeting code"
          />
        </div>

        <div className="form-group">
          <label htmlFor="displayName">Your Display Name</label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            required
            placeholder="Enter your name"
          />
        </div>

        <div className="form-buttons">
          <button type="button" className="btn" onClick={() => window.history.back()}>
            Back
          </button>
          <button type="submit" className="btn primary">
            Join Meeting
          </button>
        </div>
      </form>
    </div>
  );
}

export default JoinMeeting;