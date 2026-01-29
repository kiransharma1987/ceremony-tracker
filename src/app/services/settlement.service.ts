import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { 
  FinancialSummary, 
  BrotherSettlement, 
  SettlementInstruction,
  BrotherId,
  BROTHERS,
  EventStatus
} from '../models';
import { ExpenseService } from './expense.service';
import { ContributionService } from './contribution.service';
import { DepositService } from './deposit.service';

@Injectable({
  providedIn: 'root'
})
export class SettlementService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  private eventStatus = signal<EventStatus>({
    isClosed: false
  });

  readonly status = this.eventStatus.asReadonly();
  readonly isClosed = computed(() => this.eventStatus().isClosed);

  readonly financialSummary = computed((): FinancialSummary => {
    const totalExpenses = this.expenseService.totalExpenses();
    const totalContributions = this.contributionService.totalContributions();
    const totalDeposits = this.depositService.totalDeposits();
    
    // Net expense to be shared by brothers
    const rawNetExpense = totalExpenses - totalContributions;
    const netExpense = Math.max(0, rawNetExpense);
    const surplus = rawNetExpense < 0 ? Math.abs(rawNetExpense) : 0;
    
    // Equal share per brother (4 brothers)
    const sharePerBrother = netExpense / 4;
    
    // Calculate each brother's settlement
    const expensesByBrother = this.expenseService.expensesByBrother();
    const depositsByBrother = this.depositService.depositsByBrother();
    
    const brotherSettlements: BrotherSettlement[] = BROTHERS.map(brother => {
      const paid = expensesByBrother.get(brother.id) || 0;
      const deposited = depositsByBrother[brother.id] || 0;
      // Share is reduced by deposits already paid
      const adjustedShare = sharePerBrother - deposited;
      const balance = adjustedShare - paid;
      
      return {
        brotherId: brother.id,
        name: brother.name,
        paid,
        share: sharePerBrother,
        balance // positive = owes money, negative = should receive money
      };
    });
    
    // Generate settlement instructions
    const settlementInstructions = this.calculateSettlementInstructions(brotherSettlements);
    
    return {
      totalExpenses,
      totalContributions,
      netExpense,
      surplus,
      sharePerBrother,
      brotherSettlements,
      settlementInstructions
    };
  });

  readonly totalBalancesSum = computed(() => {
    // This should always equal zero if calculations are correct
    return this.financialSummary().brotherSettlements
      .reduce((sum, bs) => sum + bs.balance, 0);
  });

  constructor(
    private expenseService: ExpenseService,
    private contributionService: ContributionService,
    private depositService: DepositService
  ) {
    this.loadFromStorage();
  }

  async loadFromApi(): Promise<void> {
    const token = this.authService.getToken();
    if (!token || token === 'demo') {
      return;
    }

    try {
      // Get productId from auth service or localStorage (for SUPER_ADMIN)
      let productId = this.authService.productId();
      if (!productId) {
        productId = localStorage.getItem('selectedProductId') || undefined;
      }
      
      const urlParams = productId ? `?productId=${productId}` : '';
      
      const settings = await firstValueFrom(
        this.http.get<any>(`${environment.apiUrl}/budgets/settings${urlParams}`, {
          headers: this.authService.getAuthHeaders()
        })
      );
      
      this.eventStatus.set({
        isClosed: settings.isClosed || false,
        closedAt: settings.closedAt ? new Date(settings.closedAt) : undefined
      });
    } catch (error) {
      console.error('Failed to load status from API:', error);
    }
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('ceremony_event_status');
    if (stored) {
      try {
        const data = JSON.parse(stored) as EventStatus;
        if (data.closedAt) {
          data.closedAt = new Date(data.closedAt);
        }
        this.eventStatus.set(data);
      } catch {
        console.error('Failed to load event status from storage');
      }
    }
  }

  private saveToStorage(): void {
    localStorage.setItem('ceremony_event_status', JSON.stringify(this.eventStatus()));
  }

  private calculateSettlementInstructions(settlements: BrotherSettlement[]): SettlementInstruction[] {
    const instructions: SettlementInstruction[] = [];
    
    // Separate into debtors (owe money) and creditors (should receive)
    const debtors = settlements
      .filter(s => s.balance > 0.01) // owes money
      .map(s => ({ id: s.brotherId, amount: s.balance }))
      .sort((a, b) => b.amount - a.amount);
    
    const creditors = settlements
      .filter(s => s.balance < -0.01) // should receive money
      .map(s => ({ id: s.brotherId, amount: Math.abs(s.balance) }))
      .sort((a, b) => b.amount - a.amount);
    
    // Match debtors to creditors
    let debtorIdx = 0;
    let creditorIdx = 0;
    
    while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
      const debtor = debtors[debtorIdx];
      const creditor = creditors[creditorIdx];
      
      const transferAmount = Math.min(debtor.amount, creditor.amount);
      
      if (transferAmount > 0.01) {
        instructions.push({
          from: debtor.id,
          to: creditor.id,
          amount: Math.round(transferAmount * 100) / 100 // Round to 2 decimal places
        });
      }
      
      debtor.amount -= transferAmount;
      creditor.amount -= transferAmount;
      
      if (debtor.amount < 0.01) debtorIdx++;
      if (creditor.amount < 0.01) creditorIdx++;
    }
    
    return instructions;
  }

  getBrotherSettlement(brotherId: BrotherId): BrotherSettlement | undefined {
    return this.financialSummary().brotherSettlements.find(s => s.brotherId === brotherId);
  }

  // Verify all balances sum to zero (accounting integrity check)
  verifyBalances(): boolean {
    const sum = this.totalBalancesSum();
    return Math.abs(sum) < 0.01; // Allow for floating point errors
  }

  // Close the event - no more edits allowed
  async closeEvent(closedBy: string): Promise<boolean> {
    if (!this.verifyBalances()) {
      console.error('Cannot close event: balances do not sum to zero');
      return false;
    }
    
    const token = this.authService.getToken();
    
    if (token && token !== 'demo') {
      try {
        await firstValueFrom(
          this.http.put(`${environment.apiUrl}/budgets/settings/close`, {}, {
            headers: this.authService.getAuthHeaders()
          })
        );
      } catch (error) {
        console.error('Failed to close event via API:', error);
      }
    }
    
    this.eventStatus.set({
      isClosed: true,
      closedAt: new Date(),
      closedBy
    });
    this.saveToStorage();
    return true;
  }

  // Reopen event (admin only, for corrections)
  async reopenEvent(): Promise<void> {
    const token = this.authService.getToken();
    
    if (token && token !== 'demo') {
      try {
        await firstValueFrom(
          this.http.put(`${environment.apiUrl}/budgets/settings/reopen`, {}, {
            headers: this.authService.getAuthHeaders()
          })
        );
      } catch (error) {
        console.error('Failed to reopen event via API:', error);
      }
    }
    
    this.eventStatus.set({
      isClosed: false
    });
    this.saveToStorage();
  }

  clearStatus(): void {
    this.eventStatus.set({ isClosed: false });
    this.saveToStorage();
  }
}
