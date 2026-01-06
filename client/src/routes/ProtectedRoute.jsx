import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ role, children }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" />
  if (role && user?.role !== role) return <Navigate to="/" />
  return children
}
