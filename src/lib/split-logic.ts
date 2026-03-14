import { Person, Expense, Debt, Balance } from './types';

/**
 * Utility to round values to two decimal places to prevent floating point errors.
 */
const round = (val: number) => Math.round(val * 100) / 100;

/**
 * Calculates net balances for all people based on a list of expenses.
 * Net Balance = Total Paid - Total Share
 * This is recalculated from scratch every time.
 */
export function calculateBalances(people: Person[], expenses: Expense[]): Balance[] {
  const balances: Record<string, number> = {};
  people.forEach(p => balances[p.id] = 0);

  expenses.forEach(expense => {
    // The person who paid gets a credit
    balances[expense.paidBy] += expense.amount;

    // Subtract their share
    if (expense.splitType === 'equal') {
      const numParticipants = expense.splits.length;
      if (numParticipants > 0) {
        const share = expense.amount / numParticipants;
        expense.splits.forEach(s => {
          balances[s.personId] -= share;
        });
      }
    } else if (expense.splitType === 'unequal') {
      expense.splits.forEach(s => {
        balances[s.personId] -= s.amount;
      });
    } else if (expense.splitType === 'percentage') {
      expense.splits.forEach(s => {
        const share = (s.amount / 100) * expense.amount;
        balances[s.personId] -= share;
      });
    }
  });

  return Object.entries(balances).map(([personId, netAmount]) => ({
    personId,
    netAmount: round(netAmount)
  }));
}

/**
 * Calculates direct debts (Simplified Debt OFF).
 * For each expense, every participant (except the payer) owes the payer their share.
 * These debts are accumulated and then 1-to-1 netted (if A owes B and B owes A).
 */
export function calculateDirectDebts(people: Person[], expenses: Expense[]): Debt[] {
  const pairDebts: Record<string, number> = {}; // key: "id1-id2" where id1 < id2

  expenses.forEach(expense => {
    const payerId = expense.paidBy;
    const numParticipants = expense.splits.length;
    if (numParticipants === 0) return;

    expense.splits.forEach(s => {
      if (s.personId === payerId) return;

      let share = 0;
      if (expense.splitType === 'equal') {
        share = expense.amount / numParticipants;
      } else if (expense.splitType === 'unequal') {
        share = s.amount;
      } else if (expense.splitType === 'percentage') {
        share = (s.amount / 100) * expense.amount;
      }

      // Record debt: participant -> payer
      // We use a stable key and positive/negative values to net them automatically
      const [idA, idB] = [s.personId, payerId].sort();
      const key = `${idA}-${idB}`;
      // If s.personId is idA, he owes idB (positive). If s.personId is idB, he owes idA (negative).
      const direction = s.personId === idA ? 1 : -1;
      pairDebts[key] = (pairDebts[key] || 0) + (share * direction);
    });
  });

  const debts: Debt[] = [];
  Object.entries(pairDebts).forEach(([key, amount]) => {
    const [idA, idB] = key.split('-');
    const roundedAmount = round(amount);
    
    if (roundedAmount > 0.01) {
      debts.push({ from: idA, to: idB, amount: roundedAmount });
    } else if (roundedAmount < -0.01) {
      debts.push({ from: idB, to: idA, amount: Math.abs(roundedAmount) });
    }
  });

  return debts;
}

/**
 * Simplifies debts to minimize the number of transactions (Simplified Debt ON).
 * Follows the Greedy matching algorithm: largest debtor pays largest creditor.
 */
export function simplifyDebts(balances: Balance[]): Debt[] {
  // Separate into creditors and debtors
  let creditors = balances
    .filter(b => b.netAmount > 0.01)
    .map(b => ({ ...b }))
    .sort((a, b) => b.netAmount - a.netAmount);

  let debtors = balances
    .filter(b => b.netAmount < -0.01)
    .map(b => ({ ...b, netAmount: Math.abs(b.netAmount) }))
    .sort((a, b) => b.netAmount - a.netAmount);

  const debts: Debt[] = [];

  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];

    const payment = round(Math.min(creditor.netAmount, debtor.netAmount));
    
    if (payment > 0) {
      debts.push({
        from: debtor.personId,
        to: creditor.personId,
        amount: payment
      });
    }

    creditor.netAmount = round(creditor.netAmount - payment);
    debtor.netAmount = round(debtor.netAmount - payment);

    // Remove if settled, otherwise re-sort to keep matching the largest
    if (creditor.netAmount <= 0.01) {
      creditors.shift();
    } else {
      creditors.sort((a, b) => b.netAmount - a.netAmount);
    }

    if (debtor.netAmount <= 0.01) {
      debtors.shift();
    } else {
      debtors.sort((a, b) => b.netAmount - a.netAmount);
    }
  }

  return debts;
}
