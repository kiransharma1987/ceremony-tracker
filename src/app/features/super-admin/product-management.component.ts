import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
          <form (ngSubmit)="createProduct()" class="form">
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

            <button type="submit" class="btn btn-primary">Create Product</button>
          </form>
        </div>

        <div class="section">
          <h2>Existing Products</h2>
          <p class="info-text">Products will be listed here once created. Each product can have its own users and expenses.</p>
          <div class="empty-state">
            <p>No products created yet</p>
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
export class ProductManagementComponent {
  newProduct: WritableSignal<Product> = signal({
    name: '',
    type: 'CEREMONY',
    overallBudget: 0,
    description: ''
  });

  constructor(public authService: AuthService) {}

  createProduct(): void {
    console.log('Create product:', this.newProduct());
    // TODO: Implement product creation API call
  }
}

