import { Person, Expense, Debt, Balance } from './types';

/**
 * Calculates net balances for all people based on a list of expenses.
 * Net Balance = Total Paid - Total Share
 */
export function calculateBalances(people: Person[], expenses: Expense[]): Balance[] {
  const balances: Record<string, number> = {};
  people.forEach(p => balances[p.id] = 0);

  expenses.forEach(expense => {
    // The person who paid gets a credit (positive balance)
    balances[expense.paidBy] += expense.amount;

    // People in the split owe money (negative share)
    if (expense.splitType === 'equal') {
      const numParticipants = expense.splits.length;
      if (numParticipants === 0) return;
      
      // Calculate total cents to avoid floating point issues during distribution
      const totalCents = Math.round(expense.amount * 100);
      const shareCents = Math.floor(totalCents / numParticipants);
      const remainderCents = totalCents % numParticipants;

      expense.splits.forEach((s, index) => {
        // Distribute remainder cents one by one to the first participants
        const amountCents = shareCents + (index < remainderCents ? 1 : 0);
        balances[s.personId] -= amountCents / 100;
      });
    } else if (expense.splitType === 'unequal') {
      expense.splits.forEach(s => {
        balances[s.personId] -= s.amount;
      });
    } else if (expense.splitType === 'percentage') {
      expense.splits.forEach(s => {
        // Percentages should be accurate to two decimal cents
        const share = Math.round((s.amount / 100) * expense.amount * 100) / 100;
        balances[s.personId] -= share;
      });
    }
  });

  // Final rounding to handle any float precision accumulation from multiple expenses
  return Object.entries(balances).map(([personId, netAmount]) => ({
    personId,
    netAmount: Math.round(netAmount * 100) / 100
  }));
}

/**
 * Simplifies debts to minimize the number of transactions between people.
 * Follows the greedy algorithm matching largest debtors with largest creditors.
 */
export function simplifyDebts(balances: Balance[]): Debt[] {
  // Use a small epsilon to handle float precision issues
  const epsilon = 0.001;

  // Separate participants into Creditors (>0) and Debtors (<0)
  // Sort creditors descending: largest credit first
  const creditors = balances
    .filter(b => b.netAmount > epsilon)
    .sort((a, b) => b.netAmount - a.netAmount)
    .map(b => ({ ...b }));

  // Sort debtors ascending: most negative netAmount first (largest debt)
  const debtors = balances
    .filter(b => b.netAmount < -epsilon)
    .sort((a, b) => a.netAmount - b.netAmount)
    .map(b => ({ ...b, netAmount: Math.abs(b.netAmount) }));

  const debts: Debt[] = [];

  let creditorIdx = 0;
  let debtorIdx = 0;

  // Greedy settlement process
  while (creditorIdx < creditors.length && debtorIdx < debtors.length) {
    const creditor = creditors[creditorIdx];
    const debtor = debtors[debtorIdx];

    // Settle the minimum of the two balances
    const amount = Math.min(creditor.netAmount, debtor.netAmount);
    
    if (amount > 0.009) { // Only record transactions of 1 cent or more
      debts.push({
        from: debtor.personId,
        to: creditor.personId,
        amount: Math.round(amount * 100) / 100
      });
    }

    // Update remaining balances for the greedy loop
    creditor.netAmount -= amount;
    debtor.netAmount -= amount;

    // Remove participants whose balance is fully settled
    if (creditor.netAmount < epsilon) {
      creditorIdx++;
    }
    if (debtor.netAmount < epsilon) {
      debtorIdx++;
    }
  }

  return debts;
}
