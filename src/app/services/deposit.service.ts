import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Deposit, DepositFormData, DepositSummary, BrotherId } from '../models';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DepositService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/deposits`;
  
  // State
  deposits = signal<Deposit[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Computed values
  totalDeposits = computed(() => 
    this.deposits().reduce((sum, d) => sum + d.amount, 0)
  );

  depositsByBrother = computed(() => {
    const summary: DepositSummary = { HNK: 0, HNP: 0, HNS: 0, HNM: 0, total: 0 };
    this.deposits().forEach(d => {
      summary[d.depositedBy] += d.amount;
      summary.total += d.amount;
    });
    return summary;
  });

  // HNK's deposits (money HNK deposited himself)
  hnkDeposits = computed(() => 
    this.deposits()
      .filter(d => d.depositedBy === 'HNK')
      .reduce((sum, d) => sum + d.amount, 0)
  );

  // Other brothers' deposits with HNK
  otherDeposits = computed(() => 
    this.deposits()
      .filter(d => d.depositedBy !== 'HNK')
      .reduce((sum, d) => sum + d.amount, 0)
  );

  constructor() {
    this.loadDeposits();
  }

  loadDeposits(): void {
    this.loading.set(true);
    this.error.set(null);

    const token = this.authService.getToken();
    console.log('Deposit loadDeposits, token:', token ? token.substring(0, 20) + '...' : 'null');
    
    if (!token || token === 'demo') {
      // Demo mode - load from localStorage
      console.log('Deposits: Using localStorage mode');
      const stored = localStorage.getItem('deposits');
      this.deposits.set(stored ? JSON.parse(stored) : []);
      this.loading.set(false);
      return;
    }

    console.log('Deposits: Fetching from API...');
    this.http.get<Deposit[]>(this.apiUrl, { headers: this.authService.getAuthHeaders() })
      .subscribe({
        next: (deposits) => {
          console.log('Deposits: API returned', deposits.length, 'deposits');
          this.deposits.set(deposits.map(d => ({
            ...d,
            date: new Date(d.date),
            createdAt: new Date(d.createdAt),
            updatedAt: new Date(d.updatedAt)
          })));
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading deposits:', err);
          // Fallback to localStorage
          const stored = localStorage.getItem('deposits');
          this.deposits.set(stored ? JSON.parse(stored) : []);
          this.loading.set(false);
        }
      });
  }

  addDeposit(data: DepositFormData): void {
    const token = this.authService.getToken();
    console.log('Deposit addDeposit, token:', token ? token.substring(0, 20) + '...' : 'null');
    
    if (!token || token === 'demo') {
      // Demo mode
      console.log('Deposits: Adding to localStorage (demo mode)');
      const newDeposit: Deposit = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.deposits.update(deps => [...deps, newDeposit]);
      this.saveToLocalStorage();
      return;
    }

    console.log('Deposits: Adding via API...');
    this.http.post<Deposit>(this.apiUrl, data, { headers: this.authService.getAuthHeaders() })
      .subscribe({
        next: (deposit) => {
          console.log('Deposits: Added via API:', deposit.id);
          this.deposits.update(deps => [...deps, {
            ...deposit,
            date: new Date(deposit.date),
            createdAt: new Date(deposit.createdAt),
            updatedAt: new Date(deposit.updatedAt)
          }]);
        },
        error: (err) => {
          console.error('Error adding deposit:', err);
          this.error.set('Failed to add deposit');
        }
      });
  }

  updateDeposit(id: string, data: Partial<DepositFormData>): void {
    const token = this.authService.getToken();
    if (!token || token === 'demo') {
      // Demo mode
      this.deposits.update(deps => 
        deps.map(d => d.id === id ? { ...d, ...data, updatedAt: new Date() } : d)
      );
      this.saveToLocalStorage();
      return;
    }

    this.http.put<Deposit>(`${this.apiUrl}/${id}`, data, { headers: this.authService.getAuthHeaders() })
      .subscribe({
        next: (deposit) => {
          this.deposits.update(deps => 
            deps.map(d => d.id === id ? {
              ...deposit,
              date: new Date(deposit.date),
              createdAt: new Date(deposit.createdAt),
              updatedAt: new Date(deposit.updatedAt)
            } : d)
          );
        },
        error: (err) => {
          console.error('Error updating deposit:', err);
          this.error.set('Failed to update deposit');
        }
      });
  }

  deleteDeposit(id: string): void {
    const token = this.authService.getToken();
    if (!token || token === 'demo') {
      // Demo mode
      this.deposits.update(deps => deps.filter(d => d.id !== id));
      this.saveToLocalStorage();
      return;
    }

    this.http.delete(`${this.apiUrl}/${id}`, { headers: this.authService.getAuthHeaders() })
      .subscribe({
        next: () => {
          this.deposits.update(deps => deps.filter(d => d.id !== id));
        },
        error: (err) => {
          console.error('Error deleting deposit:', err);
          this.error.set('Failed to delete deposit');
        }
      });
  }

  getDepositsByBrother(brotherId: BrotherId): Deposit[] {
    return this.deposits().filter(d => d.depositedBy === brotherId);
  }

  getBrotherDepositTotal(brotherId: BrotherId): number {
    return this.getDepositsByBrother(brotherId).reduce((sum, d) => sum + d.amount, 0);
  }

  private saveToLocalStorage(): void {
    localStorage.setItem('deposits', JSON.stringify(this.deposits()));
  }
}
