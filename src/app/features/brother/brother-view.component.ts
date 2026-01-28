import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ExpenseService, SettlementService, AuthService, ContributionService } from '../../services';
import { BrotherId, BROTHERS, EXPENSE_CATEGORIES } from '../../models';
import { SummaryCardComponent } from '../../shared/components/summary-card/summary-card.component';
import { PieChartComponent, ChartDataItem } from '../../shared/components/charts/pie-chart.component';

@Component({
  selector: 'app-brother-view',
  standalone: true,
  imports: [CommonModule, SummaryCardComponent, PieChartComponent],
  template: `
    <div class="brother-view">
      <div class="welcome-header">
        <h1>Welcome, {{ getCurrentBrotherName() }}</h1>
        <p>View your share and ceremony expense details</p>
      </div>

      <!-- Personal Summary -->
      <section class="personal-section">
        <h2 class="section-title">📊 Your Summary</h2>
        <div class="summary-cards">
          <app-summary-card
            label="Total Ceremony Expenses"
            [value]="summary().totalExpenses"
            icon="💰"
            colorClass="blue">
          </app-summary-card>
          
          <app-summary-card
            label="Total Contributions"
            [value]="summary().totalContributions"
            icon="🤝"
            colorClass="green">
          </app-summary-card>
          
          <app-summary-card
            label="Net Expense"
            [value]="summary().netExpense"
            icon="📋"
            colorClass="purple"
            [subtitle]="'Shared by 4 brothers'">
          </app-summary-card>
          
          <app-summary-card
            label="Your Share"
            [value]="summary().sharePerBrother"
            icon="➗"
            colorClass="amber">
          </app-summary-card>
        </div>
      </section>

      <!-- Your Settlement Status -->
      <section class="settlement-section">
        <h2 class="section-title">⚖️ Your Settlement Status</h2>
        <div class="settlement-card" [class]="getStatusClass()">
          <div class="settlement-row">
            <span class="label">Amount You Paid:</span>
            <span class="value">₹{{ getMySettlement()?.paid | number:'1.2-2':'en-IN' }}</span>
          </div>
          <div class="settlement-row">
            <span class="label">Your Equal Share:</span>
            <span class="value">₹{{ getMySettlement()?.share | number:'1.2-2':'en-IN' }}</span>
          </div>
          <div class="divider"></div>
          <div class="settlement-row balance-row">
            <span class="label">Your Balance:</span>
            <span class="value" [class]="getBalanceClass()">
              {{ getBalanceText() }}
            </span>
          </div>
          <div class="status-message">
            <span class="status-icon">{{ getStatusIcon() }}</span>
            <span>{{ getStatusMessage() }}</span>
          </div>
        </div>
      </section>

      <!-- All Brothers Settlement -->
      <section class="brothers-section">
        <h2 class="section-title">👨‍👩‍👦‍👦 All Brothers Settlement</h2>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Brother</th>
                <th>Paid</th>
                <th>Share</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let brother of summary().brotherSettlements" [class.highlight]="brother.brotherId === currentBrotherId">
                <td class="brother-col">
                  <span class="avatar">{{ brother.name.charAt(0) }}</span>
                  {{ brother.name }}
                  <span class="you-badge" *ngIf="brother.brotherId === currentBrotherId">(You)</span>
                </td>
                <td>₹{{ brother.paid | number:'1.2-2':'en-IN' }}</td>
                <td>₹{{ brother.share | number:'1.2-2':'en-IN' }}</td>
                <td [class]="getBrotherBalanceClass(brother.balance)">
                  {{ brother.balance >= 0 ? '+' : '' }}₹{{ brother.balance | number:'1.2-2':'en-IN' }}
                </td>
                <td>
                  <span class="status-badge" [class]="getBrotherStatusClass(brother.balance)">
                    {{ getBrotherStatusText(brother.balance) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Category-wise Expenses -->
      <section class="categories-section">
        <h2 class="section-title">📂 Category-wise Expenses</h2>
        <div class="category-content">
          <div class="chart-container">
            <app-pie-chart
              title=""
              [data]="categoryChartData()">
            </app-pie-chart>
          </div>
          <div class="category-list">
            <div class="category-item" *ngFor="let cat of categorySummary()">
              <div class="category-info">
                <span class="category-name">{{ cat.category }}</span>
                <span class="category-count">{{ cat.expenseCount }} expense{{ cat.expenseCount !== 1 ? 's' : '' }}</span>
              </div>
              <div class="category-amount">
                ₹{{ cat.totalAmount | number:'1.2-2':'en-IN' }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Expenses -->
      <section class="expenses-section">
        <h2 class="section-title">📝 Recent Expenses</h2>
        <div class="table-container">
          <table class="data-table" *ngIf="recentExpenses().length > 0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Paid By</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let expense of recentExpenses()" [class.my-expense]="expense.paidBy === currentBrotherId">
                <td>{{ expense.date | date:'mediumDate' }}</td>
                <td>{{ expense.title }}</td>
                <td>
                  <span class="category-badge">{{ expense.category }}</span>
                </td>
                <td class="amount-col">₹{{ expense.amount | number:'1.2-2':'en-IN' }}</td>
                <td>
                  <span class="brother-badge" [class.highlight]="expense.paidBy === currentBrotherId">
                    {{ expense.paidBy }}
                    <span *ngIf="expense.paidBy === currentBrotherId">(You)</span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div class="empty-state" *ngIf="recentExpenses().length === 0">
            <p>No expenses recorded yet</p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .brother-view {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .welcome-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #5d6d7e 0%, #34495e 100%);
      border-radius: 12px;
      color: white;
    }
    
    .welcome-header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
    }
    
    .welcome-header p {
      margin: 0;
      opacity: 0.9;
      font-size: 0.9rem;
    }
    
    .section-title {
      font-size: 1.1rem;
      color: #2c3e50;
      margin: 0 0 1rem 0;
      font-weight: 600;
    }
    
    .personal-section,
    .settlement-section,
    .brothers-section,
    .categories-section,
    .expenses-section {
      margin-bottom: 2rem;
    }
    
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .settlement-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      max-width: 400px;
    }
    
    .settlement-card.to-pay {
      border-left: 4px solid #e74c3c;
    }
    
    .settlement-card.to-receive {
      border-left: 4px solid #27ae60;
    }
    
    .settlement-card.settled {
      border-left: 4px solid #95a5a6;
    }
    
    .settlement-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    
    .settlement-row .label {
      color: #7f8c8d;
    }
    
    .settlement-row .value {
      font-weight: 600;
      color: #2c3e50;
    }
    
    .divider {
      border-top: 1px dashed #ecf0f1;
      margin: 1rem 0;
    }
    
    .balance-row .value {
      font-size: 1.25rem;
    }
    
    .balance-positive {
      color: #e74c3c !important;
    }
    
    .balance-negative {
      color: #27ae60 !important;
    }
    
    .balance-zero {
      color: #95a5a6 !important;
    }
    
    .status-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
      font-size: 0.9rem;
      margin-top: 1rem;
    }
    
    .status-icon {
      font-size: 1.25rem;
    }
    
    .table-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      overflow-x: auto;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .data-table th {
      background: #f8f9fa;
      padding: 0.85rem 1rem;
      text-align: left;
      font-weight: 600;
      color: #5d6d7e;
      font-size: 0.8rem;
      text-transform: uppercase;
    }
    
    .data-table td {
      padding: 0.85rem 1rem;
      border-top: 1px solid #ecf0f1;
    }
    
    .data-table tr.highlight {
      background: #ebf5fb;
    }
    
    .data-table tr.my-expense {
      background: #fef9e7;
    }
    
    .brother-col {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .avatar {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #5d6d7e, #34495e);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
    }
    
    .you-badge {
      font-size: 0.75rem;
      color: #3498db;
      font-weight: 500;
    }
    
    .status-badge {
      padding: 0.3rem 0.6rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .status-to-pay {
      background: #fadbd8;
      color: #e74c3c;
    }
    
    .status-to-receive {
      background: #d5f5e3;
      color: #27ae60;
    }
    
    .status-settled {
      background: #ecf0f1;
      color: #7f8c8d;
    }
    
    .category-content {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 1.5rem;
      align-items: start;
    }
    
    .chart-container {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    .category-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .category-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: white;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    }
    
    .category-info {
      display: flex;
      flex-direction: column;
    }
    
    .category-name {
      font-weight: 500;
      color: #2c3e50;
      font-size: 0.9rem;
    }
    
    .category-count {
      font-size: 0.75rem;
      color: #95a5a6;
    }
    
    .category-amount {
      font-weight: 600;
      color: #2c3e50;
    }
    
    .category-badge {
      padding: 0.25rem 0.5rem;
      background: #ebf5fb;
      color: #3498db;
      border-radius: 4px;
      font-size: 0.8rem;
    }
    
    .brother-badge {
      padding: 0.25rem 0.5rem;
      background: #fef5e7;
      color: #f39c12;
      border-radius: 4px;
      font-size: 0.8rem;
    }
    
    .brother-badge.highlight {
      background: #ebf5fb;
      color: #3498db;
    }
    
    .amount-col {
      font-weight: 600;
    }
    
    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #95a5a6;
    }
    
    @media (max-width: 768px) {
      .brother-view {
        padding: 1rem;
      }
      
      .category-content {
        grid-template-columns: 1fr;
      }
      
      .data-table th,
      .data-table td {
        padding: 0.6rem 0.5rem;
        font-size: 0.8rem;
      }
    }
  `]
})
export class BrotherViewComponent implements OnInit {
  currentBrotherId: BrotherId = 'HNK';

  constructor(
    private route: ActivatedRoute,
    private expenseService: ExpenseService,
    private settlementService: SettlementService,
    private contributionService: ContributionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get brother ID from route or auth service
    const routeBrotherId = this.route.snapshot.paramMap.get('brotherId') as BrotherId;
    const authBrotherId = this.authService.getCurrentBrotherId();
    this.currentBrotherId = routeBrotherId || authBrotherId || 'HNK';
    
    // Load data from API
    this.expenseService.loadFromApi();
    this.contributionService.loadFromApi();
    this.settlementService.loadFromApi();
  }

  summary = this.settlementService.financialSummary;
  categorySummary = this.expenseService.categorySummary;

  getCurrentBrotherName(): string {
    const brother = BROTHERS.find(b => b.id === this.currentBrotherId);
    return brother?.name || this.currentBrotherId;
  }

  getMySettlement() {
    return this.summary().brotherSettlements.find(s => s.brotherId === this.currentBrotherId);
  }

  getStatusClass(): string {
    const settlement = this.getMySettlement();
    if (!settlement) return '';
    if (settlement.balance > 0.01) return 'to-pay';
    if (settlement.balance < -0.01) return 'to-receive';
    return 'settled';
  }

  getBalanceClass(): string {
    const settlement = this.getMySettlement();
    if (!settlement) return '';
    if (settlement.balance > 0.01) return 'balance-positive';
    if (settlement.balance < -0.01) return 'balance-negative';
    return 'balance-zero';
  }

  getBalanceText(): string {
    const settlement = this.getMySettlement();
    if (!settlement) return '₹0.00';
    const abs = Math.abs(settlement.balance);
    if (settlement.balance > 0.01) return `₹${abs.toFixed(2)} to pay`;
    if (settlement.balance < -0.01) return `₹${abs.toFixed(2)} to receive`;
    return '₹0.00 (Settled)';
  }

  getStatusIcon(): string {
    const settlement = this.getMySettlement();
    if (!settlement) return '⚖️';
    if (settlement.balance > 0.01) return '💸';
    if (settlement.balance < -0.01) return '💰';
    return '✅';
  }

  getStatusMessage(): string {
    const settlement = this.getMySettlement();
    if (!settlement) return '';
    if (settlement.balance > 0.01) {
      return `You need to pay ₹${settlement.balance.toFixed(2)} to settle`;
    }
    if (settlement.balance < -0.01) {
      return `You will receive ₹${Math.abs(settlement.balance).toFixed(2)} from settlement`;
    }
    return 'Your account is settled!';
  }

  getBrotherBalanceClass(balance: number): string {
    if (balance > 0.01) return 'balance-positive';
    if (balance < -0.01) return 'balance-negative';
    return 'balance-zero';
  }

  getBrotherStatusClass(balance: number): string {
    if (balance > 0.01) return 'status-to-pay';
    if (balance < -0.01) return 'status-to-receive';
    return 'status-settled';
  }

  getBrotherStatusText(balance: number): string {
    if (balance > 0.01) return 'To Pay';
    if (balance < -0.01) return 'To Receive';
    return 'Settled';
  }

  recentExpenses() {
    return this.expenseService.allExpenses()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }

  categoryChartData = computed<ChartDataItem[]>(() => {
    const colors = [
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
      '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
    ];
    
    return this.categorySummary().map((cat, i) => ({
      label: cat.category,
      value: cat.totalAmount,
      color: colors[i % colors.length]
    }));
  });
}
