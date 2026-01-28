import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-container">
        <div class="login-header">
          <span class="logo">🪔</span>
          <h1>Ceremony Expense Tracker</h1>
          <p>Padmamma's First Year Ceremony</p>
        </div>

        <!-- Login Options -->
        <div class="login-options">
          <!-- Admin Login -->
          <div class="login-card" [class.active]="activeTab === 'admin'">
            <button class="tab-btn" (click)="activeTab = 'admin'" [class.active]="activeTab === 'admin'">
              👑 Admin Login
            </button>
            <div class="tab-content" *ngIf="activeTab === 'admin'">
              <p>Admin access for KHK</p>
              <form (ngSubmit)="loginAsAdmin()">
                <div class="form-group">
                  <label>Password</label>
                  <input 
                    type="password" 
                    [(ngModel)]="adminPassword" 
                    name="password"
                    placeholder="Enter admin password">
                </div>
                <div class="error-message" *ngIf="loginError">{{ loginError }}</div>
                <button type="submit" class="btn btn-primary">Login as Admin</button>
              </form>
            </div>
          </div>

          <!-- Brother Login -->
          <div class="login-card" [class.active]="activeTab === 'brother'">
            <button class="tab-btn" (click)="activeTab = 'brother'" [class.active]="activeTab === 'brother'">
              👤 Brother Login
            </button>
            <div class="tab-content" *ngIf="activeTab === 'brother'">
              <p>View-only access for brothers</p>
              <form (ngSubmit)="loginAsBrother()">
                <div class="form-group">
                  <label>Select Brother</label>
                  <select [(ngModel)]="selectedBrother" name="brother">
                    <option value="" disabled>Choose brother</option>
                    <option value="HNK">HNK</option>
                    <option value="HNP">HNP</option>
                    <option value="HNS">HNS</option>
                    <option value="HNM">HNM</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Password</label>
                  <input 
                    type="password" 
                    [(ngModel)]="brotherPassword" 
                    name="brotherPassword"
                    placeholder="Enter password">
                </div>
                <div class="error-message" *ngIf="brotherLoginError">{{ brotherLoginError }}</div>
                <button type="submit" class="btn btn-secondary" [disabled]="!selectedBrother || !brotherPassword || brotherLoading">
                  {{ brotherLoading ? 'Loading...' : 'View as ' + (selectedBrother || 'Brother') }}
                </button>
              </form>
            </div>
          </div>

          <!-- Contributor Login -->
          <div class="login-card" [class.active]="activeTab === 'contributor'">
            <button class="tab-btn" (click)="activeTab = 'contributor'" [class.active]="activeTab === 'contributor'">
              🤝 Contributor Portal
            </button>
            <div class="tab-content" *ngIf="activeTab === 'contributor'">
              <p>Add your contribution</p>
              <form (ngSubmit)="loginAsContributor()">
                <div class="form-group">
                  <label>Your Name</label>
                  <input 
                    type="text" 
                    [(ngModel)]="contributorName" 
                    name="contributorName"
                    placeholder="Enter your name">
                </div>
                <button type="submit" class="btn btn-green" [disabled]="!contributorName">
                  Continue as Contributor
                </button>
              </form>
            </div>
          </div>
        </div>

        <div class="login-footer">
          <p>For secure access links, please contact the administrator</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }
    
    .login-container {
      width: 100%;
      max-width: 420px;
    }
    
    .login-header {
      text-align: center;
      color: white;
      margin-bottom: 2rem;
    }
    
    .logo {
      font-size: 3rem;
      display: block;
      margin-bottom: 0.5rem;
    }
    
    .login-header h1 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
      font-weight: 600;
      color: white;
    }
    
    .login-header p {
      margin: 0;
      opacity: 0.9;
      font-size: 0.9rem;
    }
    
    .login-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .login-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    
    .tab-btn {
      width: 100%;
      padding: 1rem;
      background: #f8f9fa;
      border: none;
      font-size: 1rem;
      font-weight: 500;
      color: #5d6d7e;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;
    }
    
    .tab-btn:hover {
      background: #ecf0f1;
    }
    
    .tab-btn.active {
      background: white;
      color: #2c3e50;
    }
    
    .tab-content {
      padding: 1.25rem;
      border-top: 1px solid #ecf0f1;
    }
    
    .tab-content p {
      margin: 0 0 1rem 0;
      color: #7f8c8d;
      font-size: 0.9rem;
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
    .form-group select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #dfe6e9;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s ease;
    }
    
    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #667eea;
    }
    
    .error-message {
      color: #e74c3c;
      font-size: 0.85rem;
      margin-bottom: 1rem;
      padding: 0.5rem;
      background: #fadbd8;
      border-radius: 6px;
    }
    
    .btn {
      width: 100%;
      padding: 0.85rem;
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    .btn-secondary {
      background: #5d6d7e;
      color: white;
    }
    
    .btn-secondary:hover:not(:disabled) {
      background: #34495e;
    }
    
    .btn-green {
      background: #27ae60;
      color: white;
    }
    
    .btn-green:hover:not(:disabled) {
      background: #219a52;
    }
    
    .login-footer {
      text-align: center;
      margin-top: 1.5rem;
      color: rgba(255,255,255,0.7);
      font-size: 0.85rem;
    }
    
    .login-footer p {
      margin: 0;
    }
    
    @media (max-width: 480px) {
      .login-header h1 {
        font-size: 1.25rem;
      }
    }
  `]
})
export class LoginComponent {
  activeTab: 'admin' | 'brother' | 'contributor' = 'admin';
  adminPassword = '';
  selectedBrother = '';
  brotherPassword = '';
  brotherLoginError = '';
  brotherLoading = false;
  contributorName = '';
  loginError = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async loginAsAdmin(): Promise<void> {
    this.loginError = '';
    const success = await this.authService.loginAsAdmin(this.adminPassword);
    if (success) {
      this.router.navigate(['/admin']);
    } else {
      this.loginError = 'Invalid password. Please try again.';
    }
  }

  async loginAsBrother(): Promise<void> {
    if (this.selectedBrother && this.brotherPassword) {
      this.brotherLoginError = '';
      this.brotherLoading = true;
      const success = await this.authService.loginAsBrother(this.selectedBrother as any, this.brotherPassword);
      this.brotherLoading = false;
      if (success) {
        this.router.navigate(['/brother', this.selectedBrother]);
      } else {
        this.brotherLoginError = 'Invalid password. Please try again.';
      }
    }
  }

  loginAsContributor(): void {
    if (this.contributorName) {
      this.authService.loginAsContributor(this.contributorName, 'demo');
      this.router.navigate(['/contribute']);
    }
  }
}
