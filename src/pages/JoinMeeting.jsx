import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenManager } from '../utils/tokenManager';
import './CreateJoinMeeting.css';
import './FormStyles.css';

function JoinMeeting() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const form = e.target;
    const code = form.meetingCode.value.trim();
    const name = form.displayName.value.trim();

    const token = tokenManager.getToken();
    if (!token) {
      setError('Not authenticated. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/api/meetings/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code, name })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join meeting');

      navigate('/meeting', { state: { meeting: data.meeting } });
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="title">Join Meeting</h1>
      
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

        {error && <div style={{ color: '#c92a2a', marginBottom: '20px', padding: '10px', backgroundColor: '#ffe0e0', borderRadius: '5px' }}>{error}</div>}

        <div className="form-buttons">
          <button type="button" className="btn" onClick={() => window.history.back()} disabled={loading}>
            Back
          </button>
          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? 'Joining...' : 'Join Meeting'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default JoinMeeting;