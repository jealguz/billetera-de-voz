export interface Debt {
  id: string;
  type: 'owed' | 'owing'; // 'owed' = te deben, 'owing' = tú debes
  person: string;
  amount: number;
  description?: string;
  date: Date;
  dueDate?: Date;
  status: 'pending' | 'paid' | 'partial';
  paidAmount?: number;
  payments?: Payment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NLPResult {
  intent: 
    | 'add_debt' 
    | 'query_debt' 
    | 'show_summary' 
    | 'add_payment' 
    | 'create_client'              // ✅ Asegúrate que existe
    | 'query_payment_history'      // ✅ NUEVO
    | 'query_last_payment'         // ✅ NUEVO
    | 'query_overdue_debts'        // ✅ NUEVO
    | 'unknown';
  entities: {
    person?: string;
    amount?: number;
    type?: 'owed' | 'owing';
    description?: string;
  };
  confidence: number;
}

// Tipo para crear una nueva deuda (sin campos auto-generados)
export interface NewDebt {
  type: 'owed' | 'owing';
  person: string;
  amount: number;
  description?: string;
  date: Date;
  dueDate?: Date;
  // status y paidAmount son opcionales al crear
  status?: 'pending' | 'paid' | 'partial';
  paidAmount?: number;
}

export interface Payment {
  id: string;
  debtId: string;
  amount: number;
  date: Date;
  note?: string;
}

export interface VoiceCommand {
  id: string;
  text: string;
  type: 'query' | 'action' | 'add';
  recognized: boolean;
  response?: string;
  timestamp: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Summary {
  totalOwed: number;
  totalOwing: number;
  netBalance: number;
  pendingCount: number;
  paidCount: number;
  recentActivity: Debt[];
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  totalDebt: number;
  totalPaid: number;
  lastTransaction?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  totalDebt: number;
  totalPaid: number;
  lastTransaction?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Agrega esto a tu interface Client:
export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  totalDebt: number;
  totalPaid: number;
  createdAt: Date;
  updatedAt: Date;
  lastTransaction?: Date;
  
  // ✅ NUEVO: Campos para manejar nombres informales
  nameComponents?: {
    baseName: string;         // "Jose"
    descriptor?: string;      // "supermercado", "vecino", etc.
    type: 'business' | 'relationship' | 'occupation' | 'location' | 'formal';
    identifier: string;       // "jose_supermercado"
  };
}

// Y en Debt interface, agrega:
export interface Debt {
  id: string;
  type: 'owed' | 'owing';
  person: string;
  clientId?: string; // ✅ NUEVO: Referencia al cliente
  amount: number;
  description?: string;
  date: Date;
  status: 'pending' | 'partial' | 'paid';
  paidAmount?: number;
  payments?: Payment[];
  createdAt: Date;
  updatedAt: Date;
}

// Extender Summary para incluir clientes
export interface BusinessSummary {
  totalClients: number;
  clientsWithDebt: number;
  totalOwed: number;
  activeClients: number;
  recentClients: Client[];
}

export interface ClientDebt extends Debt {
  clientId: string;
  clientName: string;
}

export interface ClientSummary {
  clientId: string;
      clientName: string;
      totalDebt: number;
      totalPaid: number;
      pendingDebts: number;
      paidDebts: number;
      lastPayment: Date | null;
      lastDebt: Date | null;
}

// Nuevos tipos de comandos de voz para negocio
export interface BusinessVoiceCommand extends VoiceCommand {
  clientId?: string;
  amount?: number;
}