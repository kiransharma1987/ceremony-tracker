// Expense Categories - Fixed as per BRD
import { User } from './auth.model';

export type ExpenseCategory =
  | 'Food & Catering'
  | 'Priest Renumeration'
  | 'Pooje Items'
  | 'Dhaanas'
  | 'Venue'
  | 'Return Gifts'
  | 'Transport'
  | 'Miscellaneous';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Food & Catering',
  'Priest Renumeration',
  'Pooje Items',
  'Dhaanas',
  'Venue',
  'Return Gifts',
  'Transport',
  'Miscellaneous'
];

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  paidBy: BrotherId;
  date: Date;
  notes?: string;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseFormData {
  title: string;
  category: ExpenseCategory;
  amount: number;
  paidBy: BrotherId;
  date: Date;
  notes?: string;
  receiptUrl?: string;
}

// Brother IDs - Only 4 brothers share expenses
export type BrotherId = 'HNK' | 'HNP' | 'HNS' | 'HNM';

export interface Brother {
  id: BrotherId;
  name: string;
  fullName: string;
}

export const BROTHERS: Brother[] = [
  { id: 'HNK', name: 'HNK', fullName: 'HNK' },
  { id: 'HNP', name: 'HNP', fullName: 'HNP' },
  { id: 'HNS', name: 'HNS', fullName: 'HNS' },
  { id: 'HNM', name: 'HNM', fullName: 'HNM' }
];

// Contribution Types
export type ContributorRelationship = 'Sister' | 'Relative';

export interface Contribution {
  id: string;
  contributorName: string;
  relationship: ContributorRelationship;
  amount: number;
  date: Date;
  notes?: string;
  createdAt: Date;
}

export interface ContributionFormData {
  contributorName: string;
  relationship: ContributorRelationship;
  amount: number;
  date: Date;
  notes?: string;
}

// Budget Management
export interface CategoryBudget {
  category: ExpenseCategory;
  budgetAmount: number;
}

export interface Budget {
  overallBudget?: number;
  categoryBudgets: CategoryBudget[];
}

export type BudgetStatus = 'green' | 'amber' | 'red';

export interface CategoryBudgetSummary {
  category: ExpenseCategory;
  budget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: BudgetStatus;
}

// Settlement Calculations
export interface BrotherSettlement {
  brotherId: BrotherId;
  name: string;
  paid: number;
  share: number;
  balance: number; // positive = owes, negative = to receive
}

// Deposit - Brothers depositing money with HNK (treasurer)
export interface Deposit {
  id: string;
  depositedBy: BrotherId;
  amount: number;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepositFormData {
  depositedBy: BrotherId;
  amount: number;
  date: Date;
  notes?: string;
}

export interface DepositSummary {
  HNK: number;
  HNP: number;
  HNS: number;
  HNM: number;
  total: number;
}

export interface SettlementInstruction {
  from: BrotherId;
  to: BrotherId;
  amount: number;
}

export interface FinancialSummary {
  totalExpenses: number;
  totalContributions: number;
  netExpense: number;
  surplus: number;
  sharePerBrother: number;
  brotherSettlements: BrotherSettlement[];
  settlementInstructions: SettlementInstruction[];
}

// Category Summary
export interface CategorySummary {
  category: ExpenseCategory;
  totalAmount: number;
  expenseCount: number;
  percentage: number;
}

// Event Status
export interface EventStatus {
  isClosed: boolean;
  closedAt?: Date;
  closedBy?: string;
}

// Application State
export interface AppState {
  expenses: Expense[];
  contributions: Contribution[];
  budget: Budget;
  eventStatus: EventStatus;
  currentUser: User | null;
}
