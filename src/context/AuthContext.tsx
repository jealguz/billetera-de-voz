import React, { createContext, useContext, useState, useEffect } from 'react'
import api, { setAuthToken } from '../services/apiClient'
import { User } from '../types/api'

type AuthState = {
  user: User | null
  token: string | null
}

type AuthContextValue = {
  state: AuthState
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({ user: null, token: null })

  // Optional: persist in sessionStorage for some UX parity; avoid localStorage
  useEffect(() => {
    const t = sessionStorage.getItem('wallet_token')
    const u = sessionStorage.getItem('wallet_user')
    if (t && u) {
      setState({ user: JSON.parse(u), token: t })
      setAuthToken(t)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password).catch((e) => { throw e })
    setState({ user: res.user, token: res.token })
    setAuthToken(res.token)
    sessionStorage.setItem('wallet_token', res.token)
    sessionStorage.setItem('wallet_user', JSON.stringify(res.user))
  }

  const register = async (email: string, password: string) => {
    const res = await api.register(email, password)
    setState({ user: res.user, token: res.token })
    setAuthToken(res.token)
    sessionStorage.setItem('wallet_token', res.token)
    sessionStorage.setItem('wallet_user', JSON.stringify(res.user))
  }

  const logout = () => {
    setState({ user: null, token: null })
    setAuthToken(null)
    sessionStorage.removeItem('wallet_token')
    sessionStorage.removeItem('wallet_user')
  }

  return (
    <AuthContext.Provider value={{ state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
