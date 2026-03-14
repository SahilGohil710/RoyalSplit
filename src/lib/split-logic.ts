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
 * Calculates direct debts (Simplified Debt OFF).
 * For each expense, creates a record of what each participant owes the payer.
 * Consolidates debts between the same pair of people.
 */
export function calculateDirectDebts(people: Person[], expenses: Expense[]): Debt[] {
  const debtMap: Record<string, number> = {}; // key format: "fromId-toId"

  expenses.forEach(expense => {
    const payerId = expense.paidBy;
    
    if (expense.splitType === 'equal') {
      const numParticipants = expense.splits.length;
      if (numParticipants === 0) return;
      
      const totalCents = Math.round(expense.amount * 100);
      const shareCents = Math.floor(totalCents / numParticipants);
      const remainderCents = totalCents % numParticipants;

      expense.splits.forEach((s, index) => {
        if (s.personId === payerId) return;
        const amountCents = shareCents + (index < remainderCents ? 1 : 0);
        const key = `${s.personId}-${payerId}`;
        debtMap[key] = (debtMap[key] || 0) + (amountCents / 100);
      });
    } else if (expense.splitType === 'unequal') {
      expense.splits.forEach(s => {
        if (s.personId === payerId) return;
        const key = `${s.personId}-${payerId}`;
        debtMap[key] = (debtMap[key] || 0) + s.amount;
      });
    } else if (expense.splitType === 'percentage') {
      expense.splits.forEach(s => {
        if (s.personId === payerId) return;
        const share = Math.round((s.amount / 100) * expense.amount * 100) / 100;
        const key = `${s.personId}-${payerId}`;
        debtMap[key] = (debtMap[key] || 0) + share;
      });
    }
  });

  return Object.entries(debtMap)
    .filter(([_, amount]) => amount >= 0.01)
    .map(([key, amount]) => {
      const [from, to] = key.split('-');
      return { from, to, amount: Math.round(amount * 100) / 100 };
    });
}

/**
 * Simplifies debts to minimize the number of transactions between people (Simplified Debt ON).
 * Greedy matching: largest debtor pays largest creditor.
 */
export function simplifyDebts(balances: Balance[]): Debt[] {
  const epsilon = 0.01;

  let creditors = balances
    .filter(b => b.netAmount > epsilon)
    .map(b => ({ ...b }))
    .sort((a, b) => b.netAmount - a.netAmount);

  let debtors = balances
    .filter(b => b.netAmount < -epsilon)
    .map(b => ({ ...b, netAmount: Math.abs(b.netAmount) }))
    .sort((a, b) => b.netAmount - a.netAmount);

  const debts: Debt[] = [];

  while (creditors.length > 0 && debtors.length > 0) {
    const creditor = creditors[0];
    const debtor = debtors[0];

    const payment = Math.min(creditor.netAmount, debtor.netAmount);
    
    if (payment >= epsilon) {
      debts.push({
        from: debtor.personId,
        to: creditor.personId,
        amount: Math.round(payment * 100) / 100
      });
    }

    creditor.netAmount -= payment;
    debtor.netAmount -= payment;

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
