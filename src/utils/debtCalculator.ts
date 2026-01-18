import { Debt } from '../types';

export const calculateTotalOwed = (debts: Debt[]): number => {
  return debts
    .filter(debt => debt.type === 'owed' && debt.status !== 'paid')
    .reduce((total, debt) => total + (debt.amount - (debt.paidAmount || 0)), 0);
};

export const calculateTotalOwing = (debts: Debt[]): number => {
  return debts
    .filter(debt => debt.type === 'owing' && debt.status !== 'paid')
    .reduce((total, debt) => total + (debt.amount - (debt.paidAmount || 0)), 0);
};

export const getDebtors = (debts: Debt[]): string[] => {
  const debtors = new Set<string>();
  debts
    .filter(debt => debt.type === 'owed' && debt.status !== 'paid')
    .forEach(debt => debtors.add(debt.person));
  return Array.from(debtors);
};

export const getCreditors = (debts: Debt[]): string[] => {
  const creditors = new Set<string>();
  debts
    .filter(debt => debt.type === 'owing' && debt.status !== 'paid')
    .forEach(debt => creditors.add(debt.person));
  return Array.from(creditors);
};