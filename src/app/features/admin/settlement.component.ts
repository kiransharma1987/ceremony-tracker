import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettlementService } from '../../services/settlement.service';
import { ExpenseService } from '../../services/expense.service';

interface SettlementInstruction {
  from: string;
  to: string;
  amount: number;
}

interface BrotherSettlement {
  name: string;
  paid: number;
  share: number;
  balance: number;
}

@Component({
  selector: 'app-settlement',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="settlement">
      <div class="page-header">
        <h2 class="page-title">⚖️ Settlement</h2>
        <p class="subtitle">Calculate and manage fair expense settlement among brothers</p>
      </div>

      <!-- Brother Settlement Table -->
      <section class="settlement-section">
        <h3 class="section-title">👨‍👩‍👦‍👦 Brother Settlement</h3>
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
              <tr *ngFor="let brother of brotherSettlements()">
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
      <section class="instructions-section" *ngIf="settlementInstructions().length > 0">
        <h3 class="section-title">💸 Settlement Instructions</h3>
        <p class="section-subtitle">Who pays whom and how much</p>
        <div class="instructions-list">
          <div class="instruction-card" *ngFor="let instruction of settlementInstructions()">
            <span class="from">{{ instruction.from }}</span>
            <span class="arrow">→</span>
            <span class="amount">₹{{ instruction.amount | number:'1.2-2':'en-IN' }}</span>
            <span class="arrow">→</span>
            <span class="to">{{ instruction.to }}</span>
          </div>
        </div>
      </section>

      <!-- Event Status -->
      <section class="status-section" *ngIf="settlementService.isClosed()">
        <div class="closed-banner">
          🔒 Event Closed on {{ settlementService.status().closedAt | date:'medium' }}
        </div>
      </section>

      <div *ngIf="settlementInstructions().length === 0" class="empty-state">
        <p>No settlement data yet. Add expenses to calculate settlement.</p>
      </div>
    </div>
  `,
  styles: [`
    .settlement {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-title {
      font-size: 1.25rem;
      color: #2c3e50;
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      color: #7f8c8d;
      margin: 0;
      font-size: 0.9rem;
    }

    .section-title {
      font-size: 1.1rem;
      color: #2c3e50;
      margin: 0 0 1rem 0;
      font-weight: 600;
    }

    .section-subtitle {
      color: #7f8c8d;
      margin: 0 0 1rem 0;
      font-size: 0.9rem;
    }

    .settlement-section,
    .instructions-section,
    .status-section {
      margin-bottom: 2rem;
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .table-container {
      overflow-x: auto;
    }

    .settlement-table {
      width: 100%;
      border-collapse: collapse;
    }

    .settlement-table thead {
      background-color: #ecf0f1;
    }

    .settlement-table th {
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: #2c3e50;
      border-bottom: 2px solid #bdc3c7;
    }

    .settlement-table td {
      padding: 1rem;
      border-bottom: 1px solid #ecf0f1;
      color: #555;
    }

    .settlement-table tbody tr:hover {
      background-color: #f8f9fa;
    }

    .brother-name {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 600;
      color: #2c3e50;
    }

    .avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: bold;
      font-size: 1rem;
    }

    .status-badge {
      display: inline-block;
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .status-badge.settled {
      background-color: #d4edda;
      color: #155724;
    }

    .status-badge.owes {
      background-color: #fff3cd;
      color: #856404;
    }

    .status-badge.owed {
      background-color: #d1ecf1;
      color: #0c5460;
    }

    td.balance-positive {
      color: #27ae60;
      font-weight: 600;
    }

    td.balance-negative {
      color: #e74c3c;
      font-weight: 600;
    }

    td.balance-zero {
      color: #27ae60;
      font-weight: 600;
    }

    .instructions-list {
      display: grid;
      gap: 1rem;
    }

    .instruction-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 6px;
      border-left: 4px solid #667eea;
    }

    .from,
    .to {
      font-weight: 600;
      color: #2c3e50;
      min-width: 120px;
    }

    .arrow {
      color: #bdc3c7;
      font-weight: bold;
    }

    .amount {
      font-weight: bold;
      color: #27ae60;
      font-size: 1.1rem;
    }

    .closed-banner {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem;
      border-radius: 6px;
      text-align: center;
      font-weight: 600;
      margin: 0;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #7f8c8d;
    }

    @media (max-width: 768px) {
      .settlement {
        padding: 1rem;
      }

      .settlement-table {
        font-size: 0.9rem;
      }

      .settlement-table th,
      .settlement-table td {
        padding: 0.75rem 0.5rem;
      }

      .instruction-card {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .from,
      .to {
        min-width: auto;
      }
    }
  `]
})
export class SettlementComponent {
  constructor(
    public settlementService: SettlementService,
    private expenseService: ExpenseService
  ) {}

  readonly summary = this.settlementService.financialSummary;

  readonly brotherSettlements = computed(() => {
    return this.summary().brotherSettlements;
  });

  readonly settlementInstructions = computed(() => {
    return this.summary().settlementInstructions;
  });

  getBalanceClass(balance: number): string {
    if (balance > 0.01) return 'balance-positive';
    if (balance < -0.01) return 'balance-negative';
    return 'balance-zero';
  }

  getStatusClass(balance: number): string {
    if (Math.abs(balance) < 0.01) return 'settled';
    if (balance > 0.01) return 'owed';
    return 'owes';
  }

  getStatusText(balance: number): string {
    if (Math.abs(balance) < 0.01) return 'SETTLED';
    if (balance > 0.01) return 'TO RECEIVE';
    return 'TO PAY';
  }
}
