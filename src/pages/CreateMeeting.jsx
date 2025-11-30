import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenManager } from '../utils/tokenManager';
import './CreateJoinMeeting.css';
import './FormStyles.css';

function CreateMeeting() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = e.target;
    const name = form.meetingName.value.trim();
    const date = form.meetingDate.value || null;
    const time = form.meetingTime.value || null;
    const description = form.description.value || null;

    const token = tokenManager.getToken();
    if (!token) {
      setError('Not authenticated. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, date, time, description })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create meeting');

      navigate('/meeting', { state: { meeting: data.meeting } });
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="title">Create New Meeting</h1>
      
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

        {error && <div style={{ color: '#c92a2a', marginBottom: '20px', padding: '10px', backgroundColor: '#ffe0e0', borderRadius: '5px' }}>{error}</div>}

        <div className="form-buttons">
          <button type="button" className="btn" onClick={() => window.history.back()} disabled={loading}>
            Back
          </button>
          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Meeting'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateMeeting;