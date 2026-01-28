import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { 
  Budget, 
  CategoryBudget, 
  CategoryBudgetSummary,
  BudgetStatus,
  ExpenseCategory,
  EXPENSE_CATEGORIES
} from '../models';
import { ExpenseService } from './expense.service';

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private budget = signal<Budget>({
    overallBudget: undefined,
    categoryBudgets: []
  });

  readonly currentBudget = this.budget.asReadonly();

  readonly overallBudget = computed(() => this.budget().overallBudget);

  readonly categoryBudgetSummaries = computed((): CategoryBudgetSummary[] => {
    const expensesByCategory = this.expenseService.expensesByCategory();
    const budgets = this.budget().categoryBudgets;
    
    return EXPENSE_CATEGORIES.map(category => {
      const categoryBudget = budgets.find(b => b.category === category);
      const budgetAmount = categoryBudget?.budgetAmount || 0;
      const spent = expensesByCategory.get(category) || 0;
      const remaining = budgetAmount - spent;
      const percentUsed = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
      
      let status: BudgetStatus = 'green';
      if (percentUsed > 90) {
        status = 'red';
      } else if (percentUsed >= 70) {
        status = 'amber';
      }
      
      return {
        category,
        budget: budgetAmount,
        spent,
        remaining,
        percentUsed,
        status
      };
    });
  });

  readonly overallBudgetSummary = computed(() => {
    const totalBudget = this.budget().overallBudget || 0;
    const totalSpent = this.expenseService.totalExpenses();
    const remaining = totalBudget - totalSpent;
    const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    let status: BudgetStatus = 'green';
    if (percentUsed > 90) {
      status = 'red';
    } else if (percentUsed >= 70) {
      status = 'amber';
    }
    
    return {
      budget: totalBudget,
      spent: totalSpent,
      remaining,
      percentUsed,
      status
    };
  });

  constructor(private expenseService: ExpenseService) {
    this.loadFromStorage();
  }

  async loadFromApi(): Promise<void> {
    const token = this.authService.getToken();
    if (!token || token === 'demo') {
      return;
    }

    try {
      // Load category budgets
      const budgets = await firstValueFrom(
        this.http.get<any[]>(`${environment.apiUrl}/budgets`, {
          headers: this.authService.getAuthHeaders()
        })
      );
      
      // Load settings (overall budget)
      const settings = await firstValueFrom(
        this.http.get<any>(`${environment.apiUrl}/budgets/settings`, {
          headers: this.authService.getAuthHeaders()
        })
      );
      
      this.budget.set({
        overallBudget: settings.overallBudget || undefined,
        categoryBudgets: budgets.map(b => ({
          category: b.category as ExpenseCategory,
          budgetAmount: b.amount
        }))
      });
    } catch (error) {
      console.error('Failed to load budgets from API:', error);
    }
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('ceremony_budget');
    if (stored) {
      try {
        const data = JSON.parse(stored) as Budget;
        this.budget.set(data);
      } catch {
        console.error('Failed to load budget from storage');
      }
    }
  }

  private saveToStorage(): void {
    localStorage.setItem('ceremony_budget', JSON.stringify(this.budget()));
  }

  async setOverallBudget(amount: number | undefined): Promise<void> {
    const token = this.authService.getToken();
    
    if (token && token !== 'demo') {
      try {
        await firstValueFrom(
          this.http.put(`${environment.apiUrl}/budgets/settings/overall`, { amount }, {
            headers: this.authService.getAuthHeaders()
          })
        );
      } catch (error) {
        console.error('Failed to set overall budget via API:', error);
      }
    }
    
    this.budget.update(b => ({
      ...b,
      overallBudget: amount
    }));
    this.saveToStorage();
  }

  async setCategoryBudget(category: ExpenseCategory, amount: number): Promise<void> {
    const token = this.authService.getToken();
    
    if (token && token !== 'demo') {
      try {
        await firstValueFrom(
          this.http.post(`${environment.apiUrl}/budgets/category`, { category, amount }, {
            headers: this.authService.getAuthHeaders()
          })
        );
      } catch (error) {
        console.error('Failed to set category budget via API:', error);
      }
    }
    
    this.budget.update(b => {
      const existing = b.categoryBudgets.find(cb => cb.category === category);
      
      if (existing) {
        return {
          ...b,
          categoryBudgets: b.categoryBudgets.map(cb => 
            cb.category === category ? { ...cb, budgetAmount: amount } : cb
          )
        };
      } else {
        return {
          ...b,
          categoryBudgets: [...b.categoryBudgets, { category, budgetAmount: amount }]
        };
      }
    });
    this.saveToStorage();
  }

  async removeCategoryBudget(category: ExpenseCategory): Promise<void> {
    const token = this.authService.getToken();
    
    if (token && token !== 'demo') {
      try {
        await firstValueFrom(
          this.http.delete(`${environment.apiUrl}/budgets/category/${encodeURIComponent(category)}`, {
            headers: this.authService.getAuthHeaders()
          })
        );
      } catch (error) {
        console.error('Failed to remove category budget via API:', error);
      }
    }
    
    this.budget.update(b => ({
      ...b,
      categoryBudgets: b.categoryBudgets.filter(cb => cb.category !== category)
    }));
    this.saveToStorage();
  }

  getCategoryBudget(category: ExpenseCategory): number | undefined {
    return this.budget().categoryBudgets.find(b => b.category === category)?.budgetAmount;
  }

  getBudgetStatus(category: ExpenseCategory): BudgetStatus {
    const summary = this.categoryBudgetSummaries().find(s => s.category === category);
    return summary?.status || 'green';
  }

  clearAll(): void {
    this.budget.set({
      overallBudget: undefined,
      categoryBudgets: []
    });
    this.saveToStorage();
  }
}
