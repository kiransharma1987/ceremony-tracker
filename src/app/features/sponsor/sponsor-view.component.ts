import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sponsor-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sponsor-view">
      <div class="header">
        <div class="header-content">
          <h1>💰 Sponsor Dashboard</h1>
          <button class="btn btn-logout" (click)="logout()">Logout</button>
        </div>
      </div>

      <div class="container">
        <div class="welcome-section">
          <h2>Welcome, {{ authService.user()?.name }}</h2>
          <p>You are viewing event details as a Sponsor</p>
        </div>

        <div class="cards">
          <div class="card">
            <div class="card-header">💳 Sponsorship Information</div>
            <div class="card-body">
              <p><strong>Role:</strong> Sponsor</p>
              <p><strong>Email:</strong> {{ authService.user()?.email }}</p>
              <p><strong>Status:</strong> Active</p>
            </div>
          </div>

          <div class="card">
            <div class="card-header">🔔 Permissions</div>
            <div class="card-body">
              <ul>
                <li>View event budget</li>
                <li>View contribution records</li>
                <li>Track sponsorship details</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sponsor-view {
      min-height: 100vh;
      background: linear-gradient(135deg, #ff9800 0%, #ff6f00 100%);
      padding: 20px;
    }

    .header {
      background: white;
      padding: 20px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-content h1 {
      margin: 0;
      color: #333;
      font-size: 28px;
    }

    .btn-logout {
      background: #f44336;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-weight: 600;
    }

    .btn-logout:hover {
      background: #d32f2f;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .welcome-section {
      background: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .welcome-section h2 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 24px;
    }

    .welcome-section p {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .card {
      background: white;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .card-header {
      background: #ff9800;
      color: white;
      padding: 15px 20px;
      font-weight: 600;
      font-size: 16px;
    }

    .card-body {
      padding: 20px;
    }

    .card-body p {
      margin: 10px 0;
      color: #333;
      line-height: 1.6;
    }

    .card-body ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .card-body li {
      padding: 8px 0;
      color: #333;
      border-bottom: 1px solid #eee;
    }

    .card-body li:last-child {
      border-bottom: none;
    }

    .card-body li:before {
      content: '✓ ';
      color: #4caf50;
      font-weight: bold;
      margin-right: 8px;
    }
  `]
})
export class SponsorViewComponent implements OnInit {
  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Component initialization if needed
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
