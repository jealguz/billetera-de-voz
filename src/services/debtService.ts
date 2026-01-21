import { Debt, NewDebt } from '../types';
import { storageService } from './databaseService';

export const debtService = {
  // TODOS los métodos ahora son ASÍNCRONOS (async/await)
  
  async getDebts(): Promise<Debt[]> {
    return await storageService.getDebts(); // Agregar await
  },

  async getDebt(id: string): Promise<Debt | null> {
    return await storageService.getDebt(id); // Agregar await
  },

  async addDebt(person: string, amount: number, type: 'owed' | 'owing', description?: string): Promise<Debt> {
    const newDebt: NewDebt = {
      person,
      amount,
      type,
      description,
      date: new Date(),
      dueDate: undefined,
      status: 'pending',
      paidAmount: 0,
    };
    
    return await storageService.addDebt(newDebt); // Agregar await
  },

  async updateDebt(id: string, updates: Partial<Debt>): Promise<Debt | null> {
    const success = await storageService.updateDebt(id, updates); // Agregar await
    return success ? await storageService.getDebt(id) : null; // Agregar await
  },

  async deleteDebt(id: string): Promise<boolean> {
    return await storageService.deleteDebt(id); // Agregar await
  },

  async getSummary() {
    return await storageService.getSummary(); // Agregar await
  },

  async addPayment(debtId: string, amount: number, note?: string) {
    return await storageService.addPayment(debtId, amount, note); // Agregar await
  },

  async getDebtPayments(debtId: string) {
    return await storageService.getDebtPayments(debtId); // Agregar await
  },

  // Métodos adicionales útiles
  async getPendingDebts(): Promise<Debt[]> {
    const debts = await this.getDebts(); // Agregar await
    return debts.filter(debt => debt.status === 'pending');
  },

  async getPaidDebts(): Promise<Debt[]> {
    const debts = await this.getDebts(); // Agregar await
    return debts.filter(debt => debt.status === 'paid');
  },

  async getDebtsByPerson(personName: string): Promise<Debt[]> {
    const debts = await this.getDebts(); // Agregar await
    return debts.filter(debt => 
      debt.person.toLowerCase().includes(personName.toLowerCase())
    );
  },

  async getTotalBalance(): Promise<{ owed: number; owing: number; net: number }> {
    const debts = await this.getDebts(); // Agregar await
    const owed = debts
      .filter(d => d.type === 'owed' && d.status !== 'paid')
      .reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);
    
    const owing = debts
      .filter(d => d.type === 'owing' && d.status !== 'paid')
      .reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);
    
    return {
      owed,
      owing,
      net: owed - owing
    };
  }
};