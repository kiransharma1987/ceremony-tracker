import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Product } from '../../models';

@Component({
  selector: 'app-product-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="product-selector">
      <div class="header">
        <h1>👑 Select Product</h1>
        <p class="subtitle">Choose a product to manage as Super Admin</p>
      </div>

      <div class="content">
        <div *ngIf="isLoading()" class="loading">
          <p>Loading products...</p>
        </div>

        <div *ngIf="!isLoading() && products().length === 0" class="empty-state">
          <p>No products created yet. <a href="/super-admin/products" class="link">Create one</a></p>
        </div>

        <div *ngIf="!isLoading() && products().length > 0" class="products-grid">
          <div 
            *ngFor="let product of products()" 
            class="product-card"
            (click)="selectProduct(product)">
            <div class="product-icon">{{ getProductIcon(product.type) }}</div>
            <div class="product-info">
              <h3>{{ product.name }}</h3>
              <p class="product-type">{{ getProductType(product.type) }}</p>
              <p class="product-meta">
                {{ product.currency }}{{ product.overallBudget | number:'1.0-0' }} • 
                <span [class]="product.isClosed ? 'closed' : 'active'">
                  {{ product.isClosed ? 'Closed' : 'Active' }}
                </span>
              </p>
            </div>
            <span class="arrow">→</span>
          </div>
        </div>

        <div class="actions">
          <a href="/super-admin" class="btn btn-secondary">← Back</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-selector {
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
      margin: 0;
    }

    .loading {
      padding: 40px;
      text-align: center;
      color: #666;
    }

    .empty-state {
      padding: 40px;
      text-align: center;
      background: #f9f9f9;
      border-radius: 8px;
      color: #666;
    }

    .empty-state a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }

    .empty-state a:hover {
      text-decoration: underline;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .product-card {
      background: white;
      border: 2px solid #eee;
      border-radius: 10px;
      padding: 20px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .product-card:hover {
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
      transform: translateY(-2px);
    }

    .product-icon {
      font-size: 32px;
    }

    .product-info {
      flex: 1;
    }

    .product-info h3 {
      margin: 0 0 5px 0;
      font-size: 18px;
      color: #333;
    }

    .product-type {
      margin: 0 0 8px 0;
      color: #999;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .product-meta {
      margin: 0;
      color: #666;
      font-size: 13px;
    }

    .product-meta .closed {
      color: #c41e3a;
      font-weight: 600;
    }

    .product-meta .active {
      color: #4caf50;
      font-weight: 600;
    }

    .arrow {
      color: #667eea;
      font-size: 20px;
      font-weight: bold;
    }

    .actions {
      display: flex;
      gap: 10px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      text-decoration: none;
      display: inline-block;
      transition: all 0.2s;
    }

    .btn-secondary {
      background-color: #f0f0f0;
      color: #333;
    }

    .btn-secondary:hover {
      background-color: #e0e0e0;
    }
  `]
})
export class ProductSelectorComponent implements OnInit {
  private productsData = signal<Product[]>([]);
  readonly products = this.productsData.asReadonly();

  private isLoadingSignal = signal(true);
  readonly isLoading = this.isLoadingSignal.asReadonly();

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  private async loadProducts(): Promise<void> {
    try {
      const products = await this.authService.getAllProducts();
      this.productsData.set(products);
    } catch (error) {
      console.error('Failed to load products:', error);
      this.productsData.set([]);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  getProductIcon(type: string): string {
    const icons: Record<string, string> = {
      CEREMONY: '🪔',
      WEDDING: '💒',
      TEAM_DINNER: '🍽️',
      SHARED_APARTMENT: '🏠',
      TRIP: '✈️'
    };
    return icons[type] || '📦';
  }

  getProductType(type: string): string {
    const types: Record<string, string> = {
      CEREMONY: 'Ceremony',
      WEDDING: 'Wedding',
      TEAM_DINNER: 'Team Dinner',
      SHARED_APARTMENT: 'Shared Apartment',
      TRIP: 'Trip'
    };
    return types[type] || type;
  }

  selectProduct(product: Product): void {
    // Store selected product in localStorage
    localStorage.setItem('selectedProductId', product.id);
    
    // Redirect to admin
    window.location.href = '/admin';
  }
}
