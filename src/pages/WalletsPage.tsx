import React, { useEffect, useState } from 'react'
import { Wallet, Transaction } from '../types/api'
import { api } from '../services/apiClient'

const WalletsPage: React.FC = () => {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [balance, setBalance] = useState<number>(0)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<Record<number, Transaction[]>>({})
  const [txLoading, setTxLoading] = useState<Record<number, boolean>>({})
  const [txnDraft, setTxnDraft] = useState<{ [walletId: number]: { amount: number; type: string; description: string } }>({})

  const fetchWallets = async () => {
    setLoading(true)
    try {
      const ws = await api.getWallets()
      setWallets(ws)
    } catch (e) {
      console.error('Error fetching wallets', e)
    } finally {
      setLoading(false)
    }
  }

  const loadTxs = async (walletId: number) => {
    setTxLoading(prev => ({ ...prev, [walletId]: true }))
    try {
      const txs = await api.getTransactions(walletId)
      setTransactions(prev => ({ ...prev, [walletId]: txs }))
    } catch (e) {
      console.error('Error fetching transactions', e)
    } finally {
      setTxLoading(prev => ({ ...prev, [walletId]: false }))
    }
  }

  const toggleExpand = (walletId: number) => {
    if (expanded === walletId) {
      setExpanded(null)
    } else {
      setExpanded(walletId)
      if (!transactions[walletId]) {
        loadTxs(walletId)
      }
    }
  }

  const handleTxnDraftChange = (walletId: number, field: string, value: any) => {
    setTxnDraft(prev => {
      const draft = prev[walletId] || { amount: 0, type: 'credit', description: '' }
      return { ...prev, [walletId]: { ...draft, [field]: value } }
    })
  }

  const handleAddTxn = async (walletId: number) => {
    const draft = txnDraft[walletId] || { amount: 0, type: 'credit', description: '' }
    try {
      await api.addTransaction(walletId, Number(draft.amount), draft.type, draft.description)
      await loadTxs(walletId)
      // refresh wallets balances as well
      fetchWallets()
      // clear draft
      setTxnDraft(prev => ({ ...prev, [walletId]: { amount: 0, type: 'credit', description: '' } }))
    } catch (e) {
      console.error('Error adding transaction', e)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const w = await api.createWallet(name, type, balance)
      setWallets(prev => [...prev, w])
      setName('')
      setType('')
      setBalance(0)
    } catch (err) {
      console.error('Error creating wallet', err)
    }
  }

  useEffect(() => {
    fetchWallets()
  }, [])

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-semibold">Tus Billeteras</h2>

      <form onSubmit={handleCreate} className="space-y-2 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input className="w-full border rounded p-2" value={name} onChange={e => setName(e.target.value)} placeholder="Nueva billetera" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo</label>
            <input className="w-full border rounded p-2" value={type} onChange={e => setType(e.target.value)} placeholder="personal / negocio" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Balance</label>
            <input type="number" className="w-full border rounded p-2" value={balance} onChange={e => setBalance(parseFloat(e.target.value) || 0)} />
          </div>
        </div>
        <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">Crear Billetera</button>
      </form>

      {loading ? (
        <div>Cargando billeteras...</div>
      ) : (
        <div className="space-y-4">
          {wallets.map(w => (
            <div key={w.id} className="border rounded p-3">
              <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleExpand(w.id)}>
                <div>
                  <div className="font-semibold">{w.name}</div>
                  <div className="text-sm text-gray-600">{w.type ?? 'Sin tipo'}</div>
                </div>
                <div className="font-semibold">{w.balance.toFixed(2)}</div>
              </div>
              {expanded === w.id && (
                <div className="mt-3 ml-4">
                  <div className="mb-2 font-semibold">Transacciones</div>
                  {txLoading[w.id] ? (
                    <div>Cargando transacciones...</div>
                  ) : (
                    <ul className="space-y-2">
                      {transactions[w.id]?.length ? (
                        transactions[w.id]!.map(tx => (
                          <li key={tx.id} className="border rounded p-2 flex justify-between">
                            <span className="text-sm text-gray-700">{tx.description ?? tx.type}</span>
                            <span className={tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                              {tx.amount.toFixed(2)}
                            </span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-gray-500">Sin transacciones</li>
                      )}
                    </ul>
                  )}

                  <form className="mt-3 flex gap-2 items-end" onSubmit={(e) => { e.preventDefault(); handleAddTxn(w.id); }}>
                    <input
                      className="border rounded p-2 w-24"
                      type="number"
                      placeholder="Monto"
                      value={txnDraft[w.id]?.amount ?? 0}
                      onChange={(e) => handleTxnDraftChange(w.id, 'amount', e.target.value)}
                    />
                    <select
                      className="border rounded p-2"
                      value={txnDraft[w.id]?.type ?? 'credit'}
                      onChange={(e) => handleTxnDraftChange(w.id, 'type', e.target.value)}
                    >
                      <option value="credit">Credito</option>
                      <option value="debit">Débito</option>
                    </select>
                    <input
                      className="border rounded p-2 flex-1"
                      placeholder="Descripción"
                      value={txnDraft[w.id]?.description ?? ''}
                      onChange={(e) => handleTxnDraftChange(w.id, 'description', e.target.value)}
                    />
                    <button className="px-3 py-2 bg-blue-600 text-white rounded">Añadir</button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default WalletsPage
