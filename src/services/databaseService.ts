import Dexie, { Table } from 'dexie';
import { Debt, NewDebt, Payment, Client } from '../types';
import CryptoJS from 'crypto-js';

// Tipos para Dexie CON userId (del login por email)
// En el mismo archivo, cerca de las otras interfaces
interface DexieUser {
  id: string;
  name: string;
  lastName: string;
  email: string;
  password: string; // hashed
  voiceData?: string;
  voicePreference?: string;
  createdAt: Date;
  lastLogin?: Date;
  // No necesitas userId aquí porque los usuarios no están asociados a otros usuarios
}


interface DexieDebt extends Omit<Debt, 'id'> {
  id: string;
  userId: string; // ID del usuario logueado
  normalizedPerson: string;
}

interface DexieClient extends Omit<Client, 'id'> {
  id: string;
  userId: string; // ID del usuario logueado
  normalizedName: string;
}

interface DexiePayment extends Omit<Payment, 'id'> {
  id: string;
  userId: string; // ID del usuario logueado
}

class WalletVoiceDatabase extends Dexie {
    users!: Table<DexieUser, string>;
  debts!: Table<DexieDebt, string>;
  clients!: Table<DexieClient, string>;
  payments!: Table<DexiePayment, string>;
  
  constructor() {
    super('WalletVoiceDB');
    
    // Schema VERSION 3 (con userId del login)
    this.version(4).stores({
        users: 'id, email, [id+email]',
      debts: 'id, userId, person, normalizedPerson, type, status, [userId+person]',
      clients: 'id, userId, name, normalizedName, &[userId+normalizedName]',
      payments: 'id, userId, debtId, [userId+debtId]'
    }).upgrade(async (trans) => {
      // Migración V2 → V3: agregar userId a datos existentes
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      const defaultUserId = currentUser?.id || 'guest-user';
      
      console.log('🔄 Migrando datos a userId:', defaultUserId);
      
      await trans.table('debts').toCollection().modify(debt => {
        debt.userId = defaultUserId;
      });
      
      await trans.table('clients').toCollection().modify(client => {
        client.userId = defaultUserId;
      });
      
      await trans.table('payments').toCollection().modify(payment => {
        payment.userId = defaultUserId;
      });
    });
  }
  
  // ============ MÉTODOS CON userId (DEL LOGIN POR EMAIL) ============
  
  // Obtener userId del usuario logueado (de tu userService)
   getCurrentUserId(): string {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
      const userId = currentUser?.id || 'guest-user';
      console.log('👤 Usuario actual ID:', userId);
      return userId;
    } catch {
      return 'guest-user';
    }
  }
  
  // ============ DEUDAS ============
  
  async getDebts(): Promise<Debt[]> {
    try {
      const userId = this.getCurrentUserId();
      const dexieDebts = await this.debts
        .where('userId')
        .equals(userId)
        .toArray();
      
      return dexieDebts.map(debt => ({
        ...debt,
        paidAmount: debt.paidAmount || 0,
        description: debt.description || '',
        dueDate: debt.dueDate,
        createdAt: debt.createdAt || new Date(),
        updatedAt: debt.updatedAt || new Date(),
      }));
    } catch (error) {
      console.error('Error en getDebts:', error);
      return [];
    }
  }
  
  async addDebt(newDebt: NewDebt): Promise<Debt> {
    const userId = this.getCurrentUserId();
    const debtId = crypto.randomUUID();
    const debt: Debt = {
      id: debtId,
      ...newDebt,
      status: newDebt.status || 'pending',
      paidAmount: newDebt.paidAmount || 0,
      date: newDebt.date || new Date(),
      dueDate: newDebt.dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const dexieDebt: DexieDebt = {
      ...debt,
      userId: userId,
      normalizedPerson: this.normalizeName(debt.person)
    };
    
    await this.debts.add(dexieDebt);
    
    if (debt.type === 'owed') {
      await this.updateClientAfterDebtAddition(debt.person, debt.amount);
    }
    
    this.triggerUpdate();
    return debt;
  }
  
  async updateDebt(id: string, updates: Partial<Debt>): Promise<boolean> {
    try {
      // Verificar que la deuda pertenezca al usuario actual
      const debt = await this.debts.get(id);
      if (!debt || debt.userId !== this.getCurrentUserId()) {
        return false;
      }
      
      await this.debts.update(id, {
        ...updates,
        updatedAt: new Date()
      });
      this.triggerUpdate();
      return true;
    } catch {
      return false;
    }
  }
  
  async deleteDebt(id: string): Promise<boolean> {
    try {
      // Verificar que la deuda pertenezca al usuario actual
      const debt = await this.debts.get(id);
      if (!debt || debt.userId !== this.getCurrentUserId()) {
        return false;
      }
      
      await this.debts.delete(id);
      
      if (debt.type === 'owed') {
        await this.updateClientAfterDebtDeletion(debt.person);
      }
      
      this.triggerUpdate();
      return true;
    } catch {
      return false;
    }
  }
  
  async getDebt(id: string): Promise<Debt | null> {
    try {
      const debt = await this.debts.get(id);
      // Verificar que pertenezca al usuario actual
      if (!debt || debt.userId !== this.getCurrentUserId()) {
        return null;
      }
      return debt;
    } catch {
      return null;
    }
  }
  
  // ============ MIGRACIÓN AUTOMÁTICA ============
  
  async autoMigrateFromLocalStorage(): Promise<void> {
    try {
      if (localStorage.getItem('dexie_migrated') === 'true') {
        return;
      }
      
      console.log('🔄 Iniciando migración desde localStorage...');
      
      const oldDebts = this.getFromLocalStorage('wallet-voice-debts');
      const oldClients = this.getFromLocalStorage('wallet-voice-clients');
      const oldPayments = this.getFromLocalStorage('wallet-voice-payments');
      
      const userId = this.getCurrentUserId();
      
      if (oldDebts.length > 0) {
        const dexieDebts = oldDebts.map(debt => ({
          ...debt,
          id: debt.id || crypto.randomUUID(),
          userId: userId,
          normalizedPerson: this.normalizeName(debt.person)
        }));
        await this.debts.bulkAdd(dexieDebts);
      }
      
      if (oldClients.length > 0) {
        const dexieClients = oldClients.map(client => ({
          ...client,
          id: client.id || crypto.randomUUID(),
          userId: userId,
          normalizedName: this.normalizeName(client.name)
        }));
        await this.clients.bulkAdd(dexieClients);
      }
      
      if (oldPayments.length > 0) {
        const dexiePayments = oldPayments.map(payment => ({
          ...payment,
          id: payment.id || crypto.randomUUID(),
          userId: userId
        }));
        await this.payments.bulkAdd(dexiePayments);
      }
      
      localStorage.setItem('dexie_migrated', 'true');
      console.log(`✅ Migración completada para userId: ${userId}`);
      
    } catch (error) {
      console.error('Error en migración automática:', error);
    }
  }
  
  private getFromLocalStorage(key: string): any[] {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return [];
      
      try {
        const bytes = CryptoJS.AES.decrypt(encrypted, 'wallet-voice-key-2024');
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decrypted) || [];
      } catch {
        return JSON.parse(encrypted) || [];
      }
    } catch {
      return [];
    }
  }
  
  // ============ PAGOS ============
  
  async getPayments(): Promise<Payment[]> {
    try {
      const userId = this.getCurrentUserId();
      return await this.payments
        .where('userId')
        .equals(userId)
        .toArray();
    } catch {
      return [];
    }
  }
  
  async addPayment(debtId: string, amount: number, note?: string): Promise<Payment> {
    const userId = this.getCurrentUserId();
    const newPayment: Payment = {
      id: crypto.randomUUID(),
      debtId,
      amount,
      date: new Date(),
      note,
    };
    
    const dexiePayment: DexiePayment = {
      ...newPayment,
      userId: userId
    };
    
    await this.payments.add(dexiePayment);
    
    const debt = await this.getDebt(debtId);
    if (debt) {
      const newPaidAmount = (debt.paidAmount || 0) + amount;
      const status = newPaidAmount >= debt.amount ? 'paid' : 
                    newPaidAmount > 0 ? 'partial' : 'pending';
      
      await this.updateDebt(debtId, {
        paidAmount: newPaidAmount,
        status,
      });
    }
    
    this.triggerUpdate();
    return newPayment;
  }
  
  async getDebtPayments(debtId: string): Promise<Payment[]> {
    const userId = this.getCurrentUserId();
    try {
      const payments = await this.payments
        .where('[userId+debtId]')
        .equals([userId, debtId])
        .toArray();
      return payments;
    } catch {
      return [];
    }
  }
  
  // ============ CLIENTES ============
  
  async getClients(): Promise<Client[]> {
    return new Promise((resolve) => {
      const userId = this.getCurrentUserId();
      
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ Timeout en getClients, retornando vacío');
        resolve([]);
      }, 3000);

      this.clients
        .where('userId')
        .equals(userId)
        .toArray()
        .then(clients => {
          clearTimeout(timeoutId);
          resolve(clients.map(client => ({
            ...client,
            totalDebt: client.totalDebt || 0,
            totalPaid: client.totalPaid || 0,
            createdAt: client.createdAt || new Date(),
            updatedAt: client.updatedAt || new Date(),
          })));
        })
        .catch(error => {
          clearTimeout(timeoutId);
          console.error('Error en getClients:', error);
          resolve([]);
        });
    });
  }
  
  async findOrCreateClient(name: string): Promise<Client> {
    const userId = this.getCurrentUserId();
    const normalizedName = this.normalizeName(name);
    
    try {
      const existing = await this.clients
        .where('[userId+normalizedName]')
        .equals([userId, normalizedName])
        .first();
      
      if (existing) return existing;
      
      const newClient: Client = {
        id: crypto.randomUUID(),
        name,
        totalDebt: 0,
        totalPaid: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const dexieClient: DexieClient = {
        ...newClient,
        userId: userId,
        normalizedName
      };
      
      await this.clients.add(dexieClient);
      return newClient;
      
    } catch (error) {
      console.error('Error en findOrCreateClient:', error);
      return {
        id: crypto.randomUUID(),
        name,
        totalDebt: 0,
        totalPaid: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }
  
  async updateClientAfterDebtAddition(clientName: string, amount: number): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const normalizedName = this.normalizeName(clientName);
      
      const client = await this.clients
        .where('[userId+normalizedName]')
        .equals([userId, normalizedName])
        .first();
      
      if (client) {
        await this.clients.update(client.id, {
          totalDebt: (client.totalDebt || 0) + amount,
          lastTransaction: new Date(),
          updatedAt: new Date()
        });
      } else {
        const newClient: DexieClient = {
          id: crypto.randomUUID(),
          name: clientName,
          userId: userId,
          normalizedName,
          totalDebt: amount,
          totalPaid: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await this.clients.add(newClient);
      }
    } catch (error) {
      console.error('Error en updateClientAfterDebtAddition:', error);
    }
  }
  
  async updateClientAfterDebtDeletion(clientName: string): Promise<void> {
    try {
      const userId = this.getCurrentUserId();
      const normalizedName = this.normalizeName(clientName);
      
      const client = await this.clients
        .where('[userId+normalizedName]')
        .equals([userId, normalizedName])
        .first();
      
      if (client) {
        const debts = await this.getDebts();
        const activeDebts = debts.filter(d => 
          d.type === 'owed' && 
          d.status !== 'paid' &&
          this.normalizeName(d.person) === normalizedName
        );
        
        const totalDebt = activeDebts.reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);
        
        await this.clients.update(client.id, {
          totalDebt,
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error en updateClientAfterDebtDeletion:', error);
    }
  }
  
  // ============ RESUMENES ============
  
  async getSummary() {
    const debts = await this.getDebts();
    const totalOwed = debts
      .filter(d => d.type === 'owed' && d.status !== 'paid')
      .reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);
    
    const totalOwing = debts
      .filter(d => d.type === 'owing' && d.status !== 'paid')
      .reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);
    
    return {
      totalOwed,
      totalOwing,
      netBalance: totalOwed - totalOwing,
      pendingCount: debts.filter(d => d.status === 'pending').length,
      paidCount: debts.filter(d => d.status === 'paid').length,
    };
  }
  
  async getStats() {
    const [debts, payments, clients] = await Promise.all([
      this.getDebts(),
      this.getPayments(),
      this.getClients()
    ]);
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    return {
      debtsCount: debts.length,
      paymentsCount: payments.length,
      clientsCount: clients.length,
      dbSize: 'IndexedDB',
      allDebts: debts,
      userId: this.getCurrentUserId(),
      userEmail: currentUser?.email || 'Invitado'
    };
  }
  
  async exportData() {
    const [debts, payments, clients] = await Promise.all([
      this.getDebts(),
      this.getPayments(),
      this.getClients()
    ]);
    
    return { 
      debts, 
      payments, 
      clients,
      exportDate: new Date(),
      userId: this.getCurrentUserId()
    };
  }
  
  async importData(data: any) {
    try {
      const userId = this.getCurrentUserId();
      
      if (data.debts) {
        const dexieDebts = data.debts.map((debt: any) => ({
          ...debt,
          userId: userId,
          normalizedPerson: this.normalizeName(debt.person)
        }));
        await this.debts.bulkAdd(dexieDebts);
      }
      
      if (data.payments) {
        const dexiePayments = data.payments.map((payment: any) => ({
          ...payment,
          userId: userId
        }));
        await this.payments.bulkAdd(dexiePayments);
      }
      
      if (data.clients) {
        const dexieClients = data.clients.map((client: any) => ({
          ...client,
          userId: userId,
          normalizedName: this.normalizeName(client.name)
        }));
        await this.clients.bulkAdd(dexieClients);
      }
      
      this.triggerUpdate();
    } catch (error) {
      console.error('Error en importData:', error);
    }
  }
  
  async resetAll() {
    try {
      const userId = this.getCurrentUserId();
      
      await this.debts.where('userId').equals(userId).delete();
      await this.payments.where('userId').equals(userId).delete();
      await this.clients.where('userId').equals(userId).delete();
      
      this.triggerUpdate();
    } catch (error) {
      console.error('Error en resetAll:', error);
    }
  }
  
  async consolidateDebts(): Promise<{ consolidated: number; message: string }> {
    try {
      const userId = this.getCurrentUserId();
      const debts = await this.getDebts();
      const consolidatedDebts: { [key: string]: any } = {};
      let consolidatedCount = 0;
      
      debts.forEach(debt => {
        const key = `${debt.person.toLowerCase()}-${debt.type}`;
        
        if (consolidatedDebts[key]) {
          consolidatedDebts[key].amount += debt.amount;
          consolidatedDebts[key].paidAmount = (consolidatedDebts[key].paidAmount || 0) + (debt.paidAmount || 0);
          consolidatedDebts[key].description = consolidatedDebts[key].description 
            ? `${consolidatedDebts[key].description}; ${debt.description || ''}`
            : debt.description || '';
          consolidatedCount++;
        } else {
          consolidatedDebts[key] = {
            ...debt,
            normalizedPerson: debt.person.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(),
            userId: userId
          };
        }
      });
      
      const newDebts = Object.values(consolidatedDebts);
      
      await this.debts.where('userId').equals(userId).delete();
      await this.debts.bulkAdd(newDebts);
      
      this.triggerUpdate();
      
      return {
        consolidated: consolidatedCount,
        message: consolidatedCount > 0 ? 
          `Consolidé ${consolidatedCount} deudas duplicadas` : 
          'No había deudas duplicadas',
      };
    } catch (error) {
      console.error('Error en consolidateDebts:', error);
      return {
        consolidated: 0,
        message: 'Error consolidando deudas'
      };
    }
  }
  
  // ============ UTILIDADES ============
  
   normalizeName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
  
  private triggerUpdate() {
    try {
      window.dispatchEvent(new CustomEvent('debtsUpdated'));
      window.dispatchEvent(new CustomEvent('clientsUpdated'));
    } catch (error) {
      console.error('Error en triggerUpdate:', error);
    }
  }
}

// ============ INSTANCIA GLOBAL ============
export const db = new WalletVoiceDatabase();

// Inicialización
db.on('ready', () => {
  console.log('✅ Dexie inicializado - base de datos lista');
  
  setTimeout(() => {
    db.autoMigrateFromLocalStorage().catch(error => {
      console.error('❌ Error en migración automática:', error);
    });
  }, 1000);
});

db.open().catch(error => {
  console.error('❌ Error al abrir la base de datos Dexie:', error);
});

// ============ SERVICIO DE ALMACENAMIENTO ============
export const storageService = {
  // Deudas
  getDebts: () => db.getDebts(),
  saveDebts: () => Promise.resolve(),
  addDebt: (newDebt: NewDebt) => db.addDebt(newDebt),
  updateDebt: (id: string, updates: Partial<Debt>) => db.updateDebt(id, updates),
  deleteDebt: (id: string) => db.deleteDebt(id),
  getDebt: (id: string) => db.getDebt(id),
  getDebtPayments: (debtId: string) => db.getDebtPayments(debtId),
  
  // Pagos
  getPayments: () => db.getPayments(),
  savePayments: () => Promise.resolve(),
  addPayment: (debtId: string, amount: number, note?: string) => 
    db.addPayment(debtId, amount, note),
  
  // Clientes
  getClients: () => db.getClients(),
  saveClients: () => Promise.resolve(),
  addClient: (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newClient: Client = {
      id: crypto.randomUUID(),
      ...clientData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return db.clients.add({
      ...newClient,
      userId: db.getCurrentUserId(),
      normalizedName: newClient.name.toLowerCase().trim()
    }).then(() => newClient);
  },
  findOrCreateClient: (name: string) => db.findOrCreateClient(name),
  updateClientAfterDebtAddition: (clientName: string, amount: number) => 
    db.updateClientAfterDebtAddition(clientName, amount),
  updateClientAfterDebtDeletion: (clientName: string) => 
    db.updateClientAfterDebtDeletion(clientName),
  
  // Resúmenes
  getSummary: () => db.getSummary(),
  getClientSummary: async (clientName: string) => {
    const debts = await db.getDebts();
    const clientDebts = debts.filter(d => 
      d.person.toLowerCase() === clientName.toLowerCase()
    );
    
    const totalDebt = clientDebts
      .filter(d => d.type === 'owed')
      .reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);
    
    const totalPaid = clientDebts
      .filter(d => d.type === 'owed')
      .reduce((sum, d) => sum + (d.paidAmount || 0), 0);
    
    return {
      clientName,
      totalDebt,
      totalPaid,
      pendingDebts: clientDebts.filter(d => d.status === 'pending').length,
      paidDebts: clientDebts.filter(d => d.status === 'paid').length,
      lastPayment: clientDebts
        .filter(d => d.paidAmount && d.paidAmount > 0)
        .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0]?.updatedAt || null,
      lastDebt: clientDebts
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0]?.createdAt || null,
    };
  },
  
  getBusinessSummary: async () => {
    const clients = await db.getClients();
    const debts = await db.getDebts();
    
    return {
      totalClients: clients.length,
      clientsWithDebt: clients.filter(c => (c.totalDebt || 0) > 0).length,
      totalOwed: debts.filter(d => d.type === 'owed').reduce((sum, d) => sum + d.amount, 0),
      activeClients: clients.filter(c => c.lastTransaction && 
        new Date(c.lastTransaction) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
      recentClients: clients.slice(-5),
    };
  },
  
  // Reset
  resetDebts: async () => {
  try {
    const userId = db.getCurrentUserId();
    
    // 1. Primero obtener todos los clientes que tienen deudas "owed"
    const debts = await db.getDebts();
    const clientMap = new Map<string, { name: string, normalizedName: string }>();
    
    debts.forEach(debt => {
      if (debt.type === 'owed') {
        const normalizedName = debt.person
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim();
        
        clientMap.set(normalizedName, {
          name: debt.person,
          normalizedName
        });
      }
    });
    
    // 2. Eliminar todas las deudas del usuario
    await db.debts.where('userId').equals(userId).delete();
    
    // 3. Actualizar clientes (poner totalDebt a 0)
    const clientNames = Array.from(clientMap.values());
    
    for (const clientInfo of clientNames) {
      const client = await db.clients
        .where('[userId+normalizedName]')
        .equals([userId, clientInfo.normalizedName])
        .first();
      
      if (client) {
        await db.clients.update(client.id, {
          totalDebt: 0,
          updatedAt: new Date()
        });
      }
    }
    
    // 4. También actualizar clientes que no tienen deudas pendientes
    const allClients = await db.clients.where('userId').equals(userId).toArray();
    for (const client of allClients) {
      if (client.totalDebt && client.totalDebt > 0) {
        await db.clients.update(client.id, {
          totalDebt: 0,
          updatedAt: new Date()
        });
      }
    }
    
    // 5. Trigger para actualizar UI
    window.dispatchEvent(new CustomEvent('debtsUpdated'));
    window.dispatchEvent(new CustomEvent('clientsUpdated'));
    
    console.log('✅ Deudas eliminadas correctamente');
    return true;
  } catch (error) {
    console.error('Error en resetDebts:', error);
    return false;
  }
},
  
  resetPayments: async () => {
    try {
      const userId = db.getCurrentUserId();
      
      // 1. Resetear paidAmount y status en todas las deudas
      const debts = await db.debts.where('userId').equals(userId).toArray();
      
      for (const debt of debts) {
        await db.debts.update(debt.id, {
          paidAmount: 0,
          status: 'pending',
          updatedAt: new Date()
        });
      }
      
      // 2. Eliminar todos los pagos
      await db.payments.where('userId').equals(userId).delete();
      
      // 3. Actualizar clientes (poner totalPaid a 0)
      const clients = await db.clients.where('userId').equals(userId).toArray();
      for (const client of clients) {
        await db.clients.update(client.id, {
          totalPaid: 0,
          updatedAt: new Date()
        });
      }
      
      // 4. Trigger para actualizar UI
      window.dispatchEvent(new CustomEvent('debtsUpdated'));
      window.dispatchEvent(new CustomEvent('clientsUpdated'));
      
      console.log('✅ Pagos reseteados correctamente');
      return true;
    } catch (error) {
      console.error('Error en resetPayments:', error);
      return false;
    }
  },
  
  resetAll: async () => {
    try {
      await db.resetAll();
      // Disparar eventos para actualizar toda la UI
      window.dispatchEvent(new CustomEvent('debtsUpdated'));
      window.dispatchEvent(new CustomEvent('clientsUpdated'));
      window.dispatchEvent(new CustomEvent('paymentsUpdated'));
      
      console.log('✅ Todos los datos eliminados correctamente');
      return true;
    } catch (error) {
      console.error('Error en resetAll:', error);
      return false;
    }
  },
  
  // Estadísticas
  getStats: () => db.getStats(),
  
  // Consolidación
  consolidateDebts: () => db.consolidateDebts(),
  
  // Export/Import
  exportData: () => db.exportData(),
  importData: (data: any) => db.importData(data),
  
  // Migración
  migrateFromLocalStorage: () => db.autoMigrateFromLocalStorage(),
  
  // ============ MÉTODOS AUXILIARES ============
  
  getCurrentUserInfo: () => {
    try {
      return JSON.parse(localStorage.getItem('currentUser') || 'null');
    } catch {
      return null;
    }
  },
  
  getCurrentUserId: () => db.getCurrentUserId(),
};

export default db;