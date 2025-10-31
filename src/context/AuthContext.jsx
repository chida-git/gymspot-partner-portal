import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { message } from 'antd'

const AuthContext = createContext(null)

export function AuthProvider({ children }){
  const [token, setToken] = useState(() => localStorage.getItem('pp_token') || '')
  const [partner, setPartner] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pp_partner') || 'null') } catch { return null }
  })

  useEffect(() => { token ? localStorage.setItem('pp_token', token) : localStorage.removeItem('pp_token') }, [token])
  useEffect(() => { partner ? localStorage.setItem('pp_partner', JSON.stringify(partner)) : localStorage.removeItem('pp_partner') }, [partner])

  const value = useMemo(() => ({
    token, setToken, partner, setPartner,
    user: partner, 
    login: (t, p) => { setToken(t); setPartner(p); message.success('Login effettuato') },
    logout: () => { setToken(''); setPartner(null); message.info('Logout') }
  }), [token, partner])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(){ return useContext(AuthContext) }
