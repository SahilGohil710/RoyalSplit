import { Person, Expense, Debt, Balance } from './types';

/**
 * Calculates net balances for all people based on a list of expenses.
 */
export function calculateBalances(people: Person[], expenses: Expense[]): Balance[] {
  const balances: Record<string, number> = {};
  people.forEach(p => balances[p.id] = 0);

  expenses.forEach(expense => {
    // The person who paid gets a credit
    balances[expense.paidBy] += expense.amount;

    // People in the split owe money
    if (expense.splitType === 'equal') {
      const perPerson = expense.amount / expense.splits.length;
      expense.splits.forEach(s => {
        balances[s.personId] -= perPerson;
      });
    } else if (expense.splitType === 'unequal') {
      expense.splits.forEach(s => {
        balances[s.personId] -= s.amount;
      });
    } else if (expense.splitType === 'percentage') {
      expense.splits.forEach(s => {
        balances[s.personId] -= (s.amount / 100) * expense.amount;
      });
    }
  });

  return Object.entries(balances).map(([personId, netAmount]) => ({
    personId,
    netAmount: Math.round(netAmount * 100) / 100 // Handle floating point
  }));
}

/**
 * Simplifies debts to minimize the number of transactions between people.
 * Uses a greedy approach matching largest debtors with largest creditors.
 */
export function simplifyDebts(balances: Balance[]): Debt[] {
  const debtors = balances
    .filter(b => b.netAmount < -0.01)
    .sort((a, b) => a.netAmount - b.netAmount); // Most negative first
  
  const creditors = balances
    .filter(b => b.netAmount > 0.01)
    .sort((a, b) => b.netAmount - a.netAmount); // Most positive first

  const debts: Debt[] = [];

  let i = 0; // debtor index
  let j = 0; // creditor index

  const dActive = debtors.map(d => ({ ...d, netAmount: Math.abs(d.netAmount) }));
  const cActive = creditors.map(c => ({ ...c }));

  while (i < dActive.length && j < cActive.length) {
    const amount = Math.min(dActive[i].netAmount, cActive[j].netAmount);
    
    if (amount > 0.01) {
      debts.push({
        from: dActive[i].personId,
        to: cActive[j].personId,
        amount: Math.round(amount * 100) / 100
      });
    }

    dActive[i].netAmount -= amount;
    cActive[j].netAmount -= amount;

    if (dActive[i].netAmount < 0.01) i++;
    if (cActive[j].netAmount < 0.01) j++;
  }

  return debts;
}
