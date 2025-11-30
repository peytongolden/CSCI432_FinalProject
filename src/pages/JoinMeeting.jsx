import React from 'react';
import './CreateJoinMeeting.css';
import './FormStyles.css';

function JoinMeeting() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
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