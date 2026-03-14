export type SplitType = 'equal' | 'unequal' | 'percentage';

export interface Person {
  id: string;
  name: string;
}

export interface ExpenseSplit {
  personId: string;
  amount: number; // For equal/unequal it's currency, for percentage it's a value 0-100
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  paidBy: string; // Person ID
  splitType: SplitType;
  splits: ExpenseSplit[];
  date: number;
}

export interface Debt {
  from: string; // Person ID
  to: string; // Person ID
  amount: number;
}

export interface Balance {
  personId: string;
  netAmount: number; // Total Paid - Total Owed
}
