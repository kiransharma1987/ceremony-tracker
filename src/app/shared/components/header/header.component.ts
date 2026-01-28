import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header">
      <div class="header-content">
        <div class="logo-section">
          <h1 class="app-title">🪔 Ceremony Expense Tracker</h1>
          <span class="subtitle">Grandmother's First Death Ceremony</span>
        </div>
        
        <nav class="nav-section" *ngIf="authService.isAuthenticated()">
          <ng-container *ngIf="authService.isAdmin()">
            <a routerLink="/admin" routerLinkActive="active" class="nav-link">Dashboard</a>
            <a routerLink="/admin/expenses" routerLinkActive="active" class="nav-link">Expenses</a>
            <a routerLink="/admin/contributions" routerLinkActive="active" class="nav-link">Contributions</a>
            <a routerLink="/admin/budget" routerLinkActive="active" class="nav-link">Budget</a>
            <a routerLink="/admin/reports" routerLinkActive="active" class="nav-link">Reports</a>
          </ng-container>
        </nav>
        
        <div class="user-section" *ngIf="authService.isAuthenticated()">
          <span class="user-role">
            {{ getRoleDisplay() }}
          </span>
          <button class="btn-logout" (click)="logout()">Logout</button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: linear-gradient(135deg, #5d6d7e 0%, #34495e 100%);
      color: white;
      padding: 0.75rem 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    
    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .logo-section {
      display: flex;
      flex-direction: column;
    }
    
    .app-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
      letter-spacing: 0.5px;
    }
    
    .subtitle {
      font-size: 0.75rem;
      opacity: 0.8;
      margin-top: 2px;
    }
    
    .nav-section {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    
    .nav-link {
      color: rgba(255,255,255,0.85);
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.9rem;
      transition: all 0.2s ease;
    }
    
    .nav-link:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }
    
    .nav-link.active {
      background: rgba(255,255,255,0.2);
      color: white;
      font-weight: 500;
    }
    
    .user-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .user-role {
      font-size: 0.85rem;
      padding: 0.35rem 0.75rem;
      background: rgba(255,255,255,0.15);
      border-radius: 20px;
    }
    
    .btn-logout {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.5);
      color: white;
      padding: 0.4rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s ease;
    }
    
    .btn-logout:hover {
      background: rgba(255,255,255,0.1);
      border-color: white;
    }
    
    @media (max-width: 768px) {
      .header {
        padding: 0.5rem 1rem;
      }
      
      .header-content {
        flex-direction: column;
        align-items: stretch;
      }
      
      .logo-section {
        text-align: center;
      }
      
      .nav-section {
        justify-content: center;
        order: 3;
      }
      
      .user-section {
        justify-content: center;
      }
      
      .nav-link {
        padding: 0.4rem 0.75rem;
        font-size: 0.8rem;
      }
    }
  `]
})
export class HeaderComponent {
  constructor(public authService: AuthService) {}

  getRoleDisplay(): string {
    const user = this.authService.user();
    if (!user) return '';
    
    switch (user.role) {
      case 'admin':
        return '👑 Admin (KHK)';
      case 'brother':
        return `👤 ${user.brotherId}`;
      case 'contributor':
        return `🤝 ${user.contributorName}`;
      default:
        return '';
    }
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }
}
