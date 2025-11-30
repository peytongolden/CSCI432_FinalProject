// Utility to manage JWT token storage and retrieval
const TOKEN_KEY = 'authToken'
const USER_KEY = 'authUser'

export const tokenManager = {
  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token)
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY)
  },

  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  getUser() {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch (e) {
      return null
    }
  },

  removeUser() {
    localStorage.removeItem(USER_KEY)
  },

  isAuthenticated() {
    return !!this.getToken()
  },

  logout() {
    this.removeToken()
    this.removeUser()
  },

  // Helper to get auth headers
  getAuthHeaders() {
    const token = this.getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
}

export default tokenManager
