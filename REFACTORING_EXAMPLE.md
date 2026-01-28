// DRAFT - Example Component Refactoring
// This shows how to refactor ExpenseManagementComponent to use ProductConfig
// File: src/app/features/admin/expense-management.component.refactored.ts.draft

import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService, SettlementService, ProductConfigService } from '../../services';
import { 
  Expense, 
  ExpenseFormData
} from '../../models';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-expense-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  template: `
    <div class="expense-management">
      <div class="page-header">
        <h2 class="page-title">💰 Expense Management</h2>
        <button class="btn btn-primary" (click)="openAddForm()" [disabled]="settlementService.isClosed()">
          + Add Expense
        </button>
      </div>

      <!-- BEFORE REFACTORING
      Template code would have hardcoded category names and brother names

      Categories: 
        <select [(ngModel)]="formData.category" name="category">
          <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
        </select>

      Paid By:
        <select [(ngModel)]="formData.paidBy" name="paidBy">
          <option *ngFor="let brother of brothers" [value]="brother.id">{{ brother.name }}</option>
        </select>
      -->

      <!-- AFTER REFACTORING: Uses ProductConfig -->
      <!-- Filters -->
      <div class="filters">
        <div class="filter-group">
          <label>Category:</label>
          <select [(ngModel)]="filterCategory">
            <option value="">All Categories</option>
            <option *ngFor="let cat of configService.categories()" [value]="cat.id">
              {{ cat.icon }} {{ cat.name }}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Paid By:</label>
          <select [(ngModel)]="filterBrother">
            <option value="">All Participants</option>
            <option *ngFor="let participant of configService.participants()" [value]="participant.id">
              {{ participant.displayName || participant.name }}
            </option>
          </select>
        </div>
        
        <button class="btn btn-text" (click)="clearFilters()">Clear Filters</button>
      </div>

      <!-- Expense Form Modal - Updated to use ProductConfig -->
      <div class="modal-overlay" *ngIf="showForm()" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingExpense() ? 'Edit Expense' : 'Add New Expense' }}</h3>
            <button class="btn-close" (click)="closeForm()">×</button>
          </div>
          <form (ngSubmit)="saveExpense()" class="expense-form">
            <div class="form-group">
              <label for="title">Expense Title *</label>
              <input 
                type="text" 
                id="title" 
                [(ngModel)]="formData.title" 
                name="title"
                required
                placeholder="e.g., Catering for Day 1">
            </div>
            
            <div class="form-group">
              <label for="category">Category *</label>
              <select id="category" [(ngModel)]="formData.categoryId" name="category" required>
                <option value="" disabled>Select category</option>
                <option *ngFor="let cat of configService.categories()" [value]="cat.id">
                  {{ cat.icon }} {{ cat.name }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="amount">Amount ({{ configService.product()?.currency }}) *</label>
              <input 
                type="number" 
                id="amount" 
                [(ngModel)]="formData.amount" 
                name="amount"
                min="0.01"
                step="0.01"
                required
                placeholder="Enter amount">
            </div>
            
            <div class="form-group">
              <label for="paidBy">Paid By *</label>
              <select id="paidBy" [(ngModel)]="formData.paidBy" name="paidBy" required>
                <option value="" disabled>Select participant</option>
                <option *ngFor="let participant of configService.participants()" [value]="participant.id">
                  {{ participant.displayName || participant.name }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="date">Date *</label>
              <input 
                type="date" 
                id="date" 
                [(ngModel)]="formData.dateStr" 
                name="date"
                required>
            </div>
            
            <div class="form-group">
              <label for="notes">Notes</label>
              <textarea 
                id="notes" 
                [(ngModel)]="formData.notes" 
                name="notes"
                rows="3"
                placeholder="Optional notes"></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="closeForm()">Cancel</button>
              <button type="submit" class="btn btn-primary">
                {{ editingExpense() ? 'Update' : 'Add' }} Expense
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Expenses Table/Cards - Same as before -->
      <div class="table-container">
        <!-- Desktop Table View -->
        <table class="data-table desktop-view" *ngIf="getFilteredExpenses().length > 0">
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Paid By</th>
              <th>Notes</th>
              <th class="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let expense of getFilteredExpenses()">
              <td>{{ expense.date | date:'mediumDate' }}</td>
              <td class="title-col">{{ expense.title }}</td>
              <td>
                <span class="category-badge">
                  {{ getCategoryInfo(expense.categoryId)?.icon }}
                  {{ getCategoryInfo(expense.categoryId)?.name }}
                </span>
              </td>
              <td class="amount-col">{{ configService.product()?.currency }}{{ expense.amount | number:'1.2-2':'en-IN' }}</td>
              <td>
                <span class="brother-badge">{{ getParticipantName(expense.paidBy) }}</span>
              </td>
              <td class="notes-col">{{ expense.notes || '-' }}</td>
              <td class="actions-col">
                <button 
                  class="btn-icon" 
                  title="Edit"
                  (click)="editExpense(expense)"
                  [disabled]="settlementService.isClosed()">
                  ✏️
                </button>
                <button 
                  class="btn-icon btn-danger" 
                  title="Delete"
                  (click)="confirmDelete(expense)"
                  [disabled]="settlementService.isClosed()">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Mobile Card View - Same as before -->
        <div class="cards-view mobile-view" *ngIf="getFilteredExpenses().length > 0">
          <div class="expense-card" *ngFor="let expense of getFilteredExpenses()">
            <div class="card-header">
              <span class="card-title">{{ expense.title }}</span>
              <div class="card-actions">
                <button class="btn-icon" (click)="editExpense(expense)">✏️</button>
                <button class="btn-icon btn-danger" (click)="confirmDelete(expense)">🗑️</button>
              </div>
            </div>
            <div class="card-body">
              <div class="card-field">
                <span class="label">Date</span>
                <span class="value">{{ expense.date | date:'dd MMM yyyy' }}</span>
              </div>
              <div class="card-field">
                <span class="label">Category</span>
                <span class="value">
                  {{ getCategoryInfo(expense.categoryId)?.icon }}
                  {{ getCategoryInfo(expense.categoryId)?.name }}
                </span>
              </div>
              <div class="card-field">
                <span class="label">Amount</span>
                <span class="value amount">{{ configService.product()?.currency }}{{ expense.amount | number:'1.2-2':'en-IN' }}</span>
              </div>
              <div class="card-field">
                <span class="label">Paid By</span>
                <span class="value">{{ getParticipantName(expense.paidBy) }}</span>
              </div>
              <div class="card-field" *ngIf="expense.notes">
                <span class="label">Notes</span>
                <span class="value notes">{{ expense.notes }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="empty-state" *ngIf="getFilteredExpenses().length === 0">
          <span class="empty-icon">📝</span>
          <p>No expenses found</p>
          <button class="btn btn-primary" (click)="openAddForm()" *ngIf="!settlementService.isClosed()">
            Add First Expense
          </button>
        </div>
      </div>

      <!-- Delete Confirmation Dialog - Same as before -->
      <app-confirm-dialog
        [isOpen]="showDeleteDialog()"
        title="Delete Expense"
        [message]="'Are you sure you want to delete this expense of ₹' + (expenseToDelete()?.amount || 0) + '?'"
        confirmText="Delete"
        type="danger"
        (confirm)="deleteExpense()"
        (cancel)="showDeleteDialog.set(false)">
      </app-confirm-dialog>
    </div>
  `,
  styles: [`
    /* Styles remain the same as before */
  `]
})
export class ExpenseManagementComponent implements OnInit {
  // BEFORE: hardcoded arrays
  // categories = EXPENSE_CATEGORIES;
  // brothers = BROTHERS;

  // AFTER: Use injected service
  // All data comes from ProductConfigService
  
  showForm = signal(false);
  editingExpense = signal<Expense | null>(null);
  filterCategory = '';
  filterBrother = '';
  showDeleteDialog = signal(false);
  expenseToDelete = signal<Expense | null>(null);

  formData: ExpenseFormData = {
    title: '',
    categoryId: '',  // CHANGED: Was 'category' (string)
    amount: 0,
    paidBy: '',      // CHANGED: Now participantId (UUID)
    dateStr: new Date().toISOString().split('T')[0],
    notes: ''
  };

  constructor(
    public expenseService: ExpenseService,
    public settlementService: SettlementService,
    public configService: ProductConfigService  // NEW: Inject config service
  ) {}

  ngOnInit(): void {
    // Load configuration for current product
    // Product ID comes from router param or context
  }

  // NEW HELPER METHODS
  getCategoryInfo(categoryId: string) {
    return this.configService.categories().find(c => c.id === categoryId);
  }

  getParticipantName(participantId: string): string {
    const participant = this.configService.participants().find(p => p.id === participantId);
    return participant?.displayName || participant?.name || 'Unknown';
  }

  getFilteredExpenses(): Expense[] {
    return this.expenseService.allExpenses().filter(expense => {
      const categoryMatch = !this.filterCategory || expense.categoryId === this.filterCategory;
      const participantMatch = !this.filterBrother || expense.paidBy === this.filterBrother;
      return categoryMatch && participantMatch;
    });
  }

  // REST OF METHODS REMAIN THE SAME
  // openAddForm, closeForm, editExpense, saveExpense, deleteExpense, etc.
}

/* ============ KEY CHANGES SUMMARY ============

1. IMPORT
   OLD: import { ExpenseCategory, BrotherId, BROTHERS } from '../../models'
   NEW: import { ProductConfigService } from '../../services'

2. DATA SOURCE
   OLD: categories = EXPENSE_CATEGORIES (hardcoded constant)
   NEW: categories = this.configService.categories() (computed signal)

3. FORM DATA
   OLD: categoryId: string (category name like "Food & Catering")
   NEW: categoryId: string (UUID of category)

4. PAID BY
   OLD: paidBy: { id: 'HNK', name: 'HNK' } (hardcoded)
   NEW: paidBy: participantId (UUID from ProductParticipant)

5. CURRENCY DISPLAY
   OLD: Hard-coded ₹
   NEW: {{ configService.product()?.currency }}

6. LAYOUT
   - Template structure remains mostly the same
   - Only data sources and bindings change
   - No UI/UX changes needed

7. BACKWARD COMPATIBILITY
   - Component logic remains the same
   - Settlement calculations still work
   - Just operating on different data sources

============ MIGRATION CHECKLIST ============

For each component:
1. Inject ProductConfigService
2. Replace EXPENSE_CATEGORIES with configService.categories()
3. Replace BROTHERS with configService.participants()
4. Update form data structure
5. Add helper methods for getting names from IDs
6. Update template bindings
7. Test with new data structure
8. Verify settlement calculations
9. Test with multiple products

This pattern applies to:
- ExpenseManagementComponent
- DepositManagementComponent
- ContributionManagementComponent
- BudgetManagementComponent
- ReportsComponent
- All admin dashboard components
