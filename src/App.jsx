import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Registration from './pages/Registration'
import AccountDetails from './pages/AccountDetails'
import CreateJoinMeeting from './pages/CreateJoinMeeting'
import CreateMeeting from './pages/CreateMeeting'
import JoinMeeting from './pages/JoinMeeting'
import Meeting from './pages/Meeting'
import Help from './pages/Help'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/account" element={<AccountDetails />} />
        <Route path="/lobby" element={<CreateJoinMeeting />} />
        <Route path="/create-meeting" element={<CreateMeeting />} />
        <Route path="/join-meeting" element={<JoinMeeting />} />
        <Route path="/meeting" element={<Meeting />} />
        <Route path="/help" element={<Help />} />
      </Routes>
    </Router>
  )
}

export default App

