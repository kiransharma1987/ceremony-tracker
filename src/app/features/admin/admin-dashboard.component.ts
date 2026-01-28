import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseService, ContributionService, SettlementService, BudgetService } from '../../services';
import { SummaryCardComponent } from '../../shared/components/summary-card/summary-card.component';
import { PieChartComponent, ChartDataItem } from '../../shared/components/charts/pie-chart.component';
import { BarChartComponent, BarChartDataItem } from '../../shared/components/charts/bar-chart.component';
import { EXPENSE_CATEGORIES } from '../../models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    SummaryCardComponent,
    PieChartComponent,
    BarChartComponent
  ],
  template: `
    <div class="dashboard">
      <!-- Financial Summary Cards -->
      <section class="summary-section">
        <h2 class="section-title">📊 Financial Summary</h2>
        <div class="summary-cards">
          <app-summary-card
            label="Total Expenses"
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
            [subtitle]="'To be shared by 4 brothers'">
          </app-summary-card>
          
          <app-summary-card
            label="Share Per Brother"
            [value]="summary().sharePerBrother"
            icon="👥"
            colorClass="amber">
          </app-summary-card>
        </div>
        
        <div class="surplus-notice" *ngIf="summary().surplus > 0">
          🎉 Surplus Amount: ₹{{ summary().surplus | number:'1.2-2':'en-IN' }}
          <span class="surplus-note">(Contributions exceeded expenses)</span>
        </div>
      </section>

      <!-- Brother Settlement Table -->
      <section class="settlement-section">
        <h2 class="section-title">👨‍👩‍👦‍👦 Brother Settlement</h2>
        <div class="table-container">
          <table class="settlement-table">
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
              <tr *ngFor="let brother of summary().brotherSettlements">
                <td class="brother-name">
                  <span class="avatar">{{ brother.name.charAt(0) }}</span>
                  {{ brother.name }}
                </td>
                <td>₹{{ brother.paid | number:'1.2-2':'en-IN' }}</td>
                <td>₹{{ brother.share | number:'1.2-2':'en-IN' }}</td>
                <td [class]="getBalanceClass(brother.balance)">
                  {{ brother.balance >= 0 ? '+' : '' }}₹{{ brother.balance | number:'1.2-2':'en-IN' }}
                </td>
                <td>
                  <span class="status-badge" [class]="getStatusClass(brother.balance)">
                    {{ getStatusText(brother.balance) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Settlement Instructions -->
      <section class="instructions-section" *ngIf="summary().settlementInstructions.length > 0">
        <h2 class="section-title">💸 Settlement Instructions</h2>
        <div class="instructions-list">
          <div class="instruction-card" *ngFor="let instruction of summary().settlementInstructions">
            <span class="from">{{ instruction.from }}</span>
            <span class="arrow">→</span>
            <span class="amount">₹{{ instruction.amount | number:'1.2-2':'en-IN' }}</span>
            <span class="arrow">→</span>
            <span class="to">{{ instruction.to }}</span>
          </div>
        </div>
      </section>

      <!-- Charts Section -->
      <section class="charts-section">
        <div class="charts-grid">
          <app-pie-chart
            title="Expenses by Category"
            [data]="categoryChartData">
          </app-pie-chart>
          
          <app-bar-chart
            title="Budget vs Actual"
            [data]="budgetChartData">
          </app-bar-chart>
        </div>
      </section>

      <!-- Category Summary -->
      <section class="category-section">
        <h2 class="section-title">📂 Category-wise Expenses</h2>
        <div class="category-grid">
          <div class="category-card" *ngFor="let cat of categorySummary()">
            <div class="category-header">
              <span class="category-name">{{ cat.category }}</span>
              <span class="category-percent">{{ cat.percentage | number:'1.1-1' }}%</span>
            </div>
            <div class="category-amount">₹{{ cat.totalAmount | number:'1.2-2':'en-IN' }}</div>
            <div class="category-count">{{ cat.expenseCount }} expense{{ cat.expenseCount !== 1 ? 's' : '' }}</div>
          </div>
        </div>
      </section>

      <!-- Event Status -->
      <section class="status-section" *ngIf="settlementService.isClosed()">
        <div class="closed-banner">
          🔒 Event Closed on {{ settlementService.status().closedAt | date:'medium' }}
        </div>
      </section>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .section-title {
      font-size: 1.1rem;
      color: #2c3e50;
      margin: 0 0 1rem 0;
      font-weight: 600;
    }
    
    .summary-section {
      margin-bottom: 2rem;
    }
    
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }
    
    .surplus-notice {
      margin-top: 1rem;
      padding: 1rem;
      background: #d5f5e3;
      border-radius: 8px;
      color: #27ae60;
      font-weight: 500;
    }
    
    .surplus-note {
      font-size: 0.85rem;
      font-weight: 400;
      opacity: 0.8;
    }
    
    .settlement-section {
      margin-bottom: 2rem;
    }
    
    .table-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      overflow-x: auto;
    }
    
    .settlement-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .settlement-table th {
      background: #f8f9fa;
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: #5d6d7e;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .settlement-table td {
      padding: 1rem;
      border-top: 1px solid #ecf0f1;
      font-size: 0.95rem;
    }
    
    .brother-name {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 500;
    }
    
    .avatar {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #5d6d7e, #34495e);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 600;
    }
    
    .balance-positive {
      color: #e74c3c;
      font-weight: 600;
    }
    
    .balance-negative {
      color: #27ae60;
      font-weight: 600;
    }
    
    .balance-zero {
      color: #7f8c8d;
    }
    
    .status-badge {
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
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
    
    .instructions-section {
      margin-bottom: 2rem;
    }
    
    .instructions-list {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .instruction-card {
      background: white;
      border-radius: 12px;
      padding: 1rem 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 500;
    }
    
    .from, .to {
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      font-size: 0.9rem;
    }
    
    .from {
      background: #fadbd8;
      color: #e74c3c;
    }
    
    .to {
      background: #d5f5e3;
      color: #27ae60;
    }
    
    .amount {
      font-size: 1.1rem;
      color: #2c3e50;
    }
    
    .arrow {
      color: #bdc3c7;
      font-size: 1.25rem;
    }
    
    .charts-section {
      margin-bottom: 2rem;
    }
    
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
    }
    
    .category-section {
      margin-bottom: 2rem;
    }
    
    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .category-card {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    
    .category-name {
      font-size: 0.85rem;
      color: #7f8c8d;
    }
    
    .category-percent {
      font-size: 0.75rem;
      color: #3498db;
      font-weight: 600;
    }
    
    .category-amount {
      font-size: 1.25rem;
      font-weight: 600;
      color: #2c3e50;
    }
    
    .category-count {
      font-size: 0.75rem;
      color: #95a5a6;
      margin-top: 0.25rem;
    }
    
    .closed-banner {
      background: linear-gradient(135deg, #5d6d7e, #34495e);
      color: white;
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
      font-weight: 500;
    }
    
    @media (max-width: 768px) {
      .dashboard {
        padding: 1rem;
      }
      
      .charts-grid {
        grid-template-columns: 1fr;
      }
      
      .settlement-table th,
      .settlement-table td {
        padding: 0.75rem 0.5rem;
        font-size: 0.85rem;
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  constructor(
    private expenseService: ExpenseService,
    private contributionService: ContributionService,
    public settlementService: SettlementService,
    private budgetService: BudgetService
  ) {}

  ngOnInit(): void {
    // Load data from API
    this.expenseService.loadFromApi();
    this.contributionService.loadFromApi();
    this.budgetService.loadFromApi();
    this.settlementService.loadFromApi();
  }

  summary = this.settlementService.financialSummary;
  categorySummary = this.expenseService.categorySummary;

  get categoryChartData(): ChartDataItem[] {
    const colors = [
      '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
      '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
    ];
    
    return this.categorySummary().map((cat, i) => ({
      label: cat.category,
      value: cat.totalAmount,
      color: colors[i % colors.length]
    }));
  }

  get budgetChartData(): BarChartDataItem[] {
    const budgetSummaries = this.budgetService.categoryBudgetSummaries();
    return budgetSummaries
      .filter(bs => bs.budget > 0 || bs.spent > 0)
      .map(bs => ({
        label: bs.category.split(' ')[0], // Shorten labels
        budget: bs.budget,
        actual: bs.spent
      }));
  }

  getBalanceClass(balance: number): string {
    if (balance > 0.01) return 'balance-positive';
    if (balance < -0.01) return 'balance-negative';
    return 'balance-zero';
  }

  getStatusClass(balance: number): string {
    if (balance > 0.01) return 'status-to-pay';
    if (balance < -0.01) return 'status-to-receive';
    return 'status-settled';
  }

  getStatusText(balance: number): string {
    if (balance > 0.01) return 'To Pay';
    if (balance < -0.01) return 'To Receive';
    return 'Settled';
  }
}
