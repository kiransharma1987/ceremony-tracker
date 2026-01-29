import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { 
  Expense, 
  ExpenseFormData, 
  ExpenseCategory, 
  EXPENSE_CATEGORIES,
  BrotherId,
  BROTHERS,
  CategorySummary
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private expenses = signal<Expense[]>([]);
  private loaded = signal(false);
  
  readonly allExpenses = this.expenses.asReadonly();
  
  readonly totalExpenses = computed(() => 
    this.expenses().reduce((sum, exp) => sum + exp.amount, 0)
  );

  readonly expensesByCategory = computed(() => {
    const categoryMap = new Map<ExpenseCategory, number>();
    EXPENSE_CATEGORIES.forEach(cat => categoryMap.set(cat, 0));
    
    this.expenses().forEach(exp => {
      const current = categoryMap.get(exp.category) || 0;
      categoryMap.set(exp.category, current + exp.amount);
    });
    
    return categoryMap;
  });

  readonly expensesByBrother = computed(() => {
    const brotherMap = new Map<BrotherId, number>();
    BROTHERS.forEach(b => brotherMap.set(b.id, 0));
    
    this.expenses().forEach(exp => {
      const current = brotherMap.get(exp.paidBy) || 0;
      brotherMap.set(exp.paidBy, current + exp.amount);
    });
    
    return brotherMap;
  });

  readonly categorySummary = computed((): CategorySummary[] => {
    const total = this.totalExpenses();
    const byCategory = this.expensesByCategory();
    
    return EXPENSE_CATEGORIES.map(category => {
      const totalAmount = byCategory.get(category) || 0;
      const expenseCount = this.expenses().filter(e => e.category === category).length;
      const percentage = total > 0 ? (totalAmount / total) * 100 : 0;
      
      return {
        category,
        totalAmount,
        expenseCount,
        percentage
      };
    }).sort((a, b) => b.totalAmount - a.totalAmount);
  });

  constructor() {
    this.loadFromStorage();
  }

  // Load from API
  async loadFromApi(): Promise<void> {
    const token = this.authService.getToken();
    console.log('loadFromApi called, token:', token ? token.substring(0, 20) + '...' : 'null');
    
    if (!token || token === 'demo') {
      console.log('Using localStorage mode (no token or demo mode)');
      return; // Use localStorage in demo mode
    }

    try {
      console.log('Fetching expenses from API...');
      
      // Get productId from auth service or localStorage (for SUPER_ADMIN)
      let productId = this.authService.productId();
      if (!productId) {
        productId = localStorage.getItem('selectedProductId') || undefined;
      }
      
      const url = productId 
        ? `${environment.apiUrl}/expenses?productId=${productId}`
        : `${environment.apiUrl}/expenses`;
      
      const data = await firstValueFrom(
        this.http.get<any[]>(url, {
          headers: this.authService.getAuthHeaders()
        })
      );
      
      console.log('API returned', data.length, 'expenses');
      const expenses = data.map(exp => ({
        ...exp,
        date: new Date(exp.date),
        createdAt: new Date(exp.createdAt),
        updatedAt: new Date(exp.updatedAt)
      }));
      
      this.expenses.set(expenses);
      this.loaded.set(true);
    } catch (error) {
      console.error('Failed to load expenses from API:', error);
    }
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('ceremony_expenses');
    if (stored) {
      try {
        const data = JSON.parse(stored) as Expense[];
        const expenses = data.map(exp => ({
          ...exp,
          date: new Date(exp.date),
          createdAt: new Date(exp.createdAt),
          updatedAt: new Date(exp.updatedAt)
        }));
        this.expenses.set(expenses);
      } catch {
        console.error('Failed to load expenses from storage');
      }
    }
  }

  private saveToStorage(): void {
    localStorage.setItem('ceremony_expenses', JSON.stringify(this.expenses()));
  }

  private generateId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async addExpense(data: ExpenseFormData): Promise<Expense> {
    const token = this.authService.getToken();
    console.log('addExpense called, token:', token ? token.substring(0, 20) + '...' : 'null');
    
    if (token && token !== 'demo') {
      // Use API
      try {
        console.log('Adding expense via API...');
        const expense = await firstValueFrom(
          this.http.post<any>(`${environment.apiUrl}/expenses`, data, {
            headers: this.authService.getAuthHeaders()
          })
        );
        
        console.log('Expense added via API:', expense.id);
        const parsed = {
          ...expense,
          date: new Date(expense.date),
          createdAt: new Date(expense.createdAt),
          updatedAt: new Date(expense.updatedAt)
        };
        
        this.expenses.update(expenses => [...expenses, parsed]);
        return parsed;
      } catch (error) {
        console.error('Failed to add expense via API:', error);
        throw error;
      }
    }
    
    // Fallback to localStorage
    console.log('Adding expense to localStorage (demo mode)');
    const now = new Date();
    const expense: Expense = {
      id: this.generateId(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    
    this.expenses.update(expenses => [...expenses, expense]);
    this.saveToStorage();
    return expense;
  }

  async updateExpense(id: string, data: Partial<ExpenseFormData>): Promise<Expense | null> {
    const token = this.authService.getToken();
    
    if (token && token !== 'demo') {
      try {
        const expense = await firstValueFrom(
          this.http.put<any>(`${environment.apiUrl}/expenses/${id}`, data, {
            headers: this.authService.getAuthHeaders()
          })
        );
        
        const parsed = {
          ...expense,
          date: new Date(expense.date),
          createdAt: new Date(expense.createdAt),
          updatedAt: new Date(expense.updatedAt)
        };
        
        this.expenses.update(expenses => 
          expenses.map(exp => exp.id === id ? parsed : exp)
        );
        return parsed;
      } catch (error) {
        console.error('Failed to update expense via API:', error);
        throw error;
      }
    }
    
    // Fallback to localStorage
    let updatedExpense: Expense | null = null;
    
    this.expenses.update(expenses => 
      expenses.map(exp => {
        if (exp.id === id) {
          updatedExpense = {
            ...exp,
            ...data,
            updatedAt: new Date()
          };
          return updatedExpense;
        }
        return exp;
      })
    );
    
    this.saveToStorage();
    return updatedExpense;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const token = this.authService.getToken();
    
    if (token && token !== 'demo') {
      try {
        await firstValueFrom(
          this.http.delete(`${environment.apiUrl}/expenses/${id}`, {
            headers: this.authService.getAuthHeaders()
          })
        );
        
        this.expenses.update(expenses => expenses.filter(exp => exp.id !== id));
        return true;
      } catch (error) {
        console.error('Failed to delete expense via API:', error);
        throw error;
      }
    }
    
    // Fallback to localStorage
    const initialLength = this.expenses().length;
    this.expenses.update(expenses => expenses.filter(exp => exp.id !== id));
    this.saveToStorage();
    return this.expenses().length < initialLength;
  }

  getExpenseById(id: string): Expense | undefined {
    return this.expenses().find(exp => exp.id === id);
  }

  getExpensesByCategory(category: ExpenseCategory): Expense[] {
    return this.expenses().filter(exp => exp.category === category);
  }

  getExpensesByBrother(brotherId: BrotherId): Expense[] {
    return this.expenses().filter(exp => exp.paidBy === brotherId);
  }

  getAmountPaidByBrother(brotherId: BrotherId): number {
    return this.expenses()
      .filter(exp => exp.paidBy === brotherId)
      .reduce((sum, exp) => sum + exp.amount, 0);
  }

  getExpensesByDateRange(startDate: Date, endDate: Date): Expense[] {
    return this.expenses().filter(exp => 
      exp.date >= startDate && exp.date <= endDate
    );
  }

  clearAll(): void {
    this.expenses.set([]);
    this.saveToStorage();
  }
}
