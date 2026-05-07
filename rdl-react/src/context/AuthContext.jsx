// src/context/AuthContext.jsx
// Replaces the global _currentMember, _isAdmin, _sessionToken variables.
// Any component can call useAuth() to get the current user.

import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [member,    setMember]    = useState(null)   // logged-in member object
  const [isAdmin,   setIsAdmin]   = useState(false)
  const [sessionToken, setSessionToken] = useState(null)
  const [ready,     setReady]     = useState(false)  // has localStorage been read?

  // Rehydrate session from localStorage on first load
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rdl_session')
      if (saved) {
        const { member, isAdmin, token } = JSON.parse(saved)
        setMember(member || null)
        setIsAdmin(isAdmin || false)
        setSessionToken(token || null)
      }
    } catch {}
    setReady(true)
  }, [])

  function login(member, token) {
    setMember(member)
    setIsAdmin(false)
    setSessionToken(token)
    localStorage.setItem('rdl_session', JSON.stringify({ member, isAdmin: false, token }))
  }

  function loginAdmin() {
    setIsAdmin(true)
    setMember(null)
    localStorage.setItem('rdl_session', JSON.stringify({ isAdmin: true }))
  }

  function logout() {
    setMember(null)
    setIsAdmin(false)
    setSessionToken(null)
    localStorage.removeItem('rdl_session')
  }

  return (
    <AuthContext.Provider value={{ member, isAdmin, sessionToken, ready, login, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
