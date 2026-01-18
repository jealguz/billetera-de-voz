import { Client, ClientSummary, Debt } from '../types';

const CLIENTS_KEY = 'wallet-voice-business-clients';
const BUSINESS_DEBTS_KEY = 'wallet-voice-business-debts';

export const clientService = {
  // ===== CLIENTES =====
  getClients(): Client[] {
    try {
      const clients = localStorage.getItem(CLIENTS_KEY);
      return clients ? JSON.parse(clients) : [];
    } catch (error) {
      console.error('Error al leer clientes:', error);
      return [];
    }
  },

  saveClients(clients: Client[]): void {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  },

  findOrCreateClient(name: string, phone?: string): Client {
    const clients = this.getClients();
    const existingClient = clients.find(c => 
      c.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    
    if (existingClient) {
      return existingClient;
    }
    
    const newClient: Client = {
      id: crypto.randomUUID(),
      name: name.trim(),
      phone,
      totalDebt: 0,
      totalPaid: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    clients.push(newClient);
    this.saveClients(clients);
    return newClient;
  },

  updateClient(clientId: string, updates: Partial<Client>): void {
    const clients = this.getClients();
    const index = clients.findIndex(c => c.id === clientId);
    
    if (index !== -1) {
      clients[index] = {
        ...clients[index],
        ...updates,
        updatedAt: new Date(),
      };
      this.saveClients(clients);
    }
  },

  // ===== DEUDAS DE CLIENTES =====
  getBusinessDebts(): Debt[] {
    try {
      const debts = localStorage.getItem(BUSINESS_DEBTS_KEY);
      return debts ? JSON.parse(debts) : [];
    } catch (error) {
      console.error('Error al leer deudas de negocio:', error);
      return [];
    }
  },

  saveBusinessDebts(debts: Debt[]): void {
    localStorage.setItem(BUSINESS_DEBTS_KEY, JSON.stringify(debts));
  },

  // Registrar deuda de cliente
  addClientDebt(clientName: string, amount: number, description?: string): { client: Client; debt: Debt } {
    // 1. Encontrar o crear cliente
    const client = this.findOrCreateClient(clientName);
    
    // 2. Crear deuda
    const debts = this.getBusinessDebts();
    const newDebt: Debt = {
      id: crypto.randomUUID(),
      type: 'owed',
      person: client.name,
      amount,
      description: description || 'Deuda de cliente',
      date: new Date(),
      status: 'pending',
      paidAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    debts.push(newDebt);
    this.saveBusinessDebts(debts);
    
    // 3. Actualizar cliente
    this.updateClient(client.id, {
      totalDebt: client.totalDebt + amount,
      lastTransaction: new Date(),
    });
    
    return { client, debt: newDebt };
  },

  // Registrar pago de cliente
  addClientPayment(clientName: string, amount: number, notes?: string): boolean {
    const clients = this.getClients();
    const client = clients.find(c => 
      c.name.toLowerCase().includes(clientName.toLowerCase())
    );
    
    if (!client) {
      console.error('Cliente no encontrado:', clientName);
      return false;
    }
    
    // Buscar deudas pendientes del cliente
    const debts = this.getBusinessDebts();
    const clientDebts = debts.filter(d => 
      d.person.toLowerCase() === client.name.toLowerCase() && 
      d.status !== 'paid'
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Más antigua primero
    
    if (clientDebts.length === 0) {
      console.error('El cliente no tiene deudas pendientes');
      return false;
    }
    
    // Aplicar pago a la deuda más antigua
    let remainingPayment = amount;
    
    for (const debt of clientDebts) {
      if (remainingPayment <= 0) break;
      
      const remainingDebt = debt.amount - (debt.paidAmount || 0);
      const paymentAmount = Math.min(remainingPayment, remainingDebt);
      
      // Actualizar deuda
      const debtIndex = debts.findIndex(d => d.id === debt.id);
      if (debtIndex !== -1) {
        const newPaidAmount = (debts[debtIndex].paidAmount || 0) + paymentAmount;
        debts[debtIndex] = {
          ...debts[debtIndex],
          paidAmount: newPaidAmount,
          status: newPaidAmount >= debts[debtIndex].amount ? 'paid' : 'partial',
          updatedAt: new Date(),
        };
        
        // Registrar pago
        if (!debts[debtIndex].payments) {
          debts[debtIndex].payments = [];
        }
        debts[debtIndex].payments!.push({
          id: crypto.randomUUID(),
          debtId: debt.id,
          amount: paymentAmount,
          date: new Date(),
          note: notes || `Pago de ${clientName}`,
        });
        
        remainingPayment -= paymentAmount;
      }
    }
    
    this.saveBusinessDebts(debts);
    
    // Actualizar cliente
    this.updateClient(client.id, {
      totalDebt: Math.max(0, client.totalDebt - amount),
      totalPaid: client.totalPaid + amount,
      lastTransaction: new Date(),
    });
    
    return true;
  },

  // ===== CONSULTAS =====
  getClientSummary(clientName: string): ClientSummary | null {
    const clients = this.getClients();
    const client = clients.find(c => 
      c.name.toLowerCase().includes(clientName.toLowerCase())
    );
    
    if (!client) return null;
    
    const debts = this.getBusinessDebts();
    const clientDebts = debts.filter(d => 
      d.person.toLowerCase() === client.name.toLowerCase()
    );
    
    const pendingDebts = clientDebts.filter(d => d.status !== 'paid').length;
    const paidDebts = clientDebts.filter(d => d.status === 'paid').length;
    
    const lastPayment = clientDebts
      .flatMap(d => d.payments || [])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    const lastDebt = clientDebts
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    
    const totalDebt = clientDebts
      .filter(d => d.status !== 'paid')
      .reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);
    
    const totalPaid = clientDebts
      .filter(d => d.status === 'paid')
      .reduce((sum, d) => sum + (d.paidAmount || 0), 0);
    
    return {
      clientId: client.id,
      clientName: client.name,
      totalDebt,
      totalPaid,
      pendingDebts,
      paidDebts,
      lastPayment: lastPayment?.date,
      lastDebt: lastDebt?.date,
    };
  },

  getBusinessSummary() {
    const clients = this.getClients();
    const debts = this.getBusinessDebts();
    
    const totalOwed = debts
      .filter(d => d.status !== 'paid')
      .reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);
    
    const clientsWithDebt = clients.filter(c => c.totalDebt > 0).length;
    
    // Top 5 deudores
    const topDebtors = clients
      .filter(c => c.totalDebt > 0)
      .sort((a, b) => b.totalDebt - a.totalDebt)
      .slice(0, 5)
      .map(client => ({
        clientId: client.id,
        clientName: client.name,
        totalDebt: client.totalDebt,
        totalPaid: client.totalPaid,
        pendingDebts: debts.filter(d => 
          d.person === client.name && d.status !== 'paid'
        ).length,
        paidDebts: debts.filter(d => 
          d.person === client.name && d.status === 'paid'
        ).length,
      }));
    
    return {
      totalClients: clients.length,
      activeClients: clients.filter(c => 
        c.lastTransaction && 
        new Date(c.lastTransaction).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
      ).length,
      clientsWithDebt,
      totalOwed,
      topDebtors,
    };
  },

  // ===== BÚSQUEDA =====
  searchClients(query: string): Client[] {
    const clients = this.getClients();
    const lowerQuery = query.toLowerCase();
    
    return clients.filter(client =>
      client.name.toLowerCase().includes(lowerQuery) ||
      client.phone?.toLowerCase().includes(lowerQuery) ||
      client.email?.toLowerCase().includes(lowerQuery)
    );
  },

  getClientDebts(clientId: string): Debt[] {
    const client = this.getClients().find(c => c.id === clientId);
    if (!client) return [];
    
    return this.getBusinessDebts().filter(d => 
      d.person.toLowerCase() === client.name.toLowerCase()
    );
  },
};