import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportService, SettlementService, ExpenseService, ContributionService } from '../../services';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ConfirmDialogComponent],
  template: `
    <div class="reports-page">
      <div class="page-header">
        <h2 class="page-title">📑 Reports & Export</h2>
      </div>

      <!-- Export Options -->
      <section class="export-section">
        <h3 class="section-title">Export Data</h3>
        <div class="export-grid">
          <div class="export-card">
            <div class="export-icon">📊</div>
            <h4>Full Report (PDF)</h4>
            <p>Complete ceremony expense report including summary, settlements, and all transactions</p>
            <button class="btn btn-primary" (click)="exportPDF()">
              Download PDF
            </button>
          </div>
          
          <div class="export-card">
            <div class="export-icon">📋</div>
            <h4>Full Report (CSV)</h4>
            <p>Complete data export for accounting and record-keeping purposes</p>
            <button class="btn btn-secondary" (click)="exportFullCSV()">
              Download CSV
            </button>
          </div>
          
          <div class="export-card">
            <div class="export-icon">💰</div>
            <h4>Expenses Only</h4>
            <p>Export all expense records in CSV format</p>
            <button class="btn btn-secondary" (click)="exportExpensesCSV()">
              Download CSV
            </button>
          </div>
          
          <div class="export-card">
            <div class="export-icon">🤝</div>
            <h4>Contributions Only</h4>
            <p>Export all contribution records in CSV format</p>
            <button class="btn btn-secondary" (click)="exportContributionsCSV()">
              Download CSV
            </button>
          </div>
          
          <div class="export-card">
            <div class="export-icon">⚖️</div>
            <h4>Settlement Summary</h4>
            <p>Export final settlement calculations in CSV format</p>
            <button class="btn btn-secondary" (click)="exportSettlementCSV()">
              Download CSV
            </button>
          </div>
        </div>
      </section>

      <!-- Event Closure -->
      <section class="closure-section">
        <h3 class="section-title">Event Closure</h3>
        <div class="closure-card" [class.closed]="settlementService.isClosed()">
          <div class="closure-status">
            <span class="status-icon">{{ settlementService.isClosed() ? '🔒' : '🔓' }}</span>
            <div class="status-text">
              <h4>{{ settlementService.isClosed() ? 'Event Closed' : 'Event Open' }}</h4>
              <p *ngIf="settlementService.isClosed()">
                Closed on {{ settlementService.status().closedAt | date:'medium' }}
              </p>
              <p *ngIf="!settlementService.isClosed()">
                Close the event to prevent further modifications
              </p>
            </div>
          </div>
          
          <div class="closure-info" *ngIf="!settlementService.isClosed()">
            <div class="info-item">
              <span class="info-label">Total Expenses:</span>
              <span class="info-value">₹{{ expenseService.totalExpenses() | number:'1.2-2':'en-IN' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Total Contributions:</span>
              <span class="info-value">₹{{ contributionService.totalContributions() | number:'1.2-2':'en-IN' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Balance Check:</span>
              <span class="info-value" [class.valid]="settlementService.verifyBalances()">
                {{ settlementService.verifyBalances() ? '✓ Verified' : '✗ Imbalanced' }}
              </span>
            </div>
          </div>
          
          <div class="closure-actions">
            <button 
              *ngIf="!settlementService.isClosed()"
              class="btn btn-danger"
              (click)="confirmClose()"
              [disabled]="!settlementService.verifyBalances()">
              🔒 Close Event
            </button>
            <button 
              *ngIf="settlementService.isClosed()"
              class="btn btn-warning"
              (click)="confirmReopen()">
              🔓 Reopen Event
            </button>
          </div>
        </div>
      </section>

      <!-- Access Links -->
      <section class="links-section">
        <h3 class="section-title">Share Access Links</h3>
        <div class="links-grid">
          <div class="link-card">
            <span class="link-icon">👤</span>
            <span class="link-name">Brothers Portal</span>
            <button class="btn btn-small" (click)="copyBrotherLink()">
              Copy Link
            </button>
          </div>
          <div class="link-card contributor">
            <span class="link-icon">🤝</span>
            <span class="link-name">Contributor Portal</span>
            <button class="btn btn-small" (click)="copyContributorLink()">
              Copy Link
            </button>
          </div>
        </div>
        <p class="link-note">
          Share the Brothers Portal link with family. Password: <strong>padmamma2026</strong>
        </p>
      </section>

      <!-- Confirm Close Dialog -->
      <app-confirm-dialog
        [isOpen]="showCloseDialog"
        title="Close Event"
        message="Are you sure you want to close this event? No further modifications will be allowed. This action can be reversed by reopening the event."
        confirmText="Close Event"
        type="warning"
        (confirm)="closeEvent()"
        (cancel)="showCloseDialog = false">
      </app-confirm-dialog>

      <!-- Confirm Reopen Dialog -->
      <app-confirm-dialog
        [isOpen]="showReopenDialog"
        title="Reopen Event"
        message="Are you sure you want to reopen this event? This will allow modifications to expenses and contributions."
        confirmText="Reopen Event"
        type="info"
        (confirm)="reopenEvent()"
        (cancel)="showReopenDialog = false">
      </app-confirm-dialog>
    </div>
  `,
  styles: [`
    .reports-page {
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
    
    .section-title {
      font-size: 1rem;
      color: #5d6d7e;
      margin: 0 0 1rem 0;
      font-weight: 600;
    }
    
    .export-section,
    .closure-section,
    .links-section {
      margin-bottom: 2rem;
    }
    
    .export-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }
    
    .export-card {
      background: white;
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      text-align: center;
    }
    
    .export-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    
    .export-card h4 {
      margin: 0 0 0.5rem 0;
      font-size: 0.95rem;
      color: #2c3e50;
    }
    
    .export-card p {
      margin: 0 0 1rem 0;
      font-size: 0.8rem;
      color: #7f8c8d;
      line-height: 1.4;
    }
    
    .btn {
      padding: 0.6rem 1.25rem;
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
      color: #5d6d7e;
    }
    
    .btn-secondary:hover {
      background: #dfe6e9;
    }
    
    .btn-danger {
      background: #e74c3c;
      color: white;
    }
    
    .btn-danger:hover:not(:disabled) {
      background: #c0392b;
    }
    
    .btn-warning {
      background: #f39c12;
      color: white;
    }
    
    .btn-warning:hover {
      background: #d68910;
    }
    
    .btn-small {
      padding: 0.4rem 0.75rem;
      font-size: 0.8rem;
      background: #ecf0f1;
      color: #5d6d7e;
    }
    
    .btn-small:hover {
      background: #dfe6e9;
    }
    
    .closure-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    
    .closure-card.closed {
      border: 2px solid #27ae60;
    }
    
    .closure-status {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .status-icon {
      font-size: 2.5rem;
    }
    
    .status-text h4 {
      margin: 0 0 0.25rem 0;
      font-size: 1.1rem;
      color: #2c3e50;
    }
    
    .status-text p {
      margin: 0;
      font-size: 0.85rem;
      color: #7f8c8d;
    }
    
    .closure-info {
      display: flex;
      gap: 2rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    
    .info-item {
      display: flex;
      gap: 0.5rem;
    }
    
    .info-label {
      color: #7f8c8d;
      font-size: 0.85rem;
    }
    
    .info-value {
      font-weight: 600;
      color: #2c3e50;
      font-size: 0.85rem;
    }
    
    .info-value.valid {
      color: #27ae60;
    }
    
    .closure-actions {
      display: flex;
      gap: 1rem;
    }
    
    .links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .link-card {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .link-card.contributor {
      background: #ebf5fb;
    }
    
    .link-icon {
      font-size: 1.5rem;
    }
    
    .link-name {
      flex: 1;
      font-weight: 500;
      color: #2c3e50;
    }
    
    .link-note {
      font-size: 0.85rem;
      color: #7f8c8d;
      text-align: center;
    }
    
    @media (max-width: 768px) {
      .reports-page {
        padding: 1rem;
      }
      
      .export-grid {
        grid-template-columns: 1fr;
      }
      
      .closure-info {
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .links-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ReportsComponent {
  showCloseDialog = false;
  showReopenDialog = false;

  constructor(
    private exportService: ExportService,
    public settlementService: SettlementService,
    public expenseService: ExpenseService,
    public contributionService: ContributionService
  ) {}

  async exportPDF(): Promise<void> {
    await this.exportService.exportToPDF();
  }

  exportFullCSV(): void {
    this.exportService.exportFullReportToCSV();
  }

  exportExpensesCSV(): void {
    this.exportService.exportExpensesToCSV();
  }

  exportContributionsCSV(): void {
    this.exportService.exportContributionsToCSV();
  }

  exportSettlementCSV(): void {
    this.exportService.exportSettlementToCSV();
  }

  confirmClose(): void {
    this.showCloseDialog = true;
  }

  closeEvent(): void {
    this.settlementService.closeEvent('KHK');
    this.showCloseDialog = false;
  }

  confirmReopen(): void {
    this.showReopenDialog = true;
  }

  reopenEvent(): void {
    this.settlementService.reopenEvent();
    this.showReopenDialog = false;
  }

  copyBrotherLink(): void {
    const link = `${window.location.origin}/login`;
    const message = `Padmamma's First Year Ceremony Tracker\n\nLink: ${link}\n\nSelect your name and use password: padmamma2026`;
    navigator.clipboard.writeText(message);
    alert('Brother access info copied!');
  }

  copyContributorLink(): void {
    const link = `${window.location.origin}/login`;
    navigator.clipboard.writeText(link);
    alert('Contributor link copied!');
  }
}
