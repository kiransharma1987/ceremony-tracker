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
          <span class="subtitle">Padmamma's First Year Ceremony</span>
        </div>
        
        <nav class="nav-section" *ngIf="authService.isAuthenticated()">
          <ng-container *ngIf="authService.isAdmin()">
            <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">Dashboard</a>
            <a routerLink="/admin/expenses" routerLinkActive="active" class="nav-link">Expenses</a>
            <a routerLink="/admin/contributions" routerLinkActive="active" class="nav-link">Contributions</a>
            <a routerLink="/admin/deposits" routerLinkActive="active" class="nav-link">Deposits</a>
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
      color: white;
    }
    
    .subtitle {
      font-size: 0.75rem;
      opacity: 0.9;
      margin-top: 2px;
      color: rgba(255, 255, 255, 0.9);
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
      border-bottom: 3px solid transparent;
    }
    
    .nav-link:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }
    
    .nav-link.active {
      background: rgba(255,255,255,0.25);
      color: white;
      font-weight: 600;
      border-bottom-color: #2ecc71;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
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
        gap: 0.75rem;
      }
      
      .logo-section {
        text-align: center;
      }

      .app-title {
        font-size: 1rem;
      }

      .subtitle {
        font-size: 0.7rem;
      }
      
      .nav-section {
        justify-content: center;
        order: 3;
        gap: 0.25rem;
      }
      
      .user-section {
        justify-content: center;
        gap: 0.5rem;
      }
      
      .nav-link {
        padding: 0.4rem 0.75rem;
        font-size: 0.8rem;
      }

      .user-role {
        font-size: 0.8rem;
        padding: 0.3rem 0.6rem;
      }

      .btn-logout {
        padding: 0.35rem 0.75rem;
        font-size: 0.8rem;
      }
    }

    @media (max-width: 480px) {
      .header {
        padding: 0.5rem;
      }

      .header-content {
        gap: 0.5rem;
      }

      .app-title {
        font-size: 0.9rem;
        letter-spacing: 0;
      }

      .subtitle {
        display: none;
      }

      .nav-section {
        gap: 0.2rem;
        overflow-x: auto;
        padding: 0.25rem 0;
      }

      .nav-link {
        padding: 0.35rem 0.6rem;
        font-size: 0.75rem;
        flex-shrink: 0;
      }

      .nav-link.active {
        border-bottom-width: 2px;
      }

      .user-section {
        flex-direction: column;
        gap: 0.35rem;
      }

      .user-role {
        font-size: 0.7rem;
        padding: 0.25rem 0.5rem;
      }

      .btn-logout {
        padding: 0.3rem 0.6rem;
        font-size: 0.75rem;
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
      case 'ADMIN':
        return '👑 Admin (KHK)';
      case 'BROTHER':
        return `👤 ${user.brotherId}`;
      case 'CONTRIBUTOR':
        return `🤝 ${user.name}`;
      default:
        return '';
    }
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/';
  }
}
