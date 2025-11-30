import { Navigate } from 'react-router-dom'
import { tokenManager } from '../utils/tokenManager'

function ProtectedRoute({ element }) {
  return tokenManager.isAuthenticated() ? element : <Navigate to="/login" replace />
}

export default ProtectedRoute
