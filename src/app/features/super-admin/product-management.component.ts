import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="product-management">
      <h1>📦 Product Management</h1>
      <p>Create and manage events/products</p>
      <button [routerLink]="'/super-admin'" class="btn btn-back">← Back</button>
    </div>
  `,
  styles: [`
    .product-management {
      padding: 20px;
    }

    h1 {
      margin: 0 0 10px 0;
    }

    .btn-back {
      margin-top: 10px;
      padding: 10px 20px;
      background-color: #667eea;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  `]
})
export class ProductManagementComponent {}
