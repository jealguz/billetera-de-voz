import CryptoJS from 'crypto-js';
import { Debt, NewDebt, Payment, Client } from '../types';

const DEBTS_KEY = 'wallet-voice-debts';
const PAYMENTS_KEY = 'wallet-voice-payments';
const CLIENTS_KEY = 'wallet-voice-clients';

// Clave de encriptación (en producción, usar una más segura o derivada)
const ENCRYPTION_KEY = 'wallet-voice-key-2024';

const encrypt = (data: string): string => {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

const decrypt = (data: string): string => {
  const bytes = CryptoJS.AES.decrypt(data, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Función helper para disparar eventos de actualización
const triggerUpdate = () => {
  window.dispatchEvent(new CustomEvent('debtsUpdated'));
  window.dispatchEvent(new CustomEvent('clientsUpdated'));
};

// Función helper para normalizar nombres (quitar acentos, lowercase)
const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, '');
};

export const storageService = {
  // ===== DEUDAS =====
  getDebts(): Debt[] {
    try {
      const encryptedDebts = localStorage.getItem(DEBTS_KEY);
      if (!encryptedDebts) return [];
      const decrypted = decrypt(encryptedDebts);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error al leer deudas:', error);
      return [];
    }
  },

  saveDebts(debts: Debt[]): void {
    try {
      const encrypted = encrypt(JSON.stringify(debts));
      localStorage.setItem(DEBTS_KEY, encrypted);
      triggerUpdate();
    } catch (error) {
      console.error('Error al guardar deudas:', error);
    }
  },

  addDebt(newDebt: NewDebt): Debt {
    const debts = this.getDebts();
    
    console.log('🔍 Buscando deudas existentes para:', newDebt.person);
    
    // Buscar deuda PENDIENTE del mismo cliente y tipo
    const existingPendingDebt = debts.find(d => 
      d.person.toLowerCase() === newDebt.person.toLowerCase() &&
      d.type === newDebt.type &&
      d.status === 'pending'
    );
    
    if (existingPendingDebt) {
      console.log('📝 Encontrada deuda pendiente existente, consolidando...');
      
      // Consolidar: sumar montos
      existingPendingDebt.amount += newDebt.amount;
      if (newDebt.description) {
        existingPendingDebt.description = existingPendingDebt.description 
          ? `${existingPendingDebt.description}; ${newDebt.description}`
          : newDebt.description;
      }
      existingPendingDebt.updatedAt = new Date();
      
      this.saveDebts(debts);
      return existingPendingDebt;
    }
    
    // Crear nueva deuda
    const debt: Debt = {
      id: crypto.randomUUID(),
      ...newDebt,
      status: newDebt.status || 'pending',
      paidAmount: newDebt.paidAmount || 0,
      date: newDebt.date || new Date(),
      dueDate: newDebt.dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    debts.push(debt);
    this.saveDebts(debts);
    
    // Si es deuda de cliente, actualizar o crear cliente
    if (debt.type === 'owed') {
      this.updateClientAfterDebtAddition(debt.person, debt.amount);
    }
    
    return debt;
  },

  updateDebt(id: string, updates: Partial<Debt>): boolean {
    const debts = this.getDebts();
    const debtIndex = debts.findIndex(d => d.id === id);
    
    if (debtIndex === -1) return false;
    
    debts[debtIndex] = { ...debts[debtIndex], ...updates, updatedAt: new Date() };
    this.saveDebts(debts);
    return true;
  },

  deleteDebt(id: string): boolean {
    const debts = this.getDebts();
    const debt = debts.find(d => d.id === id);
    const newDebts = debts.filter(d => d.id !== id);
    
    if (newDebts.length === debts.length) return false;
    
    // Si es deuda de cliente eliminada, actualizar cliente
    if (debt?.type === 'owed') {
      this.updateClientAfterDebtDeletion(debt.person);
    }
    
    this.saveDebts(newDebts);
    return true;
  },

  getDebt(id: string): Debt | null {
    const debts = this.getDebts();
    return debts.find(d => d.id === id) || null;
  },

  getDebtPayments(debtId: string): Payment[] {
    const payments = this.getPayments();
    return payments.filter(p => p.debtId === debtId);
  },

  // ===== PAGOS =====
  getPayments(): Payment[] {
    try {
      const encryptedPayments = localStorage.getItem(PAYMENTS_KEY);
      if (!encryptedPayments) return [];
      const decrypted = decrypt(encryptedPayments);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error al leer pagos:', error);
      return [];
    }
  },

  savePayments(payments: Payment[]): void {
    try {
      const encrypted = encrypt(JSON.stringify(payments));
      localStorage.setItem(PAYMENTS_KEY, encrypted);
      triggerUpdate();
    } catch (error) {
      console.error('Error al guardar pagos:', error);
    }
  },

  addPayment(debtId: string, amount: number, note?: string): Payment {
    const payments = this.getPayments();
    const newPayment: Payment = {
      id: crypto.randomUUID(),
      debtId,
      amount,
      date: new Date(),
      note,
    };
    
    payments.push(newPayment);
    this.savePayments(payments);
    
    // Actualizar el estado de la deuda
    const debt = this.getDebt(debtId);
    if (debt) {
      const newPaidAmount = (debt.paidAmount || 0) + amount;
      const status = newPaidAmount >= debt.amount ? 'paid' : 
                    newPaidAmount > 0 ? 'partial' : 'pending';
      
      this.updateDebt(debtId, {
        paidAmount: newPaidAmount,
        status,
      });
      
      triggerUpdate();
    }
    
    return newPayment;
  },

  // ===== CLIENTES =====
  getClients(): Client[] {
    try {
      const encryptedClients = localStorage.getItem(CLIENTS_KEY);
      if (!encryptedClients) return [];
      const decrypted = decrypt(encryptedClients);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error al leer clientes:', error);
      return [];
    }
  },

  saveClients(clients: Client[]): void {
    try {
      const encrypted = encrypt(JSON.stringify(clients));
      localStorage.setItem(CLIENTS_KEY, encrypted);
      triggerUpdate();
    } catch (error) {
      console.error('Error al guardar clientes:', error);
    }
  },

  addClient(client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Client {
    const clients = this.getClients();
    
    const newClient: Client = {
      id: crypto.randomUUID(),
      ...client,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    clients.push(newClient);
    this.saveClients(clients);
    return newClient;
  },

  findOrCreateClient(name: string): Client {
    const clients = this.getClients();
    let client = clients.find(c => 
      normalizeName(c.name) === normalizeName(name)
    );
    
    if (!client) {
      client = this.addClient({
        name,
        totalDebt: 0,
        totalPaid: 0,
      });
    }
    
    return client;
  },

  updateClientAfterDebtAddition(clientName: string, amount: number): void {
    const clients = this.getClients();
    const client = clients.find(c => 
      normalizeName(c.name) === normalizeName(clientName)
    );
    
    if (client) {
      client.totalDebt += amount;
      client.lastTransaction = new Date();
      client.updatedAt = new Date();
      this.saveClients(clients);
    }
  },

  updateClientAfterDebtDeletion(clientName: string): void {
    const clients = this.getClients();
    const client = clients.find(c => 
      normalizeName(c.name) === normalizeName(clientName)
    );
    
    if (client) {
      // Recalcular totalDebt basado en deudas activas
      const debts = this.getDebts();
      const activeDebts = debts.filter(d => 
        d.type === 'owed' && 
        d.status !== 'paid' &&
        normalizeName(d.person) === normalizeName(clientName)
      );
      
      client.totalDebt = activeDebts.reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);
      client.updatedAt = new Date();
      this.saveClients(clients);
    }
  },

  // ===== RESUMENES =====
  getSummary(): { totalOwed: number; totalOwing: number; netBalance: number; pendingCount: number; paidCount: number } {
    const debts = this.getDebts();
    const totalOwed = debts.filter(d => d.type === 'owed' && d.status !== 'paid').reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);
    const totalOwing = debts.filter(d => d.type === 'owing' && d.status !== 'paid').reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);
    const pendingCount = debts.filter(d => d.status === 'pending').length;
    const paidCount = debts.filter(d => d.status === 'paid').length;
    
    return {
      totalOwed,
      totalOwing,
      netBalance: totalOwed - totalOwing,
      pendingCount,
      paidCount,
    };
  },

  getClientSummary(clientName: string): any {
    const debts = this.getDebts();
    const clientDebts = debts.filter(d => d.person.toLowerCase() === clientName.toLowerCase());
    const totalDebt = clientDebts.filter(d => d.type === 'owed').reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);
    const totalPaid = clientDebts.filter(d => d.type === 'owed').reduce((sum, d) => sum + (d.paidAmount || 0), 0);
    
    return {
      clientName,
      totalDebt,
      totalPaid,
      pendingDebts: clientDebts.filter(d => d.status === 'pending').length,
      paidDebts: clientDebts.filter(d => d.status === 'paid').length,
      lastPayment: clientDebts
        .filter(d => d.paidAmount && d.paidAmount > 0)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]?.updatedAt || null,
      lastDebt: clientDebts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt || null,
    };
  },

  getBusinessSummary(): any {
    const clients = this.getClients();
    const debts = this.getDebts();
    
    return {
      totalClients: clients.length,
      clientsWithDebt: clients.filter(c => c.totalDebt > 0).length,
      totalOwed: debts.filter(d => d.type === 'owed').reduce((sum, d) => sum + d.amount, 0),
      activeClients: clients.filter(c => c.lastTransaction && new Date(c.lastTransaction) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
      recentClients: clients.slice(-5),
    };
  },

  // ===== RESET =====
  resetDebts(): void {
    localStorage.removeItem(DEBTS_KEY);
    localStorage.removeItem(PAYMENTS_KEY);
    triggerUpdate();
  },

  resetPayments(): void {
    const debts = this.getDebts();
    
    // Reset paidAmount en todas las deudas
    debts.forEach(debt => {
      debt.paidAmount = 0;
      debt.status = 'pending';
      debt.updatedAt = new Date();
    });
    
    this.saveDebts(debts);
    this.savePayments([]);
    triggerUpdate();
  },

  resetAll(): void {
    localStorage.removeItem(DEBTS_KEY);
    localStorage.removeItem(PAYMENTS_KEY);
    localStorage.removeItem(CLIENTS_KEY);
    triggerUpdate();
  },

  // ===== ESTADISTICAS =====
  getStats(): any {
    const debts = this.getDebts();
    const payments = this.getPayments();
    const clients = this.getClients();
    
    return {
      debtsCount: debts.length,
      paymentsCount: payments.length,
      clientsCount: clients.length,
      dbSize: 'localStorage (~5MB)',
      allDebts: debts,
    };
  },

  // ===== CONSOLIDACION =====
  consolidateDebts(): { consolidated: number; message: string } {
    const debts = this.getDebts();
    const consolidatedDebts: { [key: string]: Debt } = {};
    let consolidatedCount = 0;
    
    debts.forEach(debt => {
      const key = `${normalizeName(debt.person)}-${debt.type}`;
      
      if (consolidatedDebts[key]) {
        // Consolidar
        consolidatedDebts[key].amount += debt.amount;
        consolidatedDebts[key].paidAmount = (consolidatedDebts[key].paidAmount || 0) + (debt.paidAmount || 0);
        consolidatedDebts[key].description = consolidatedDebts[key].description 
          ? `${consolidatedDebts[key].description}; ${debt.description || ''}`
          : debt.description || '';
        consolidatedCount++;
      } else {
        consolidatedDebts[key] = { ...debt };
      }
    });
    
    const newDebts = Object.values(consolidatedDebts);
    this.saveDebts(newDebts);
    
    return {
      consolidated: consolidatedCount,
      message: consolidatedCount > 0 ? `Consolidé ${consolidatedCount} deudas duplicadas` : 'No había deudas duplicadas',
    };
  },

  // ===== EXPORT/IMPORT =====
  exportData(): any {
    return {
      debts: this.getDebts(),
      payments: this.getPayments(),
      clients: this.getClients(),
    };
  },

  importData(data: any): void {
    if (data.debts) this.saveDebts(data.debts);
    if (data.payments) this.savePayments(data.payments);
    if (data.clients) this.saveClients(data.clients);
    triggerUpdate();
  },
};