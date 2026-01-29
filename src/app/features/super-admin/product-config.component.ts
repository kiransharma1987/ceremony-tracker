import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProductConfigService, ProductConfig } from '../../services/product-config.service';

@Component({
  selector: 'app-product-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="product-config">
      <div class="header">
        <h1>⚙️ Product Configuration</h1>
        <p class="subtitle">Configure features and settings for {{ productName() }}</p>
        <button [routerLink]="'/super-admin/products'" class="btn btn-back">← Back to Products</button>
      </div>

      <div class="content" *ngIf="!isLoading()">
        <div class="section">
          <h2>📋 Product Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Product Name:</label>
              <p>{{ config()?.name }}</p>
            </div>
            <div class="info-item">
              <label>Type:</label>
              <p>{{ config()?.type }}</p>
            </div>
            <div class="info-item">
              <label>Currency:</label>
              <p>{{ config()?.currency }}</p>
            </div>
            <div class="info-item">
              <label>Status:</label>
              <p>{{ config()?.isClosed ? '🔒 Closed' : '✅ Active' }}</p>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>🔧 Feature Configuration</h2>
          <p class="section-desc">Enable or disable features that appear in the Admin dashboard</p>
          
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-header">
                <span class="feature-icon">📊</span>
                <h3>Dashboard</h3>
              </div>
              <p class="feature-desc">Main admin dashboard with summary</p>
              <div class="toggle-switch">
                <label>
                  <input 
                    type="checkbox" 
                    [(ngModel)]="config()!.enableDashboard" 
                    (change)="onConfigChange()"
                    name="enableDashboard">
                  <span class="toggle-label">{{ config()?.enableDashboard ? 'Enabled' : 'Disabled' }}</span>
                </label>
              </div>
            </div>

            <div class="feature-card">
              <div class="feature-header">
                <span class="feature-icon">💸</span>
                <h3>Expenses</h3>
              </div>
              <p class="feature-desc">Expense management and tracking</p>
              <div class="toggle-switch">
                <label>
                  <input 
                    type="checkbox" 
                    [(ngModel)]="config()!.enableExpenses" 
                    (change)="onConfigChange()"
                    name="enableExpenses">
                  <span class="toggle-label">{{ config()?.enableExpenses ? 'Enabled' : 'Disabled' }}</span>
                </label>
              </div>
            </div>

            <div class="feature-card">
              <div class="feature-header">
                <span class="feature-icon">🎁</span>
                <h3>Contributions</h3>
              </div>
              <p class="feature-desc">Manage contributions from relatives</p>
              <div class="toggle-switch">
                <label>
                  <input 
                    type="checkbox" 
                    [(ngModel)]="config()!.enableContributions" 
                    (change)="onConfigChange()"
                    name="enableContributions">
                  <span class="toggle-label">{{ config()?.enableContributions ? 'Enabled' : 'Disabled' }}</span>
                </label>
              </div>
            </div>

            <div class="feature-card">
              <div class="feature-header">
                <span class="feature-icon">💰</span>
                <h3>Deposits</h3>
              </div>
              <p class="feature-desc">Track money deposits from participants</p>
              <div class="toggle-switch">
                <label>
                  <input 
                    type="checkbox" 
                    [(ngModel)]="config()!.enableDeposits" 
                    (change)="onConfigChange()"
                    name="enableDeposits">
                  <span class="toggle-label">{{ config()?.enableDeposits ? 'Enabled' : 'Disabled' }}</span>
                </label>
              </div>
            </div>

            <div class="feature-card">
              <div class="feature-header">
                <span class="feature-icon">📈</span>
                <h3>Budget</h3>
              </div>
              <p class="feature-desc">Budget planning and monitoring</p>
              <div class="toggle-switch">
                <label>
                  <input 
                    type="checkbox" 
                    [(ngModel)]="config()!.enableBudget" 
                    (change)="onConfigChange()"
                    name="enableBudget">
                  <span class="toggle-label">{{ config()?.enableBudget ? 'Enabled' : 'Disabled' }}</span>
                </label>
              </div>
            </div>

            <div class="feature-card">
              <div class="feature-header">
                <span class="feature-icon">📄</span>
                <h3>Reports</h3>
              </div>
              <p class="feature-desc">Export and reporting functionality</p>
              <div class="toggle-switch">
                <label>
                  <input 
                    type="checkbox" 
                    [(ngModel)]="config()!.enableReports" 
                    (change)="onConfigChange()"
                    name="enableReports">
                  <span class="toggle-label">{{ config()?.enableReports ? 'Enabled' : 'Disabled' }}</span>
                </label>
              </div>
            </div>

            <div class="feature-card">
              <div class="feature-header">
                <span class="feature-icon">⚖️</span>
                <h3>Settlement</h3>
              </div>
              <p class="feature-desc">Calculate fair expense settlement</p>
              <div class="toggle-switch">
                <label>
                  <input 
                    type="checkbox" 
                    [(ngModel)]="config()!.enableSettlement" 
                    (change)="onConfigChange()"
                    name="enableSettlement">
                  <span class="toggle-label">{{ config()?.enableSettlement ? 'Enabled' : 'Disabled' }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="successMessage()" class="alert alert-success">
          ✅ {{ successMessage() }}
        </div>

        <div *ngIf="errorMessage()" class="alert alert-error">
          ❌ {{ errorMessage() }}
        </div>
      </div>

      <div *ngIf="isLoading()" class="loading-spinner">
        <p>Loading configuration...</p>
      </div>
    </div>
  `,
  styles: [`
    .product-config {
      padding: 30px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 40px;
    }

    h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      color: #333;
    }

    .subtitle {
      color: #666;
      margin-bottom: 20px;
    }

    .content {
      display: grid;
      gap: 40px;
    }

    .section {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .section h2 {
      margin: 0 0 20px 0;
      font-size: 20px;
      color: #333;
    }

    .section-desc {
      color: #666;
      margin: 0 0 20px 0;
      font-size: 14px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .info-item {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #667eea;
    }

    .info-item label {
      display: block;
      font-weight: 600;
      color: #555;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .info-item p {
      margin: 0;
      color: #333;
      font-size: 16px;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .feature-card {
      background: #f9f9f9;
      border: 2px solid #eee;
      border-radius: 8px;
      padding: 20px;
      transition: all 0.3s ease;
    }

    .feature-card:hover {
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
    }

    .feature-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .feature-icon {
      font-size: 24px;
    }

    .feature-header h3 {
      margin: 0;
      font-size: 18px;
      color: #333;
    }

    .feature-desc {
      color: #666;
      font-size: 13px;
      margin: 0 0 15px 0;
      line-height: 1.4;
    }

    .toggle-switch {
      display: flex;
      align-items: center;
    }

    .toggle-switch label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      margin: 0;
    }

    .toggle-switch input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .toggle-label {
      font-weight: 500;
      color: #555;
      font-size: 14px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-back {
      background-color: #667eea;
      color: white;
      width: fit-content;
      margin-bottom: 20px;
    }

    .btn-back:hover {
      background-color: #5a67d8;
    }

    .alert {
      padding: 15px 20px;
      border-radius: 6px;
      margin-top: 20px;
      font-weight: 500;
    }

    .alert-success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .alert-error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .loading-spinner {
      padding: 40px;
      text-align: center;
      color: #666;
    }
  `]
})
export class ProductConfigComponent implements OnInit {
  private configData = signal<ProductConfig | null>(null);
  readonly config = this.configData.asReadonly();

  private isLoadingSignal = signal(false);
  readonly isLoading = this.isLoadingSignal.asReadonly();

  private successMsg = signal('');
  readonly successMessage = this.successMsg.asReadonly();

  private errorMsg = signal('');
  readonly errorMessage = this.errorMsg.asReadonly();

  readonly productName = computed(() => this.configData()?.name || '');

  private productId: string = '';
  private saveTimeout: any;

  constructor(
    public authService: AuthService,
    private configService: ProductConfigService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.productId = params['productId'];
      this.loadConfig();
    });
  }

  private async loadConfig(): Promise<void> {
    this.isLoadingSignal.set(true);
    try {
      const config = await this.configService.getProductConfig(this.productId);
      this.configData.set(config);
      this.errorMsg.set('');
    } catch (error) {
      console.error('Failed to load config:', error);
      this.errorMsg.set('Failed to load configuration');
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  onConfigChange(): void {
    const config = this.configData();
    if (!config) return;

    // Clear any previous timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Debounce save - wait 500ms after last change
    this.saveTimeout = setTimeout(() => {
      this.saveConfig();
    }, 500);
  }

  private async saveConfig(): Promise<void> {
    const config = this.configData();
    if (!config) return;

    this.isLoadingSignal.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    try {
      const updated = await this.configService.updateProductConfig(this.productId, {
        enableDashboard: config.enableDashboard,
        enableExpenses: config.enableExpenses,
        enableContributions: config.enableContributions,
        enableDeposits: config.enableDeposits,
        enableBudget: config.enableBudget,
        enableReports: config.enableReports,
        enableSettlement: config.enableSettlement
      });

      this.configData.set(updated);
      this.successMsg.set('Configuration saved successfully!');
      
      setTimeout(() => this.successMsg.set(''), 3000);
    } catch (error: any) {
      const errorMessage = error?.error?.error || 'Failed to save configuration';
      this.errorMsg.set(errorMessage);
      console.error('Config save error:', error);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }
}
