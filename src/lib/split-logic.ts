import { Person, Expense, Debt, Balance } from './types';

/**
 * Utility to round values to two decimal places to prevent floating point errors.
 */
export const round = (val: number) => Math.round(val * 100) / 100;

/**
 * Calculates net balances for all people based on a list of expenses.
 * Net Balance = Total Paid - Total Share
 * This is recalculated from scratch every time.
 */
export function calculateBalances(people: Person[], expenses: Expense[]): Balance[] {
  const balances: Record<string, { paid: number; share: number }> = {};
  people.forEach(p => balances[p.id] = { paid: 0, share: 0 });

  expenses.forEach(expense => {
    // The person who paid gets a credit for the full amount
    if (balances[expense.paidBy]) {
      balances[expense.paidBy].paid += expense.amount;
    }

    // Calculate shares for participants
    if (expense.splitType === 'equal') {
      const numParticipants = expense.splits.length;
      if (numParticipants > 0) {
        const share = expense.amount / numParticipants;
        expense.splits.forEach(s => {
          if (balances[s.personId]) {
            balances[s.personId].share += share;
          }
        });
      }
    } else if (expense.splitType === 'unequal') {
      expense.splits.forEach(s => {
        if (balances[s.personId]) {
          balances[s.personId].share += s.amount;
        }
      });
    } else if (expense.splitType === 'percentage') {
      expense.splits.forEach(s => {
        const share = (s.amount / 100) * expense.amount;
        if (balances[s.personId]) {
          balances[s.personId].share += share;
        }
      });
    }
  });

  return Object.entries(balances).map(([personId, data]) => ({
    personId,
    paid: round(data.paid),
    share: round(data.share),
    netAmount: round(data.paid - data.share)
  }));
}

/**
 * Generates a history of balances after each expense for visualization.
 */
export function calculateBalanceHistory(people: Person[], expenses: Expense[]) {
  if (expenses.length === 0) return [];
  
  // Sort expenses by date (oldest first) for the timeline
  const sortedExpenses = [...expenses].sort((a, b) => a.date - b.date);
  
  const history = [];
  
  // Start point (0 for everyone)
  const start: any = { name: 'Initial' };
  people.forEach(p => start[p.name] = 0);
  history.push(start);

  for (let i = 0; i < sortedExpenses.length; i++) {
    const expensesToDate = sortedExpenses.slice(0, i + 1);
    const balances = calculateBalances(people, expensesToDate);
    
    const snapshot: any = { 
      name: sortedExpenses[i].title,
      timestamp: sortedExpenses[i].date 
    };
    
    balances.forEach(b => {
      const person = people.find(p => p.id === b.personId);
      if (person) {
        snapshot[person.name] = b.netAmount;
      }
    });
    
    history.push(snapshot);
  }
  
  return history;
}

/**
 * Calculates direct debts (Simplified Debt OFF).
 * For each expense, every participant (except the payer) owes the payer their share.
 */
export function calculateDirectDebts(people: Person[], expenses: Expense[]): Debt[] {
  const pairDebts: Record<string, number> = {}; 

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

      const [idA, idB] = [s.personId, payerId].sort();
      const key = `${idA}-${idB}`;
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
 * Greedy matching: largest debtor pays largest creditor.
 */
export function simplifyDebts(balances: Balance[]): Debt[] {
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
