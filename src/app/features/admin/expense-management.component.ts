import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService, SettlementService } from '../../services';
import { 
  Expense, 
  ExpenseFormData, 
  ExpenseCategory, 
  EXPENSE_CATEGORIES,
  BrotherId,
  BROTHERS 
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

      <!-- Expense Form Modal -->
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
              <select id="category" [(ngModel)]="formData.category" name="category" required>
                <option value="" disabled>Select category</option>
                <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="amount">Amount (₹) *</label>
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
                <option value="" disabled>Select brother</option>
                <option *ngFor="let brother of brothers" [value]="brother.id">{{ brother.name }}</option>
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

      <!-- Filters -->
      <div class="filters">
        <div class="filter-group">
          <label>Category:</label>
          <select [(ngModel)]="filterCategory">
            <option value="">All Categories</option>
            <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Paid By:</label>
          <select [(ngModel)]="filterBrother">
            <option value="">All Brothers</option>
            <option *ngFor="let brother of brothers" [value]="brother.id">{{ brother.name }}</option>
          </select>
        </div>
        
        <button class="btn btn-text" (click)="clearFilters()">Clear Filters</button>
      </div>

      <!-- Summary Stats -->
      <div class="stats-bar">
        <div class="stat">
          <span class="stat-label">Total:</span>
          <span class="stat-value">₹{{ getTotalFiltered() | number:'1.2-2':'en-IN' }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Count:</span>
          <span class="stat-value">{{ getFilteredExpenses().length }}</span>
        </div>
      </div>

      <!-- Expenses Table -->
      <div class="table-container">
        <table class="data-table" *ngIf="getFilteredExpenses().length > 0">
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
                <span class="category-badge">{{ expense.category }}</span>
              </td>
              <td class="amount-col">₹{{ expense.amount | number:'1.2-2':'en-IN' }}</td>
              <td>
                <span class="brother-badge">{{ expense.paidBy }}</span>
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
        
        <div class="empty-state" *ngIf="getFilteredExpenses().length === 0">
          <span class="empty-icon">📝</span>
          <p>No expenses found</p>
          <button class="btn btn-primary" (click)="openAddForm()" *ngIf="!settlementService.isClosed()">
            Add First Expense
          </button>
        </div>
      </div>

      <!-- Delete Confirmation Dialog -->
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
    .expense-management {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    
    .page-title {
      font-size: 1.25rem;
      color: #2c3e50;
      margin: 0;
    }
    
    .btn {
      padding: 0.6rem 1.25rem;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
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
    
    .btn-secondary:hover {
      background: #dfe6e9;
    }
    
    .btn-text {
      background: transparent;
      color: #3498db;
      padding: 0.5rem;
    }
    
    .btn-text:hover {
      text-decoration: underline;
    }
    
    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1500;
    }
    
    .modal {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #ecf0f1;
    }
    
    .modal-header h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #2c3e50;
    }
    
    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #95a5a6;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
    
    .expense-form {
      padding: 1.5rem;
    }
    
    .form-group {
      margin-bottom: 1rem;
    }
    
    .form-group label {
      display: block;
      font-size: 0.85rem;
      color: #5d6d7e;
      margin-bottom: 0.35rem;
      font-weight: 500;
    }
    
    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.65rem;
      border: 1px solid #dfe6e9;
      border-radius: 8px;
      font-size: 0.95rem;
      transition: border-color 0.2s ease;
    }
    
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #3498db;
    }
    
    .form-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }
    
    /* Filters */
    .filters {
      display: flex;
      gap: 1rem;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 1rem;
      padding: 1rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    }
    
    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .filter-group label {
      font-size: 0.85rem;
      color: #7f8c8d;
    }
    
    .filter-group select {
      padding: 0.4rem 0.75rem;
      border: 1px solid #dfe6e9;
      border-radius: 6px;
      font-size: 0.85rem;
    }
    
    .stats-bar {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1rem;
      padding: 0.75rem 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .stat {
      display: flex;
      gap: 0.5rem;
    }
    
    .stat-label {
      color: #7f8c8d;
      font-size: 0.85rem;
    }
    
    .stat-value {
      font-weight: 600;
      color: #2c3e50;
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
      padding: 0.85rem 1rem;
      text-align: left;
      font-weight: 600;
      color: #5d6d7e;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .data-table td {
      padding: 0.85rem 1rem;
      border-top: 1px solid #ecf0f1;
      font-size: 0.9rem;
    }
    
    .amount-col {
      font-weight: 600;
      color: #2c3e50;
    }
    
    .notes-col {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #7f8c8d;
    }
    
    .actions-col {
      text-align: center;
      white-space: nowrap;
    }
    
    .category-badge {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      background: #ebf5fb;
      color: #3498db;
      border-radius: 4px;
      font-size: 0.8rem;
    }
    
    .brother-badge {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      background: #fef5e7;
      color: #f39c12;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }
    
    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.35rem;
      font-size: 1rem;
      opacity: 0.7;
      transition: opacity 0.2s ease;
    }
    
    .btn-icon:hover:not(:disabled) {
      opacity: 1;
    }
    
    .btn-icon:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #95a5a6;
    }
    
    .empty-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 0.5rem;
    }
    
    .empty-state p {
      margin: 0 0 1rem 0;
    }
    
    @media (max-width: 768px) {
      .expense-management {
        padding: 1rem;
      }
      
      .page-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }
      
      .filters {
        flex-direction: column;
        align-items: stretch;
      }
      
      .filter-group {
        justify-content: space-between;
      }
      
      .data-table th,
      .data-table td {
        padding: 0.6rem 0.5rem;
        font-size: 0.8rem;
      }
      
      .notes-col {
        display: none;
      }
    }
  `]
})
export class ExpenseManagementComponent {
  categories = EXPENSE_CATEGORIES;
  brothers = BROTHERS;
  
  showForm = signal(false);
  editingExpense = signal<Expense | null>(null);
  showDeleteDialog = signal(false);
  expenseToDelete = signal<Expense | null>(null);
  
  filterCategory = '';
  filterBrother = '';
  
  formData = {
    title: '',
    category: '' as ExpenseCategory | '',
    amount: 0,
    paidBy: '' as BrotherId | '',
    dateStr: new Date().toISOString().split('T')[0],
    notes: ''
  };

  constructor(
    private expenseService: ExpenseService,
    public settlementService: SettlementService
  ) {}

  openAddForm(): void {
    this.editingExpense.set(null);
    this.resetForm();
    this.showForm.set(true);
  }

  editExpense(expense: Expense): void {
    this.editingExpense.set(expense);
    this.formData = {
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      paidBy: expense.paidBy,
      dateStr: new Date(expense.date).toISOString().split('T')[0],
      notes: expense.notes || ''
    };
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingExpense.set(null);
    this.resetForm();
  }

  resetForm(): void {
    this.formData = {
      title: '',
      category: '',
      amount: 0,
      paidBy: '',
      dateStr: new Date().toISOString().split('T')[0],
      notes: ''
    };
  }

  saveExpense(): void {
    if (!this.formData.title || !this.formData.category || !this.formData.amount || !this.formData.paidBy) {
      return;
    }
    
    const data: ExpenseFormData = {
      title: this.formData.title,
      category: this.formData.category as ExpenseCategory,
      amount: this.formData.amount,
      paidBy: this.formData.paidBy as BrotherId,
      date: new Date(this.formData.dateStr),
      notes: this.formData.notes || undefined
    };
    
    const editing = this.editingExpense();
    if (editing) {
      this.expenseService.updateExpense(editing.id, data);
    } else {
      this.expenseService.addExpense(data);
    }
    
    this.closeForm();
  }

  confirmDelete(expense: Expense): void {
    this.expenseToDelete.set(expense);
    this.showDeleteDialog.set(true);
  }

  deleteExpense(): void {
    const expense = this.expenseToDelete();
    if (expense) {
      this.expenseService.deleteExpense(expense.id);
    }
    this.showDeleteDialog.set(false);
    this.expenseToDelete.set(null);
  }

  getFilteredExpenses(): Expense[] {
    let expenses = this.expenseService.allExpenses();
    
    if (this.filterCategory) {
      expenses = expenses.filter(e => e.category === this.filterCategory);
    }
    
    if (this.filterBrother) {
      expenses = expenses.filter(e => e.paidBy === this.filterBrother);
    }
    
    return expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getTotalFiltered(): number {
    return this.getFilteredExpenses().reduce((sum, e) => sum + e.amount, 0);
  }

  clearFilters(): void {
    this.filterCategory = '';
    this.filterBrother = '';
  }
}
