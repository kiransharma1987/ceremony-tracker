import { Component, OnInit, signal, WritableSignal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProductService, ProductResponse } from '../../services/product.service';

interface Product {
  name: string;
  type: string;
  overallBudget: number;
  description: string;
}

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="product-management">
      <div class="header">
        <h1>📦 Product Management</h1>
        <p class="subtitle">Create and manage events/products</p>
        <button [routerLink]="'/super-admin'" class="btn btn-back">← Back to Dashboard</button>
      </div>

      <div class="content">
        <div class="section">
          <h2>Create New Product</h2>
          <form (ngSubmit)="createProduct()" class="form" *ngIf="!isLoading()">
            <div class="form-group">
              <label>Product Name:</label>
              <input type="text" [(ngModel)]="newProduct().name" name="name" placeholder="e.g., Sarah's Wedding" required>
            </div>

            <div class="form-group">
              <label>Product Type:</label>
              <select [(ngModel)]="newProduct().type" name="type" required>
                <option value="CEREMONY">Ceremony</option>
                <option value="WEDDING">Wedding</option>
                <option value="TEAM_DINNER">Team Dinner</option>
                <option value="SHARED_APARTMENT">Shared Apartment</option>
                <option value="TRIP">Trip</option>
              </select>
            </div>

            <div class="form-group">
              <label>Overall Budget:</label>
              <input type="number" [(ngModel)]="newProduct().overallBudget" name="overallBudget" placeholder="Enter budget amount" required>
            </div>

            <div class="form-group">
              <label>Description:</label>
              <textarea [(ngModel)]="newProduct().description" name="description" placeholder="Optional description"></textarea>
            </div>

            <button type="submit" class="btn btn-primary">
              {{ isLoading() ? 'Creating...' : 'Create Product' }}
            </button>
          </form>

          <div *ngIf="isLoading()" class="loading-spinner">
            <p>Creating product...</p>
          </div>

          <div *ngIf="successMessage()" class="alert alert-success">
            ✅ {{ successMessage() }}
          </div>

          <div *ngIf="errorMessage()" class="alert alert-error">
            ❌ {{ errorMessage() }}
          </div>
        </div>

        <div class="section">
          <h2>Existing Products ({{ products().length }})</h2>
          <p class="info-text">All products managed in this system</p>
          
          <div *ngIf="products().length === 0" class="empty-state">
            <p>No products created yet</p>
          </div>

          <div *ngIf="products().length > 0" class="products-grid">
            <div *ngFor="let product of products()" class="product-card">
              <div class="product-header">
                <h3>{{ product.name }}</h3>
                <span class="product-type">{{ product.type }}</span>
              </div>
              <div class="product-info">
                <p><strong>Budget:</strong> {{ product.currency }}{{ product.overallBudget }}</p>
                <p *ngIf="product.description"><strong>Description:</strong> {{ product.description }}</p>
                <p><strong>Status:</strong> {{ product.isClosed ? 'Closed' : 'Active' }}</p>
                <p *ngIf="product.userCount"><strong>Users:</strong> {{ product.userCount }}</p>
                <p *ngIf="product.expenseCount"><strong>Expenses:</strong> {{ product.expenseCount }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-management {
      padding: 30px;
      max-width: 1000px;
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

    .form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-weight: 600;
      color: #333;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
    }

    .form-group textarea {
      resize: vertical;
      min-height: 80px;
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

    .btn-primary {
      background-color: #4caf50;
      color: white;
      width: fit-content;
    }

    .btn-primary:hover {
      background-color: #45a049;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .alert {
      padding: 15px 20px;
      border-radius: 6px;
      margin-top: 15px;
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
      padding: 20px;
      text-align: center;
      color: #666;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .product-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.1);
    }

    .product-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 15px;
      gap: 10px;
    }

    .product-header h3 {
      margin: 0;
      font-size: 18px;
      color: #333;
      flex: 1;
    }

    .product-type {
      background-color: #667eea;
      color: white;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }

    .product-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .product-info p {
      margin: 0;
      font-size: 14px;
      color: #555;
    }

    .info-text {
      color: #666;
      margin: 0 0 15px 0;
    }

    .empty-state {
      padding: 40px;
      text-align: center;
      background: #f9f9f9;
      border-radius: 8px;
      color: #999;
    }
  `]
})
export class ProductManagementComponent implements OnInit {
  newProduct: WritableSignal<Product> = signal({
    name: '',
    type: 'CEREMONY',
    overallBudget: 0,
    description: ''
  });

  private productsData = signal<ProductResponse[]>([]);
  readonly products = this.productsData.asReadonly();
  
  private isLoadingSignal = signal(false);
  readonly isLoading = this.isLoadingSignal.asReadonly();
  
  private successMsg = signal('');
  readonly successMessage = this.successMsg.asReadonly();
  
  private errorMsg = signal('');
  readonly errorMessage = this.errorMsg.asReadonly();

  readonly isFormValid = computed(() => {
    const product = this.newProduct();
    return product.name.trim().length > 0 && 
           product.type.trim().length > 0;
  });

  constructor(
    public authService: AuthService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  async createProduct(): Promise<void> {
    const product = this.newProduct();
    
    // Validate required fields
    if (!product.name || !product.name.trim()) {
      this.errorMsg.set('Product name is required');
      setTimeout(() => this.errorMsg.set(''), 5000);
      return;
    }
    
    if (!product.type || !product.type.trim()) {
      this.errorMsg.set('Product type is required');
      setTimeout(() => this.errorMsg.set(''), 5000);
      return;
    }

    this.isLoadingSignal.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    try {
      await this.productService.createProduct({
        name: product.name,
        type: product.type,
        overallBudget: product.overallBudget,
        description: product.description || undefined
      });

      this.successMsg.set(`Product "${product.name}" created successfully!`);
      
      // Reset form
      this.newProduct.set({
        name: '',
        type: 'CEREMONY',
        overallBudget: 0,
        description: ''
      });

      // Reload products - don't let this failure affect the success message
      try {
        await this.loadProducts();
      } catch (loadError) {
        console.error('Failed to reload products:', loadError);
      }

      // Clear success message after 5 seconds
      setTimeout(() => this.successMsg.set(''), 5000);
    } catch (error: any) {
      const errorMessage = error?.error?.error || 'Failed to create product. Please try again.';
      this.errorMsg.set(errorMessage);
      console.error('Product creation error:', error);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  private async loadProducts(): Promise<void> {
    try {
      const products = await this.productService.getAllProducts();
      this.productsData.set(products);
    } catch (error) {
      console.error('Failed to load products:', error);
      this.productsData.set([]);
    }
  }
}

