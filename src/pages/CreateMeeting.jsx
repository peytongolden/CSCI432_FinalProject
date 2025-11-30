import React from 'react';
import './CreateJoinMeeting.css';
import './FormStyles.css';

function CreateMeeting() {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
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