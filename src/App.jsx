import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Registration from './pages/Registration'
import AccountDetails from './pages/AccountDetails'
import CreateJoinMeeting from './pages/CreateJoinMeeting'
import Meeting from './pages/Meeting'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/account" element={<AccountDetails />} />
        <Route path="/lobby" element={<CreateJoinMeeting />} />
        <Route path="/meeting" element={<Meeting />} />
      </Routes>
    </Router>
  )
}

export default App

