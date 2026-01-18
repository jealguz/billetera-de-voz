import { Debt } from '../types';
import { storageService } from './storageService';

export const debtService = {
  getDebts(): Debt[] {
    return storageService.getDebts();
  },

  getDebt(id: string): Debt | null {
    return storageService.getDebt(id);
  },

  addDebt(person: string, amount: number, type: 'owed' | 'owing', description?: string): Debt {
    return storageService.addDebt({
      person,
      amount,
      type,
      description,
      date: new Date(), // ← AQUÍ FALTA ESTA LÍNEA
      dueDate: undefined,
      status: 'pending',
      paidAmount: 0,
    });
  },

  updateDebt(id: string, updates: Partial<Debt>): Debt | null {
    const success = storageService.updateDebt(id, updates);
    return success ? storageService.getDebt(id) : null;
  },

  deleteDebt(id: string): boolean {
    return storageService.deleteDebt(id);
  },

  getSummary() {
    return storageService.getSummary();
  },

  addPayment(debtId: string, amount: number, note?: string) {
    return storageService.addPayment(debtId, amount, note);
  },

  getDebtPayments(debtId: string) {
    return storageService.getDebtPayments(debtId);
  },
};