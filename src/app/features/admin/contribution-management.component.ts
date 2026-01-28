import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContributionService, SettlementService } from '../../services';
import { 
  Contribution, 
  ContributionFormData,
  ContributorRelationship 
} from '../../models';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-contribution-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  template: `
    <div class="contribution-management">
      <div class="page-header">
        <h2 class="page-title">🤝 Contribution Management</h2>
        <button class="btn btn-primary" (click)="openAddForm()" [disabled]="settlementService.isClosed()">
          + Add Contribution
        </button>
      </div>

      <!-- Info Banner -->
      <div class="info-banner">
        <span class="info-icon">ℹ️</span>
        <p>
          Contributions from Sister (HNU) and relatives are recorded here. 
          These contributions reduce the total amount to be shared by the four brothers.
        </p>
      </div>

      <!-- Summary -->
      <div class="summary-row">
        <div class="summary-card">
          <span class="summary-label">Total Contributions</span>
          <span class="summary-value">₹{{ contributionService.totalContributions() | number:'1.2-2':'en-IN' }}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Sister's Contribution</span>
          <span class="summary-value">₹{{ contributionService.sisterContribution() | number:'1.2-2':'en-IN' }}</span>
        </div>
        <div class="summary-card">
          <span class="summary-label">Relatives' Contributions</span>
          <span class="summary-value">₹{{ contributionService.relativeContributions() | number:'1.2-2':'en-IN' }}</span>
        </div>
      </div>

      <!-- Contribution Form Modal -->
      <div class="modal-overlay" *ngIf="showForm()" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingContribution() ? 'Edit Contribution' : 'Add New Contribution' }}</h3>
            <button class="btn-close" (click)="closeForm()">×</button>
          </div>
          <form (ngSubmit)="saveContribution()" class="contribution-form">
            <div class="form-group">
              <label for="contributorName">Contributor Name *</label>
              <input 
                type="text" 
                id="contributorName" 
                [(ngModel)]="formData.contributorName" 
                name="contributorName"
                required
                placeholder="Enter contributor name">
            </div>
            
            <div class="form-group">
              <label for="relationship">Relationship *</label>
              <select id="relationship" [(ngModel)]="formData.relationship" name="relationship" required>
                <option value="" disabled>Select relationship</option>
                <option value="Sister">Sister</option>
                <option value="Relative">Relative</option>
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
                placeholder="Optional notes"></textarea>
            </div>
            
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="closeForm()">Cancel</button>
              <button type="submit" class="btn btn-primary">
                {{ editingContribution() ? 'Update' : 'Add' }} Contribution
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Contributions Table -->
      <div class="table-container">
        <table class="data-table" *ngIf="contributionService.allContributions().length > 0">
          <thead>
            <tr>
              <th>Date</th>
              <th>Contributor</th>
              <th>Relationship</th>
              <th>Amount</th>
              <th>Notes</th>
              <th class="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let contribution of getSortedContributions()">
              <td>{{ contribution.date | date:'mediumDate' }}</td>
              <td class="contributor-name">{{ contribution.contributorName }}</td>
              <td>
                <span class="relationship-badge" [class]="contribution.relationship.toLowerCase()">
                  {{ contribution.relationship }}
                </span>
              </td>
              <td class="amount-col">₹{{ contribution.amount | number:'1.2-2':'en-IN' }}</td>
              <td class="notes-col">{{ contribution.notes || '-' }}</td>
              <td class="actions-col">
                <button 
                  class="btn-icon" 
                  title="Edit"
                  (click)="editContribution(contribution)"
                  [disabled]="settlementService.isClosed()">
                  ✏️
                </button>
                <button 
                  class="btn-icon btn-danger" 
                  title="Delete"
                  (click)="confirmDelete(contribution)"
                  [disabled]="settlementService.isClosed()">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div class="empty-state" *ngIf="contributionService.allContributions().length === 0">
          <span class="empty-icon">🤝</span>
          <p>No contributions recorded yet</p>
          <button class="btn btn-primary" (click)="openAddForm()" *ngIf="!settlementService.isClosed()">
            Add First Contribution
          </button>
        </div>
      </div>

      <!-- Delete Confirmation Dialog -->
      <app-confirm-dialog
        [isOpen]="showDeleteDialog()"
        title="Delete Contribution"
        [message]="'Are you sure you want to delete the contribution of ₹' + (contributionToDelete()?.amount || 0) + ' from ' + (contributionToDelete()?.contributorName || '') + '?'"
        confirmText="Delete"
        type="danger"
        (confirm)="deleteContribution()"
        (cancel)="showDeleteDialog.set(false)">
      </app-confirm-dialog>
    </div>
  `,
  styles: [`
    .contribution-management {
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
    
    .info-banner {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      background: #ebf5fb;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      align-items: flex-start;
    }
    
    .info-icon {
      font-size: 1.25rem;
    }
    
    .info-banner p {
      margin: 0;
      color: #2980b9;
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
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .summary-label {
      font-size: 0.8rem;
      color: #7f8c8d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .summary-value {
      font-size: 1.35rem;
      font-weight: 600;
      color: #27ae60;
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
      background: #27ae60;
      color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
      background: #219a52;
    }
    
    .btn-secondary {
      background: #ecf0f1;
      color: #7f8c8d;
    }
    
    .btn-secondary:hover {
      background: #dfe6e9;
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
    
    .contribution-form {
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
      border-color: #27ae60;
    }
    
    .form-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
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
    
    .contributor-name {
      font-weight: 500;
    }
    
    .amount-col {
      font-weight: 600;
      color: #27ae60;
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
    
    .relationship-badge {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 500;
    }
    
    .relationship-badge.sister {
      background: #fce4ec;
      color: #c2185b;
    }
    
    .relationship-badge.relative {
      background: #e8f5e9;
      color: #388e3c;
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
      .contribution-management {
        padding: 1rem;
      }
      
      .page-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
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
export class ContributionManagementComponent {
  showForm = signal(false);
  editingContribution = signal<Contribution | null>(null);
  showDeleteDialog = signal(false);
  contributionToDelete = signal<Contribution | null>(null);
  
  formData = {
    contributorName: '',
    relationship: '' as ContributorRelationship | '',
    amount: 0,
    dateStr: new Date().toISOString().split('T')[0],
    notes: ''
  };

  constructor(
    public contributionService: ContributionService,
    public settlementService: SettlementService
  ) {}

  openAddForm(): void {
    this.editingContribution.set(null);
    this.resetForm();
    this.showForm.set(true);
  }

  editContribution(contribution: Contribution): void {
    this.editingContribution.set(contribution);
    this.formData = {
      contributorName: contribution.contributorName,
      relationship: contribution.relationship,
      amount: contribution.amount,
      dateStr: new Date(contribution.date).toISOString().split('T')[0],
      notes: contribution.notes || ''
    };
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingContribution.set(null);
    this.resetForm();
  }

  resetForm(): void {
    this.formData = {
      contributorName: '',
      relationship: '',
      amount: 0,
      dateStr: new Date().toISOString().split('T')[0],
      notes: ''
    };
  }

  saveContribution(): void {
    if (!this.formData.contributorName || !this.formData.relationship || !this.formData.amount) {
      return;
    }
    
    const data: ContributionFormData = {
      contributorName: this.formData.contributorName,
      relationship: this.formData.relationship as ContributorRelationship,
      amount: this.formData.amount,
      date: new Date(this.formData.dateStr),
      notes: this.formData.notes || undefined
    };
    
    const editing = this.editingContribution();
    if (editing) {
      this.contributionService.updateContribution(editing.id, data);
    } else {
      this.contributionService.addContribution(data);
    }
    
    this.closeForm();
  }

  confirmDelete(contribution: Contribution): void {
    this.contributionToDelete.set(contribution);
    this.showDeleteDialog.set(true);
  }

  deleteContribution(): void {
    const contribution = this.contributionToDelete();
    if (contribution) {
      this.contributionService.deleteContribution(contribution.id);
    }
    this.showDeleteDialog.set(false);
    this.contributionToDelete.set(null);
  }

  getSortedContributions(): Contribution[] {
    return this.contributionService.allContributions()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}
