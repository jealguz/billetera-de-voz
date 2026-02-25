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
      console.log('📦 getDebts - Datos recibidos:', JSON.stringify(debts, null, 2));
      return debts.map((d: any) => {
        const originalAmount = Number(d.amount);
        const paidAmount = Number(d.paidamount || d.paidAmount || 0);
        const isPaid = d.ispaid || d.isPaid || paidAmount >= Math.abs(originalAmount);
        
        return {
          id: d.id,
          type: originalAmount < 0 ? 'owing' : 'owed',
          person: d.clientname || d.clientName || d.client?.name || 'Cliente',
          clientName: d.clientname || d.clientName || d.client?.name || 'Cliente sin nombre',
          clientId: d.clientid || d.clientId,
          amount: originalAmount, // Monto original
          pendingAmount: Math.abs(originalAmount) - paidAmount, // Monto pendiente
          paidAmount: paidAmount,
          description: d.description || '',
          date: d.createdat || d.createdAt,
          status: isPaid ? 'paid' : 'pending',
          createdAt: d.createdat || d.createdAt,
          updatedAt: d.updatedat || d.updatedAt
        };
      });
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
      const [clients, debts] = await Promise.all([
        api.getClients(),
        api.getDebts()
      ]);
      
      console.log('📊 getBusinessSummary - clientes:', clients.length, 'deudas:', debts.length);
      
      // Calcular totales correctamente usando paidAmount del backend
      let totalOwedToMe = 0;
      let totalIOwe = 0;
      let pendingDebts = 0;
      let paidDebts = 0;
      
      const clientTotals: { [key: number]: { name: string, total: number, paid: number } } = {};
      
      debts.forEach((d: any) => {
        const originalAmount = Number(d.amount);
        const paidAmount = Number(d.paidamount || d.paidAmount || 0);
        const pendingAmount = Math.abs(originalAmount) - paidAmount;
        
        if (originalAmount > 0) {
          // Me deben
          totalOwedToMe += pendingAmount;
          if (pendingAmount > 0) pendingDebts++;
        } else if (originalAmount < 0) {
          // Yo debo
          totalIOwe += pendingAmount;
          if (pendingAmount > 0) pendingDebts++;
        }
        
        if (paidAmount > 0 && pendingAmount <= 0) {
          paidDebts++;
        }
        
        // Acumular por cliente
        const clientId = d.clientid || d.clientId;
        if (!clientTotals[clientId]) {
          clientTotals[clientId] = { name: d.clientname || 'Cliente', total: 0, paid: 0 };
        }
        clientTotals[clientId].total += Math.abs(originalAmount);
        clientTotals[clientId].paid += paidAmount;
      });
      
      // Top deudores
      const topDebtors = Object.entries(clientTotals)
        .map(([clientId, data]) => ({
          clientId: Number(clientId),
          clientName: data.name,
          totalDebt: data.total - data.paid,
          totalPaid: data.paid
        }))
        .filter(c => c.totalDebt > 0)
        .sort((a, b) => b.totalDebt - a.totalDebt)
        .slice(0, 10);
      
      console.log('📊 getBusinessSummary - totalOwedToMe:', totalOwedToMe, 'totalIOwe:', totalIOwe);
      
      return {
        totalClients: clients.length,
        activeClients: clients.length,
        clientsWithDebt: pendingDebts,
        totalOwed: totalOwedToMe,
        totalOwing: totalIOwe,
        topDebtors,
        pendingDebts,
        paidDebts
      };
    } catch (error) {
      console.error('Error getting business summary:', error);
      return { totalClients: 0, activeClients: 0, clientsWithDebt: 0, totalOwed: 0, totalOwing: 0, topDebtors: [], pendingDebts: 0, paidDebts: 0 };
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

  async getClientByName(name: string, checkDebts: boolean = false) {
    try {
      const clients = await api.getClients();
      const debts = await api.getDebts();
      console.log('🔍 getClientByName - clientes obtenidos:', JSON.stringify(clients, null, 2));
      
      // Normalizar el nombre de búsqueda (quitar tildes)
      const normalizedSearch = name.toLowerCase().trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      
      console.log('🔍 getClientByName - nombre buscado (normalizado):', normalizedSearch);
      console.log('🔍 getClientByName - checkDebts:', checkDebts);
      
      // Si el nombre tiene más de una palabra, buscar coincidencia exacta primero
      const searchWords = normalizedSearch.split(' ').filter(w => w.length > 1);
      
      // Buscar coincidencia exacta (prioridad más alta)
      let client = clients.find((c: any) => {
        const clientName = c.name.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return clientName === normalizedSearch;
      });
      
      if (client) {
        console.log('🔍 getClientByName - coincidencia exacta encontrada:', client.name);
        return {
          id: client.id,
          name: client.name,
          phone: client.phone,
          email: client.email
        };
      }
      
      // Si checkDebts es true, priorizar clientes que tienen deudas pendientes
      if (checkDebts) {
        const clientsWithDebts = clients.filter((c: any) => 
          debts.some((d: any) => d.clientid === c.id && !d.ispaid)
        );
        console.log('🔍 getClientByName - clientes con deudas:', clientsWithDebts.map((c: any) => c.name));
        
        // Buscar primero en clientes con deudas
        client = clientsWithDebts.find((c: any) => {
          const clientName = c.name.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          
          if (searchWords.length > 1) {
            // Si hay múltiples palabras, buscar que TODAS estén presentes
            return searchWords.every(word => clientName.includes(word));
          } else {
            // Si hay una sola palabra, buscar que contenga esa palabra
            return clientName.includes(normalizedSearch);
          }
        });
        
        if (client) {
          console.log('🔍 getClientByName - cliente con deuda encontrado:', client.name);
          return {
            id: client.id,
            name: client.name,
            phone: client.phone,
            email: client.email
          };
        }
      }
      
      // Si no hay coincidencia exacta o no se usaron deudas, buscar por todas las palabras del nombre
      client = clients.find((c: any) => {
        const clientName = c.name.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        
        // Verificar que TODAS las palabras del nombre buscado estén en el nombre del cliente
        if (searchWords.length > 1) {
          return searchWords.every(word => clientName.includes(word));
        } else {
          return clientName.includes(normalizedSearch);
        }
      });

      console.log('🔍 getClientByName - cliente encontrado (búsqueda por palabras):', client);

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

  async checkClientExists(name: string, checkDebts: boolean = false): Promise<boolean> {
    const client = await this.getClientByName(name, checkDebts);
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
    try {
      await api.deleteDebt(Number(id));
      console.log('✅ Deuda eliminada:', id);
    } catch (error) {
      console.error('Error deleting debt:', error);
      throw error;
    }
  },

  async deleteClient(id: string) {
    try {
      await api.deleteClient(Number(id));
      console.log('✅ Cliente eliminado:', id);
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
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
