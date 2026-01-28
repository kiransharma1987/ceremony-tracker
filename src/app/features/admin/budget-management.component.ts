import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService, SettlementService } from '../../services';
import { EXPENSE_CATEGORIES, ExpenseCategory } from '../../models';
import { BudgetIndicatorComponent } from '../../shared/components/budget-indicator/budget-indicator.component';

@Component({
  selector: 'app-budget-management',
  standalone: true,
  imports: [CommonModule, FormsModule, BudgetIndicatorComponent],
  template: `
    <div class="budget-management">
      <div class="page-header">
        <h2 class="page-title">📊 Budget Management</h2>
      </div>

      <!-- Info Banner -->
      <div class="info-banner">
        <span class="info-icon">ℹ️</span>
        <p>
          Budgets are advisory only and do not block expense entry. 
          Set overall and category-wise budgets to track spending.
        </p>
      </div>

      <!-- Overall Budget -->
      <section class="budget-section">
        <h3 class="section-title">Overall Budget</h3>
        <div class="overall-budget-card">
          <div class="budget-input-row">
            <label>Total Budget Amount (₹)</label>
            <div class="input-group">
              <input 
                type="number" 
                [(ngModel)]="overallBudgetInput"
                min="0"
                step="100"
                placeholder="Enter overall budget"
                [disabled]="settlementService.isClosed()">
              <button 
                class="btn btn-primary"
                (click)="saveOverallBudget()"
                [disabled]="settlementService.isClosed()">
                Save
              </button>
              <button 
                class="btn btn-secondary"
                (click)="clearOverallBudget()"
                [disabled]="settlementService.isClosed() || !budgetService.overallBudget()">
                Clear
              </button>
            </div>
          </div>
          
          <div class="budget-summary" *ngIf="budgetService.overallBudget()">
            <app-budget-indicator
              [budget]="budgetService.overallBudgetSummary().budget"
              [spent]="budgetService.overallBudgetSummary().spent"
              [status]="budgetService.overallBudgetSummary().status">
            </app-budget-indicator>
          </div>
        </div>
      </section>

      <!-- Category Budgets -->
      <section class="budget-section">
        <h3 class="section-title">Category-wise Budgets</h3>
        <div class="category-budgets-grid">
          <div class="category-budget-card" *ngFor="let summary of budgetService.categoryBudgetSummaries()">
            <div class="category-header">
              <span class="category-name">{{ summary.category }}</span>
              <span class="spent-amount">₹{{ summary.spent | number:'1.0-0':'en-IN' }} spent</span>
            </div>
            
            <div class="budget-input-row">
              <div class="input-group compact">
                <span class="currency">₹</span>
                <input 
                  type="number" 
                  [value]="summary.budget || ''"
                  (change)="updateCategoryBudget(summary.category, $event)"
                  min="0"
                  step="100"
                  placeholder="Set budget"
                  [disabled]="settlementService.isClosed()">
              </div>
            </div>
            
            <div class="budget-indicator-container" *ngIf="summary.budget > 0">
              <app-budget-indicator
                [budget]="summary.budget"
                [spent]="summary.spent"
                [status]="summary.status">
              </app-budget-indicator>
            </div>
            
            <div class="no-budget" *ngIf="!summary.budget">
              <span>No budget set</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Budget Summary Table/Cards -->
      <section class="budget-section">
        <h3 class="section-title">Budget Summary</h3>
        <div class="table-container">
          <!-- Desktop Table View -->
          <table class="data-table desktop-view">
            <thead>
              <tr>
                <th>Category</th>
                <th>Budget</th>
                <th>Spent</th>
                <th>Remaining</th>
                <th>% Used</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let summary of budgetService.categoryBudgetSummaries()">
                <td>{{ summary.category }}</td>
                <td>{{ summary.budget > 0 ? '₹' + (summary.budget | number:'1.0-0':'en-IN') : '-' }}</td>
                <td>₹{{ summary.spent | number:'1.0-0':'en-IN' }}</td>
                <td [class]="summary.remaining < 0 ? 'negative' : ''">
                  {{ summary.budget > 0 ? (summary.remaining >= 0 ? '₹' : '-₹') + (Math.abs(summary.remaining) | number:'1.0-0':'en-IN') : '-' }}
                </td>
                <td>{{ summary.budget > 0 ? (summary.percentUsed | number:'1.0-0') + '%' : '-' }}</td>
                <td>
                  <span class="status-dot" [class]="summary.budget > 0 ? summary.status : 'none'"></span>
                </td>
              </tr>
            </tbody>
            <tfoot *ngIf="budgetService.overallBudget()">
              <tr>
                <td><strong>Overall</strong></td>
                <td><strong>₹{{ budgetService.overallBudgetSummary().budget | number:'1.0-0':'en-IN' }}</strong></td>
                <td><strong>₹{{ budgetService.overallBudgetSummary().spent | number:'1.0-0':'en-IN' }}</strong></td>
                <td [class]="budgetService.overallBudgetSummary().remaining < 0 ? 'negative' : ''">
                  <strong>{{ (budgetService.overallBudgetSummary().remaining >= 0 ? '₹' : '-₹') + (Math.abs(budgetService.overallBudgetSummary().remaining) | number:'1.0-0':'en-IN') }}</strong>
                </td>
                <td><strong>{{ budgetService.overallBudgetSummary().percentUsed | number:'1.0-0' }}%</strong></td>
                <td>
                  <span class="status-dot" [class]="budgetService.overallBudgetSummary().status"></span>
                </td>
              </tr>
            </tfoot>
          </table>

          <!-- Mobile Card View -->
          <div class="cards-view mobile-view">
            <div class="budget-card" *ngFor="let summary of budgetService.categoryBudgetSummaries()">
              <div class="card-header">
                <span class="card-title">{{ summary.category }}</span>
                <span class="status-dot" [class]="summary.budget > 0 ? summary.status : 'none'"></span>
              </div>
              <div class="card-body">
                <div class="card-field">
                  <span class="label">Budget</span>
                  <span class="value">{{ summary.budget > 0 ? '₹' + (summary.budget | number:'1.0-0':'en-IN') : '-' }}</span>
                </div>
                <div class="card-field">
                  <span class="label">Spent</span>
                  <span class="value amount">₹{{ summary.spent | number:'1.0-0':'en-IN' }}</span>
                </div>
                <div class="card-field">
                  <span class="label">Remaining</span>
                  <span class="value" [class]="summary.remaining < 0 ? 'negative' : 'positive'">
                    {{ summary.budget > 0 ? (summary.remaining >= 0 ? '₹' : '-₹') + (Math.abs(summary.remaining) | number:'1.0-0':'en-IN') : '-' }}
                  </span>
                </div>
                <div class="card-field">
                  <span class="label">% Used</span>
                  <span class="value">{{ summary.budget > 0 ? (summary.percentUsed | number:'1.0-0') + '%' : '-' }}</span>
                </div>
              </div>
            </div>
            
            <!-- Overall Summary Card -->
            <div class="budget-card overall" *ngIf="budgetService.overallBudget()">
              <div class="card-header">
                <span class="card-title overall-title">Overall Budget</span>
                <span class="status-dot" [class]="budgetService.overallBudgetSummary().status"></span>
              </div>
              <div class="card-body">
                <div class="card-field">
                  <span class="label">Budget</span>
                  <span class="value">₹{{ budgetService.overallBudgetSummary().budget | number:'1.0-0':'en-IN' }}</span>
                </div>
                <div class="card-field">
                  <span class="label">Spent</span>
                  <span class="value amount">₹{{ budgetService.overallBudgetSummary().spent | number:'1.0-0':'en-IN' }}</span>
                </div>
                <div class="card-field">
                  <span class="label">Remaining</span>
                  <span class="value" [class]="budgetService.overallBudgetSummary().remaining < 0 ? 'negative' : 'positive'">
                    {{ (budgetService.overallBudgetSummary().remaining >= 0 ? '₹' : '-₹') + (Math.abs(budgetService.overallBudgetSummary().remaining) | number:'1.0-0':'en-IN') }}
                  </span>
                </div>
                <div class="card-field">
                  <span class="label">% Used</span>
                  <span class="value">{{ budgetService.overallBudgetSummary().percentUsed | number:'1.0-0' }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Legend -->
      <div class="legend">
        <div class="legend-item">
          <span class="status-dot green"></span>
          <span>Under 70% - On track</span>
        </div>
        <div class="legend-item">
          <span class="status-dot amber"></span>
          <span>70-90% - Caution</span>
        </div>
        <div class="legend-item">
          <span class="status-dot red"></span>
          <span>Over 90% - Alert</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .budget-management {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .page-header {
      margin-bottom: 1.5rem;
    }
    
    .page-title {
      font-size: 1.25rem;
      color: #2c3e50;
      margin: 0;
    }
    
    .info-banner {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      background: #fef9e7;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      align-items: flex-start;
    }
    
    .info-icon {
      font-size: 1.25rem;
    }
    
    .info-banner p {
      margin: 0;
      color: #9a7b4f;
      font-size: 0.9rem;
      line-height: 1.5;
    }
    
    .budget-section {
      margin-bottom: 2rem;
    }
    
    .section-title {
      font-size: 1rem;
      color: #5d6d7e;
      margin: 0 0 1rem 0;
      font-weight: 600;
    }
    
    .overall-budget-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    .budget-input-row {
      margin-bottom: 1rem;
    }
    
    .budget-input-row label {
      display: block;
      font-size: 0.85rem;
      color: #7f8c8d;
      margin-bottom: 0.5rem;
    }
    
    .input-group {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    
    .input-group input {
      flex: 1;
      max-width: 200px;
      padding: 0.6rem;
      border: 1px solid #dfe6e9;
      border-radius: 8px;
      font-size: 0.95rem;
    }
    
    .input-group input:focus {
      outline: none;
      border-color: #3498db;
    }
    
    .input-group input:disabled {
      background: #f8f9fa;
      cursor: not-allowed;
    }
    
    .input-group.compact {
      position: relative;
    }
    
    .input-group.compact .currency {
      position: absolute;
      left: 10px;
      color: #7f8c8d;
    }
    
    .input-group.compact input {
      padding-left: 24px;
      max-width: 120px;
    }
    
    .btn {
      padding: 0.6rem 1rem;
      border: none;
      border-radius: 8px;
      font-size: 0.85rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .btn-primary {
      background: #3498db;
      color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
      background: #2980b9;
    }
    
    .btn-secondary {
      background: #ecf0f1;
      color: #7f8c8d;
    }
    
    .btn-secondary:hover:not(:disabled) {
      background: #dfe6e9;
    }
    
    .category-budgets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }
    
    .category-budget-card {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    
    .category-name {
      font-weight: 500;
      color: #2c3e50;
      font-size: 0.9rem;
    }
    
    .spent-amount {
      font-size: 0.8rem;
      color: #7f8c8d;
    }
    
    .budget-indicator-container {
      margin-top: 0.75rem;
    }
    
    .no-budget {
      margin-top: 0.75rem;
      padding: 0.5rem;
      background: #f8f9fa;
      border-radius: 6px;
      text-align: center;
      font-size: 0.8rem;
      color: #95a5a6;
    }
    
    /* Table */
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
      padding: 0.75rem 1rem;
      text-align: left;
      font-weight: 600;
      color: #5d6d7e;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .data-table td {
      padding: 0.75rem 1rem;
      border-top: 1px solid #ecf0f1;
      font-size: 0.9rem;
    }
    
    .data-table tfoot td {
      background: #f8f9fa;
      border-top: 2px solid #dfe6e9;
    }
    
    .negative {
      color: #e74c3c;
    }
    
    .status-dot {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    
    .status-dot.green {
      background: #27ae60;
    }
    
    .status-dot.amber {
      background: #f39c12;
    }
    
    .status-dot.red {
      background: #e74c3c;
    }
    
    .status-dot.none {
      background: #dfe6e9;
    }
    
    .legend {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      flex-wrap: wrap;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: #5d6d7e;
    }

    /* Mobile Card View */
    .cards-view {
      display: none;
      flex-direction: column;
      gap: 1rem;
    }

    .budget-card {
      background: white;
      border-radius: 12px;
      border: 1px solid #ecf0f1;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .budget-card.overall {
      border: 2px solid #3498db;
      background: #f8f9fa;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f8f9fa;
      border-bottom: 1px solid #ecf0f1;
    }

    .budget-card.overall .card-header {
      background: #e3f2fd;
    }

    .card-title {
      font-weight: 600;
      color: #2c3e50;
      font-size: 0.95rem;
    }

    .card-title.overall-title {
      color: #1565c0;
    }

    .card-body {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .card-field {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .card-field .label {
      font-size: 0.8rem;
      color: #7f8c8d;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-width: 80px;
    }

    .card-field .value {
      font-size: 0.95rem;
      color: #2c3e50;
      text-align: right;
      flex: 1;
      font-weight: 500;
    }

    .card-field .value.amount {
      color: #27ae60;
      font-weight: 600;
    }

    .card-field .value.positive {
      color: #27ae60;
    }

    .card-field .value.negative {
      color: #e74c3c;
      font-weight: 600;
    }
    
    @media (max-width: 768px) {
      .budget-management {
        padding: 1rem;
      }

      .desktop-view {
        display: none;
      }

      .mobile-view {
        display: flex;
      }
      
      .category-budgets-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 480px) {
      .budget-management {
        padding: 0.75rem;
      }

      .card-header {
        padding: 0.75rem;
      }

      .card-body {
        padding: 0.75rem;
        gap: 0.5rem;
      }

      .card-field {
        flex-direction: column;
        align-items: stretch;
      }

      .card-field .label {
        min-width: auto;
      }

      .card-field .value {
        text-align: left;
      }

      .category-budget-card {
        padding: 0.75rem;
      }
    }
  `]
})
export class BudgetManagementComponent {
  Math = Math;
  categories = EXPENSE_CATEGORIES;
  overallBudgetInput = 0;

  constructor(
    public budgetService: BudgetService,
    public settlementService: SettlementService
  ) {
    this.overallBudgetInput = this.budgetService.overallBudget() || 0;
  }

  saveOverallBudget(): void {
    if (this.overallBudgetInput > 0) {
      this.budgetService.setOverallBudget(this.overallBudgetInput);
    }
  }

  clearOverallBudget(): void {
    this.budgetService.setOverallBudget(undefined);
    this.overallBudgetInput = 0;
  }

  updateCategoryBudget(category: ExpenseCategory, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value) || 0;
    
    if (value > 0) {
      this.budgetService.setCategoryBudget(category, value);
    } else {
      this.budgetService.removeCategoryBudget(category);
    }
  }
}
