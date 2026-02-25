// Simple API client to talk to the backend (PostgreSQL) using fetch
import { Wallet, Transaction, AuthResponse, Client, Debt, Summary, AdminUser } from '../types/api'

let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://wallet-voice-backend.onrender.com';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
  }
  
  console.log('🌐 API Request:', path, 'Token:', authToken ? 'presente' : 'NO PRESENTE');
  
  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    credentials: 'include',
    ...options
  })
  
  console.log('🌐 API Response:', path, 'Status:', res.status);
  
  if (!res.ok) {
    // Try to extract error message
    let msg = 'Network error'
    try {
      const data = await res.json()
      msg = data?.error || res.statusText
    } catch {
      msg = res.statusText
    }
    console.error('🌐 API Error:', msg);
    throw new Error(msg)
  }
  // If there is no content, return undefined
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return (await res.json()) as T
  }
  return undefined as unknown as T
}

export const api = {
  register: async (email: string, password: string): Promise<AuthResponse> => {
    return await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  },
  login: async (email: string, password: string): Promise<AuthResponse> => {
    return await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  },
  getWallets: async (): Promise<Wallet[]> => {
    const res = await request<{ wallets: Wallet[] }>('/wallets')
    return res.wallets
  },
  createWallet: async (name: string, type?: string, balance?: number): Promise<Wallet> => {
    const res = await request<{ wallet: Wallet }>('/wallets', {
      method: 'POST',
      body: JSON.stringify({ name, type, balance })
    })
    return res.wallet
  },
  getTransactions: async (walletId: number): Promise<Transaction[]> => {
    const res = await request<{ transactions: Transaction[] }>(`/wallets/${walletId}/transactions`)
    return res.transactions
  },
  addTransaction: async (walletId: number, amount: number, tpe: string, description?: string): Promise<{ wallet: Wallet }> => {
    const res = await request<{ wallet: Wallet }>(`/wallets/${walletId}/transactions`, {
      method: 'POST',
      body: JSON.stringify({ amount, type: tpe, description })
    })
    return { wallet: res.wallet }
  },
  // Clients
  getClients: async (): Promise<Client[]> => {
    const res = await request<{ clients: Client[] }>('/clients')
    return res.clients
  },
  createClient: async (name: string, phone?: string, email?: string, address?: string, notes?: string): Promise<Client> => {
    const res = await request<{ client: Client }>('/clients', {
      method: 'POST',
      body: JSON.stringify({ name, phone, email, address, notes })
    })
    return res.client
  },
  // Debts
  getDebts: async (): Promise<Debt[]> => {
    const res = await request<{ debts: Debt[] }>('/debts')
    return res.debts
  },
  createDebt: async (clientId: number, amount: number, description?: string, dueDate?: string): Promise<Debt> => {
    const res = await request<{ debt: Debt }>('/debts', {
      method: 'POST',
      body: JSON.stringify({ clientId, amount, description, dueDate })
    })
    return res.debt
  },
  payDebt: async (debtId: number, amount: number, notes?: string): Promise<{ success: boolean; paidAmount: number }> => {
    return await request<{ success: boolean; paidAmount: number }>(`/debts/${debtId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ amount, notes })
    })
  },
  deleteDebt: async (debtId: number): Promise<{ success: boolean }> => {
    return await request<{ success: boolean }>(`/debts/${debtId}`, {
      method: 'DELETE'
    })
  },
  deleteClient: async (clientId: number): Promise<{ success: boolean }> => {
    return await request<{ success: boolean }>(`/clients/${clientId}`, {
      method: 'DELETE'
    })
  },
  // Summary
  getSummary: async (): Promise<Summary> => {
    const res = await request<{ summary: Summary }>('/summary')
    return res.summary
  },
  // Users (admin)
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    return await request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    })
  },
  getAllUsers: async (): Promise<AdminUser[]> => {
    const res = await request<{ users: AdminUser[] }>('/users')
    return res.users
  },
  getUserCount: async (): Promise<number> => {
    const res = await request<{ count: number }>('/users/count')
    return res.count
  }
}

export default api
