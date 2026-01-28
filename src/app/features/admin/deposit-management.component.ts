import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepositService, SettlementService } from '../../services';
import { Deposit, DepositFormData, BrotherId, BROTHERS } from '../../models';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-deposit-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  template: `
    <div class="deposit-management">
      <div class="page-header">
        <h2 class="page-title">💰 Deposit Management</h2>
        <button class="btn btn-primary" (click)="openAddForm()" [disabled]="settlementService.isClosed()">
          + Add Deposit
        </button>
      </div>

      <!-- Info Banner -->
      <div class="info-banner">
        <span class="info-icon">ℹ️</span>
        <p>
          Track deposits made by brothers with <strong>HNK (Treasurer)</strong>. 
          All brothers deposit their share with HNK who manages the ceremony fund.
          HNK can also deposit his own contribution to the pool.
        </p>
      </div>

      <!-- Summary Cards -->
      <div class="summary-row">
        <div class="summary-card total">
          <span class="summary-label">Total Pool with HNK</span>
          <span class="summary-value">₹{{ depositService.totalDeposits() | number:'1.2-2':'en-IN' }}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">HNK's Own Deposit</span>
          <span class="summary-value">₹{{ depositService.hnkDeposits() | number:'1.2-2':'en-IN' }}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Received from Others</span>
          <span class="summary-value">₹{{ depositService.otherDeposits() | number:'1.2-2':'en-IN' }}</span>
        </div>
      </div>

      <!-- Brother-wise Summary -->
      <div class="brother-summary">
        <h3>Deposits by Brother</h3>
        <div class="brother-cards">
          @for (brother of brothers; track brother.id) {
            <div class="brother-card" [class.highlight]="brother.id === 'HNK'">
              <span class="brother-name">{{ brother.name }}</span>
              <span class="brother-amount">₹{{ depositService.getBrotherDepositTotal(brother.id) | number:'1.2-2':'en-IN' }}</span>
              @if (brother.id === 'HNK') {
                <span class="badge">Treasurer</span>
              }
            </div>
          }
        </div>
      </div>

      <!-- Deposit Form Modal -->
      <div class="modal-overlay" *ngIf="showForm()" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingDeposit() ? 'Edit Deposit' : 'Add New Deposit' }}</h3>
            <button class="btn-close" (click)="closeForm()">×</button>
          </div>
          <form (ngSubmit)="saveDeposit()" class="deposit-form">
            <div class="form-group">
              <label for="depositedBy">Deposited By *</label>
              <select id="depositedBy" [(ngModel)]="formData.depositedBy" name="depositedBy" required>
                <option value="" disabled>Select brother</option>
                @for (brother of brothers; track brother.id) {
                  <option [value]="brother.id">{{ brother.name }} {{ brother.id === 'HNK' ? '(Treasurer)' : '' }}</option>
                }
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
                placeholder="Optional notes about this deposit"></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="closeForm()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!isFormValid()">
                {{ editingDeposit() ? 'Update' : 'Add' }} Deposit
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Deposits Table -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Deposited By</th>
              <th>Amount</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (deposit of depositService.deposits(); track deposit.id) {
              <tr>
                <td>{{ deposit.date | date:'dd MMM yyyy' }}</td>
                <td>
                  <span class="brother-badge" [class]="'brother-' + deposit.depositedBy.toLowerCase()">
                    {{ deposit.depositedBy }}
                  </span>
                  @if (deposit.depositedBy === 'HNK') {
                    <span class="treasurer-tag">Treasurer</span>
                  }
                </td>
                <td class="amount">₹{{ deposit.amount | number:'1.2-2':'en-IN' }}</td>
                <td class="notes">{{ deposit.notes || '-' }}</td>
                <td class="actions">
                  <button class="btn-icon" (click)="editDeposit(deposit)" title="Edit" [disabled]="settlementService.isClosed()">✏️</button>
                  <button class="btn-icon" (click)="confirmDelete(deposit)" title="Delete" [disabled]="settlementService.isClosed()">🗑️</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="empty-state">
                  <div class="empty-content">
                    <span class="empty-icon">💰</span>
                    <p>No deposits recorded yet</p>
                    <button class="btn btn-primary" (click)="openAddForm()" [disabled]="settlementService.isClosed()">Add First Deposit</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Delete Confirmation Dialog -->
      <app-confirm-dialog
        *ngIf="depositToDelete()"
        title="Delete Deposit"
        [message]="'Are you sure you want to delete the deposit of ₹' + (depositToDelete()?.amount | number:'1.2-2':'en-IN') + ' by ' + depositToDelete()?.depositedBy + '?'"
        confirmText="Delete"
        confirmClass="btn-danger"
        (confirm)="deleteDeposit()"
        (cancel)="depositToDelete.set(null)">
      </app-confirm-dialog>
    </div>
  `,
  styles: [`
    .deposit-management {
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
      font-size: 1.75rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .info-banner {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      border: 1px solid #f59e0b;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .info-icon {
      font-size: 1.25rem;
    }

    .info-banner p {
      margin: 0;
      color: #92400e;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .summary-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .summary-card {
      background: white;
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .summary-card.total {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
    }

    .summary-card.total .summary-label,
    .summary-card.total .summary-value {
      color: white;
    }

    .summary-label {
      display: block;
      font-size: 0.85rem;
      color: #64748b;
      margin-bottom: 0.5rem;
    }

    .summary-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
    }

    .brother-summary {
      background: white;
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 1.5rem;
    }

    .brother-summary h3 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      color: #475569;
    }

    .brother-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .brother-card {
      background: #f8fafc;
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
      position: relative;
    }

    .brother-card.highlight {
      background: linear-gradient(135deg, #dbeafe, #bfdbfe);
      border: 2px solid #3b82f6;
    }

    .brother-name {
      display: block;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 0.25rem;
    }

    .brother-amount {
      display: block;
      font-size: 1.25rem;
      font-weight: 700;
      color: #10b981;
    }

    .badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #3b82f6;
      color: white;
      font-size: 0.65rem;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .btn {
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #475569;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 16px;
      width: 90%;
      max-width: 480px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      color: #1e293b;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #94a3b8;
      cursor: pointer;
    }

    .deposit-form {
      padding: 1.25rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 1rem;
      box-sizing: border-box;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }

    .table-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
      font-size: 0.85rem;
      text-transform: uppercase;
    }

    .data-table td {
      color: #1e293b;
    }

    .brother-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.85rem;
    }

    .brother-hnk { background: #dbeafe; color: #1e40af; }
    .brother-hnp { background: #dcfce7; color: #166534; }
    .brother-hns { background: #fef3c7; color: #92400e; }
    .brother-hnm { background: #fce7f3; color: #9d174d; }

    .treasurer-tag {
      font-size: 0.7rem;
      color: #3b82f6;
      margin-left: 0.5rem;
    }

    .amount {
      font-weight: 600;
      color: #10b981;
    }

    .notes {
      color: #64748b;
      font-size: 0.9rem;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .actions {
      white-space: nowrap;
    }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 0.25rem;
      opacity: 0.7;
      transition: opacity 0.2s;
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
      padding: 3rem !important;
    }

    .empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .empty-icon {
      font-size: 3rem;
    }

    .empty-content p {
      color: #64748b;
      margin: 0;
    }

    @media (max-width: 768px) {
      .deposit-management {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .brother-cards {
        grid-template-columns: repeat(2, 1fr);
      }

      .data-table {
        font-size: 0.9rem;
      }

      .data-table th,
      .data-table td {
        padding: 0.75rem 0.5rem;
      }

      .notes {
        max-width: 100px;
      }
    }
  `]
})
export class DepositManagementComponent {
  readonly brothers = BROTHERS;
  
  showForm = signal(false);
  editingDeposit = signal<Deposit | null>(null);
  depositToDelete = signal<Deposit | null>(null);

  formData = {
    depositedBy: '' as BrotherId | '',
    amount: 0,
    dateStr: new Date().toISOString().split('T')[0],
    notes: ''
  };

  constructor(
    public depositService: DepositService,
    public settlementService: SettlementService
  ) {}

  openAddForm(): void {
    this.editingDeposit.set(null);
    this.formData = {
      depositedBy: '',
      amount: 0,
      dateStr: new Date().toISOString().split('T')[0],
      notes: ''
    };
    this.showForm.set(true);
  }

  editDeposit(deposit: Deposit): void {
    this.editingDeposit.set(deposit);
    this.formData = {
      depositedBy: deposit.depositedBy,
      amount: deposit.amount,
      dateStr: new Date(deposit.date).toISOString().split('T')[0],
      notes: deposit.notes || ''
    };
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingDeposit.set(null);
  }

  isFormValid(): boolean {
    return !!this.formData.depositedBy && 
           this.formData.amount > 0 && 
           !!this.formData.dateStr;
  }

  saveDeposit(): void {
    if (!this.isFormValid()) return;

    const data: DepositFormData = {
      depositedBy: this.formData.depositedBy as BrotherId,
      amount: this.formData.amount,
      date: new Date(this.formData.dateStr),
      notes: this.formData.notes || undefined
    };

    if (this.editingDeposit()) {
      this.depositService.updateDeposit(this.editingDeposit()!.id, data);
    } else {
      this.depositService.addDeposit(data);
    }

    this.closeForm();
  }

  confirmDelete(deposit: Deposit): void {
    this.depositToDelete.set(deposit);
  }

  deleteDeposit(): void {
    if (this.depositToDelete()) {
      this.depositService.deleteDeposit(this.depositToDelete()!.id);
      this.depositToDelete.set(null);
    }
  }
}
