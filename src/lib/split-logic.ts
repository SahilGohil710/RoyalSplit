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
 * Follows the standard greedy algorithm matching largest debtors with largest creditors.
 * This ensures the minimum possible number of transactions in most scenarios, 
 * behaving exactly like Splitwise's debt simplification.
 */
export function simplifyDebts(balances: Balance[]): Debt[] {
  // Use a small epsilon to handle float precision issues
  const epsilon = 0.001;

  // Separate participants into Creditors (>0) and Debtors (<0)
  // Debtors will have their amounts stored as positive magnitudes for easier calculation
  let creditors = balances
    .filter(b => b.netAmount > epsilon)
    .map(b => ({ ...b }))
    .sort((a, b) => b.netAmount - a.netAmount);

  let debtors = balances
    .filter(b => b.netAmount < -epsilon)
    .map(b => ({ ...b, netAmount: Math.abs(b.netAmount) }))
    .sort((a, b) => b.netAmount - a.netAmount);

  const debts: Debt[] = [];

  // Greedy settlement process: always match the person who owes the most 
  // with the person who is owed the most.
  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];

    // The payment is the minimum of what is owed vs what is to be received
    const payment = Math.min(creditor.netAmount, debtor.netAmount);
    
    if (payment > 0.009) { // At least 1 cent
      debts.push({
        from: debtor.personId,
        to: creditor.personId,
        amount: Math.round(payment * 100) / 100
      });
    }

    // Update the balances in the local trackers
    creditor.netAmount -= payment;
    debtor.netAmount -= payment;

    // Remove if settled, otherwise re-sort to ensure greedy property for next step.
    // Re-sorting ensures we always pick the current maximums after each partial settlement.
    if (creditor.netAmount < epsilon) {
      creditors.shift();
    } else {
      creditors.sort((a, b) => b.netAmount - a.netAmount);
    }

    if (debtor.netAmount < epsilon) {
      debtors.shift();
    } else {
      debtors.sort((a, b) => b.netAmount - a.netAmount);
    }
  }

  return debts;
}
