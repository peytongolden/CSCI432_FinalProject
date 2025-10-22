import { useNavigate } from 'react-router-dom'
import './CreateJoinMeeting.css'
import Navigation from '../components/Navigation'

function CreateJoinMeeting() {
  const navigate = useNavigate()

  const handleCreateMeeting = () => {
    // In a real app, this would create a meeting and navigate to it
    navigate('/meeting')
  }

  const handleJoinMeeting = () => {
    // In a real app, this would show a modal to enter meeting code
    navigate('/meeting')
  }

  return (
    <>
      <Navigation />

      <main className="container">
        <h1 className="title">Robert's Rules of Order App</h1>

        <div className="buttons">
          <button className="btn primary" onClick={handleCreateMeeting}>
            Create Meeting
          </button>
          <button className="btn" onClick={handleJoinMeeting}>
            Join Meeting
          </button>
        </div>
      </main>
    </>
  )
}

export default CreateJoinMeeting

