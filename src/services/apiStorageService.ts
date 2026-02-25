// Compatibility layer - uses API instead of local storage
import api from './apiClient';

export const storageService = {
  async getClients() {
    try {
      return await api.getClients();
    } catch (error) {
      console.error('Error getting clients:', error);
      return [];
    }
  },

  async getDebts() {
    try {
      const debts = await api.getDebts();
      return debts.map((d: any) => ({
        id: d.id,
        type: 'owed',
        person: d.clientName || 'Cliente',
        clientId: d.clientId,
        amount: Number(d.amount),
        paidAmount: Number(d.paidAmount || 0),
        description: d.description || '',
        date: d.createdAt,
        status: d.isPaid ? 'paid' : 'pending',
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
      }));
    } catch (error) {
      console.error('Error getting debts:', error);
      return [];
    }
  },

  async getSummary() {
    try {
      const summary = await api.getSummary();
      return {
        totalOwed: summary.totalOwed || 0,
        totalOwing: 0,
        netBalance: summary.totalOwed || 0,
        pendingCount: summary.pendingDebts || 0,
        paidCount: 0,
        recentActivity: []
      };
    } catch (error) {
      console.error('Error getting summary:', error);
      return { totalOwed: 0, totalOwing: 0, netBalance: 0, pendingCount: 0, paidCount: 0, recentActivity: [] };
    }
  },

  async getBusinessSummary() {
    try {
      const [summary, clients, debts] = await Promise.all([
        api.getSummary(),
        api.getClients(),
        api.getDebts()
      ]);
      
      const paidDebts = debts.filter((d: any) => d.isPaid);
      
      return {
        totalClients: clients.length,
        activeClients: clients.length,
        clientsWithDebt: summary.pendingDebts || 0,
        totalOwed: summary.totalOwed || 0,
        topDebtors: [],
        pendingDebts: summary.pendingDebts || 0,
        paidDebts: paidDebts.length
      };
    } catch (error) {
      console.error('Error getting business summary:', error);
      return { totalClients: 0, activeClients: 0, clientsWithDebt: 0, totalOwed: 0, topDebtors: [], pendingDebts: 0, paidDebts: 0 };
    }
  },

  async findOrCreateClient(name: string) {
    try {
      const clients = await api.getClients();
      const normalizedName = name.toLowerCase().trim();
      
      let client = clients.find((c: any) => 
        c.name.toLowerCase() === normalizedName ||
        c.name.toLowerCase().includes(normalizedName)
      );

      if (!client) {
        client = await api.createClient(name);
      }

      return {
        id: String(client.id),
        name: client.name,
        totalDebt: 0,
        totalPaid: 0
      };
    } catch (error) {
      console.error('Error finding/creating client:', error);
      throw error;
    }
  },

  async getClientByName(name: string) {
    try {
      const clients = await api.getClients();
      const normalizedName = name.toLowerCase().trim();
      
      const client = clients.find((c: any) => 
        c.name.toLowerCase() === normalizedName ||
        c.name.toLowerCase().includes(normalizedName)
      );

      if (!client) return null;

      return {
        id: client.id,
        name: client.name,
        phone: client.phone,
        email: client.email
      };
    } catch (error) {
      console.error('Error getting client by name:', error);
      return null;
    }
  },

  async checkClientExists(name: string): Promise<boolean> {
    const client = await this.getClientByName(name);
    return client !== null;
  },

  async addDebt(data: any) {
    try {
      const clients = await api.getClients();
      let client = clients.find((c: any) => 
        c.name.toLowerCase() === data.person.toLowerCase()
      );
      
      if (!client) {
        client = await api.createClient(data.person);
      }
      
      const debt = await api.createDebt(client.id, data.amount, data.description);
      return {
        id: String(debt.id),
        type: data.type || 'owed',
        person: data.person,
        clientId: client.id,
        amount: data.amount,
        description: data.description,
        date: new Date(),
        status: 'pending',
        paidAmount: 0
      };
    } catch (error) {
      console.error('Error adding debt:', error);
      throw error;
    }
  },

  async addPayment(debtId: string, amount: number, note: string) {
    try {
      return await api.payDebt(Number(debtId), amount, note);
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
  },

  async deleteDebt(id: string) {
    console.log('Delete debt not implemented via API:', id);
  },

  async updateDebt(id: string, data: any) {
    console.log('Update debt not fully implemented via API:', id, data);
  },

  async getClientSummary(personName: string) {
    try {
      const [clients, debts,] = await Promise.all([
        api.getClients(),
        api.getDebts(),
        api.getSummary()
      ]);
      
      const client = clients.find((c: any) => 
        c.name.toLowerCase().includes(personName.toLowerCase())
      );
      
      if (!client) return null;
      
      const clientDebts = debts.filter((d: any) => d.clientId === client.id);
      const pendingDebts = clientDebts.filter((d: any) => !d.isPaid);
      const paidDebts = clientDebts.filter((d: any) => d.isPaid);
      
      const totalDebt = pendingDebts.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
      const totalPaid = paidDebts.reduce((sum: number, d: any) => sum + Number(d.paidAmount || 0), 0);
      
      return {
        clientId: client.id,
        clientName: client.name,
        totalDebt,
        totalPaid,
        pendingDebts: pendingDebts.length,
        paidDebts: paidDebts.length,
        lastPayment: null,
        lastDebt: null
      };
    } catch (error) {
      console.error('Error getting client summary:', error);
      return null;
    }
  },

  async getPaymentHistory(personName: string) {
    try {
      const [clients, debts] = await Promise.all([
        api.getClients(),
        api.getDebts()
      ]);
      
      const client = clients.find((c: any) => 
        c.name.toLowerCase().includes(personName.toLowerCase())
      );
      
      if (!client) return [];
      
      const clientDebts = debts.filter((d: any) => d.clientId === client.id && d.isPaid);
      
      return clientDebts.map((d: any) => ({
        debtId: d.id,
        amount: Number(d.paidAmount || d.amount),
        date: d.updatedAt || d.createdAt,
        note: d.description || 'Pago registrado',
        description: d.description || ''
      }));
    } catch (error) {
      console.error('Error getting payment history:', error);
      return [];
    }
  },

  async getDaysSinceLastPayment(personName: string) {
    try {
      const payments = await this.getPaymentHistory(personName);
      if (payments.length === 0) return null;
      
      const lastPayment = payments.sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      
      const lastDate = new Date(lastPayment.date);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  },

  async getLastPayment(personName: string) {
    try {
      const payments = await this.getPaymentHistory(personName);
      if (payments.length === 0) return null;
      
      const lastPayment = payments.sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
      
      return {
        ...lastPayment,
        debtDescription: lastPayment.description || ''
      };
    } catch {
      return null;
    }
  },

  async getOverdueDebts(days: number) {
    try {
      const debts = await api.getDebts();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return debts.filter((d: any) => {
        if (d.isPaid) return false;
        const debtDate = new Date(d.createdAt);
        return debtDate < cutoffDate;
      }).map((d: any) => ({
        id: d.id,
        person: d.clientName || 'Cliente',
        amount: Number(d.amount),
        paidAmount: 0,
        date: d.createdAt,
        updatedAt: d.updatedAt || d.createdAt,
        daysOverdue: Math.ceil((Date.now() - new Date(d.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
        description: d.description || 'Sin descripción'
      }));
    } catch {
      return [];
    }
  },

  consolidateDebts() {
    return { consolidated: 0 };
  },

  getStats() {
    return { debtsCount: 0, paymentsCount: 0, clientsCount: 0 };
  },

  exportData() {
    return Promise.resolve({ clients: [], debts: [], payments: [] });
  },

  importData(_data: any) {
    return Promise.resolve();
  },

  resetDebts() {
    return Promise.resolve();
  },

  resetPayments() {
    return Promise.resolve();
  },

  resetAll() {
    return Promise.resolve();
  }
};
