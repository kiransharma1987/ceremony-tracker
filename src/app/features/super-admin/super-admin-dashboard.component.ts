import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProductService, ProductResponse } from '../../services/product.service';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="super-admin-dashboard">
      <div class="dashboard-header">
        <h1>👑 Super Admin Dashboard</h1>
      </div>

      <div class="dashboard-content">
        <div class="card">
          <h2>Welcome {{ currentUser().name || 'Admin' }}</h2>
          <p>Total Products: {{ products().length }}</p>
          <p>Total Users: {{ totalUsers() }}</p>
        </div>

        <div class="card actions">
          <h3>Management Options</h3>
          <ul>
            <li><a [routerLink]="'/super-admin/products'">📦 Manage Products</a></li>
            <li><a [routerLink]="'/super-admin/users'">👥 Manage Users</a></li>
            <li><a [routerLink]="'/admin'">📊 Go to Admin</a></li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .super-admin-dashboard {
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #ddd;
    }

    .dashboard-header h1 {
      margin: 0;
      font-size: 28px;
    }

    .btn-logout {
      padding: 10px 20px;
      background-color: #f44336;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-logout:hover {
      background-color: #d32f2f;
    }

    .dashboard-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .card h2 {
      margin-top: 0;
      color: #333;
    }

    .card h3 {
      margin-top: 0;
      color: #666;
    }

    .card p {
      margin: 8px 0;
      color: #666;
    }

    .card.actions ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .card.actions li {
      margin: 10px 0;
    }

    .card.actions a {
      display: block;
      padding: 10px 15px;
      background-color: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      transition: background-color 0.3s;
    }

    .card.actions a:hover {
      background-color: #5568d3;
    }
  `]
})
export class SuperAdminDashboardComponent implements OnInit {
  private productsData = signal<ProductResponse[]>([]);
  readonly products = this.productsData.asReadonly();
  
  private usersData = signal<any[]>([]);
  readonly users = this.usersData.asReadonly();
  
  currentUser = signal(this.authService.user);
  readonly totalUsers = computed(() => this.users().length);

  constructor(
    private authService: AuthService,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadUsers();
  }

  private async loadProducts(): Promise<void> {
    try {
      const products = await this.productService.getAllProducts();
      this.productsData.set(products);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }

  private async loadUsers(): Promise<void> {
    try {
      const users = await this.authService.getAllUsers();
      this.usersData.set(users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
