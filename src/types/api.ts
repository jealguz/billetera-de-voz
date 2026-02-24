export type User = {
  id: number;
  email: string;
};

export type Wallet = {
  id: number;
  userId: number;
  name: string;
  type?: string;
  balance: number;
};

export type Transaction = {
  id: number;
  walletId: number;
  date?: string;
  amount: number;
  type: string;
  description?: string;
};

export type Client = {
  id: number;
  userId: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt?: string;
};

export type Debt = {
  id: number;
  userId: number;
  clientId: number;
  clientName?: string;
  amount: number;
  description?: string;
  dueDate?: string;
  isPaid: boolean;
  createdAt?: string;
};

export type Summary = {
  totalClients: number;
  totalOwed: number;
  pendingDebts: number;
};

export type AuthResponse = {
  token: string;
  user: User;
};
