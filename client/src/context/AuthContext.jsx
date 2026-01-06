import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('auth')
    if (saved) {
      const { token, user } = JSON.parse(saved)
      setToken(token)
      setUser(user)
    }
  }, [])

  const login = (token, user) => {
    setToken(token)
    setUser(user)
    localStorage.setItem('auth', JSON.stringify({ token, user }))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('auth')
  }

  const value = useMemo(() => ({ token, user, isAuthenticated: !!token, login, logout }), [token, user])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
