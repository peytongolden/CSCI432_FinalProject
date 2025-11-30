import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Registration from './pages/Registration'
import AccountDetails from './pages/AccountDetails'
import CreateJoinMeeting from './pages/CreateJoinMeeting'
import CreateMeeting from './pages/CreateMeeting'
import JoinMeeting from './pages/JoinMeeting'
import Meeting from './pages/Meeting'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/account" element={<ProtectedRoute element={<AccountDetails />} />} />
        <Route path="/lobby" element={<ProtectedRoute element={<CreateJoinMeeting />} />} />
        <Route path="/create-meeting" element={<ProtectedRoute element={<CreateMeeting />} />} />
        <Route path="/join-meeting" element={<ProtectedRoute element={<JoinMeeting />} />} />
        <Route path="/meeting" element={<ProtectedRoute element={<Meeting />} />} />
        <Route path="/meeting/:code" element={<ProtectedRoute element={<Meeting />} />} />
      </Routes>
    </Router>
  )
}

export default App

