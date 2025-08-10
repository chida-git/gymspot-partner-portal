import React from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children }){
  const { token } = useAuth()
  const location = useLocation()
  const [sp] = useSearchParams()
  if (!token) {
    const qs = new URLSearchParams({ redirect: location.pathname + location.search, gym_id: sp.get('gym_id') || '' }).toString()
    return <Navigate to={`/login?${qs}`} replace />
  }
  return children
}
