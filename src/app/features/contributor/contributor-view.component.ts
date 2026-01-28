import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContributionService, AuthService } from '../../services';
import { ContributionFormData, ContributorRelationship, Contribution } from '../../models';

@Component({
  selector: 'app-contributor-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="contributor-view">
      <div class="welcome-header">
        <h1>🤝 Contribution Portal</h1>
        <p>Thank you for your generous contribution to the ceremony</p>
      </div>

      <!-- Add Contribution Form -->
      <section class="contribution-section">
        <h2 class="section-title">Add Your Contribution</h2>
        <div class="contribution-form-card">
          <form (ngSubmit)="submitContribution()" class="contribution-form">
            <div class="form-group">
              <label for="contributorName">Your Name *</label>
              <input 
                type="text" 
                id="contributorName" 
                [(ngModel)]="formData.contributorName" 
                name="contributorName"
                required
                placeholder="Enter your name"
                [disabled]="submitted()">
            </div>
            
            <div class="form-group">
              <label for="relationship">Relationship *</label>
              <select 
                id="relationship" 
                [(ngModel)]="formData.relationship" 
                name="relationship" 
                required
                [disabled]="submitted()">
                <option value="" disabled>Select relationship</option>
                <option value="Sister">Sister</option>
                <option value="Relative">Relative</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="amount">Contribution Amount (₹) *</label>
              <input 
                type="number" 
                id="amount" 
                [(ngModel)]="formData.amount" 
                name="amount"
                min="1"
                step="1"
                required
                placeholder="Enter amount"
                [disabled]="submitted()">
            </div>
            
            <div class="form-group">
              <label for="notes">Message (Optional)</label>
              <textarea 
                id="notes" 
                [(ngModel)]="formData.notes" 
                name="notes"
                rows="3"
                placeholder="Add a personal message or note"
                [disabled]="submitted()"></textarea>
            </div>
            
            <button 
              type="submit" 
              class="btn btn-primary btn-large"
              [disabled]="submitted() || !isFormValid()">
              {{ submitted() ? 'Thank You!' : 'Submit Contribution' }}
            </button>
          </form>
        </div>
      </section>

      <!-- Success Message -->
      <div class="success-message" *ngIf="submitted()">
        <span class="success-icon">✅</span>
        <h3>Contribution Recorded!</h3>
        <p>Thank you for your generous contribution of ₹{{ lastContributionAmount() | number:'1.2-2':'en-IN' }}</p>
        <button class="btn btn-secondary" (click)="addAnother()">Add Another Contribution</button>
      </div>

      <!-- Your Contributions -->
      <section class="history-section" *ngIf="myContributions().length > 0">
        <h2 class="section-title">Your Contributions</h2>
        <div class="contributions-list">
          <div class="contribution-card" *ngFor="let contrib of myContributions()">
            <div class="contribution-header">
              <span class="contribution-amount">₹{{ contrib.amount | number:'1.2-2':'en-IN' }}</span>
              <span class="contribution-date">{{ contrib.date | date:'mediumDate' }}</span>
            </div>
            <div class="contribution-details">
              <span class="contributor-name">{{ contrib.contributorName }}</span>
              <span class="relationship-badge" [class]="contrib.relationship.toLowerCase()">
                {{ contrib.relationship }}
              </span>
            </div>
            <p class="contribution-notes" *ngIf="contrib.notes">{{ contrib.notes }}</p>
          </div>
        </div>
        
        <div class="total-contribution">
          <span class="total-label">Your Total Contribution:</span>
          <span class="total-value">₹{{ getTotalContribution() | number:'1.2-2':'en-IN' }}</span>
        </div>
      </section>

      <!-- Info Section -->
      <section class="info-section">
        <div class="info-card">
          <span class="info-icon">ℹ️</span>
          <div class="info-content">
            <h4>About Contributions</h4>
            <p>
              Your contributions help reduce the expense burden on the four brothers. 
              All contributions are recorded with gratitude and transparency.
            </p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .contributor-view {
      padding: 1.5rem;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .welcome-header {
      text-align: center;
      margin-bottom: 2rem;
      padding: 2rem;
      background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
      border-radius: 12px;
      color: white;
    }
    
    .welcome-header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      color: white;
      font-weight: 600;
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
    
    .contribution-section,
    .history-section,
    .info-section {
      margin-bottom: 2rem;
    }
    
    .contribution-form-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    .form-group {
      margin-bottom: 1.25rem;
    }
    
    .form-group label {
      display: block;
      font-size: 0.85rem;
      color: #5d6d7e;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    
    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #dfe6e9;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s ease;
    }
    
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #27ae60;
    }
    
    .form-group input:disabled,
    .form-group select:disabled,
    .form-group textarea:disabled {
      background: #f8f9fa;
      cursor: not-allowed;
    }
    
    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
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
      color: #5d6d7e;
    }
    
    .btn-secondary:hover {
      background: #dfe6e9;
    }
    
    .btn-large {
      width: 100%;
      padding: 1rem;
      font-size: 1.1rem;
    }
    
    .success-message {
      text-align: center;
      padding: 2rem;
      background: #d5f5e3;
      border-radius: 12px;
      margin-bottom: 2rem;
    }
    
    .success-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 1rem;
    }
    
    .success-message h3 {
      margin: 0 0 0.5rem 0;
      color: #27ae60;
    }
    
    .success-message p {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }
    
    .contributions-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .contribution-card {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    .contribution-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    
    .contribution-amount {
      font-size: 1.25rem;
      font-weight: 600;
      color: #27ae60;
    }
    
    .contribution-date {
      font-size: 0.85rem;
      color: #7f8c8d;
    }
    
    .contribution-details {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .contributor-name {
      font-weight: 500;
      color: #2c3e50;
    }
    
    .relationship-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
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
    
    .contribution-notes {
      margin: 0.75rem 0 0 0;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 6px;
      font-size: 0.9rem;
      color: #5d6d7e;
      font-style: italic;
    }
    
    .total-contribution {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
      padding: 1rem;
      background: #ebf5fb;
      border-radius: 8px;
    }
    
    .total-label {
      font-weight: 500;
      color: #2c3e50;
    }
    
    .total-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: #27ae60;
    }
    
    .info-card {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #fef9e7;
      border-radius: 8px;
    }
    
    .info-icon {
      font-size: 1.5rem;
    }
    
    .info-content h4 {
      margin: 0 0 0.5rem 0;
      color: #9a7b4f;
      font-size: 0.95rem;
    }
    
    .info-content p {
      margin: 0;
      color: #9a7b4f;
      font-size: 0.85rem;
      line-height: 1.5;
    }
    
    @media (max-width: 480px) {
      .contributor-view {
        padding: 1rem;
      }
      
      .welcome-header {
        padding: 1.5rem 1rem;
      }
    }
  `]
})
export class ContributorViewComponent {
  submitted = signal(false);
  lastContributionAmount = signal(0);
  currentContributorName = '';

  formData = {
    contributorName: '',
    relationship: '' as ContributorRelationship | '',
    amount: 0,
    notes: ''
  };

  constructor(
    private contributionService: ContributionService,
    private authService: AuthService
  ) {
    const user = this.authService.user();
    if (user?.name) {
      this.formData.contributorName = user.name;
      this.currentContributorName = user.name;
    }
  }

  isFormValid(): boolean {
    return !!(
      this.formData.contributorName &&
      this.formData.relationship &&
      this.formData.amount > 0
    );
  }

  submitContribution(): void {
    if (!this.isFormValid()) return;

    const data: ContributionFormData = {
      contributorName: this.formData.contributorName,
      relationship: this.formData.relationship as ContributorRelationship,
      amount: this.formData.amount,
      date: new Date(),
      notes: this.formData.notes || undefined
    };

    this.contributionService.addContribution(data);
    this.currentContributorName = this.formData.contributorName;
    this.lastContributionAmount.set(this.formData.amount);
    this.submitted.set(true);
  }

  addAnother(): void {
    this.submitted.set(false);
    this.formData = {
      contributorName: this.currentContributorName,
      relationship: '',
      amount: 0,
      notes: ''
    };
  }

  myContributions(): Contribution[] {
    if (!this.currentContributorName) return [];
    return this.contributionService.getContributionsByContributor(this.currentContributorName)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getTotalContribution(): number {
    return this.myContributions().reduce((sum, c) => sum + c.amount, 0);
  }
}
