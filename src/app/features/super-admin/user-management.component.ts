import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface User {
  email: string;
  name: string;
  role: string;
  password: string;
  productId: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="user-management">
      <div class="header">
        <h1>👥 User Management</h1>
        <p class="subtitle">Create and manage users for different products</p>
        <button [routerLink]="'/super-admin'" class="btn btn-back">← Back to Dashboard</button>
      </div>

      <div class="content">
        <div class="section">
          <h2>Create New User</h2>
          <form (ngSubmit)="createUser()" class="form">
            <div class="form-group">
              <label>Email:</label>
              <input type="email" [(ngModel)]="newUser().email" name="email" placeholder="user@example.com" required>
            </div>

            <div class="form-group">
              <label>Name:</label>
              <input type="text" [(ngModel)]="newUser().name" name="name" placeholder="Full name" required>
            </div>

            <div class="form-group">
              <label>Role:</label>
              <select [(ngModel)]="newUser().role" name="role" required>
                <option value="ADMIN">Admin</option>
                <option value="ORGANIZER">Organizer</option>
                <option value="ATTENDEE">Attendee</option>
                <option value="SPONSOR">Sponsor</option>
              </select>
            </div>

            <div class="form-group">
              <label>Password:</label>
              <input type="password" [(ngModel)]="newUser().password" name="password" placeholder="Set password" required>
            </div>

            <div class="form-group">
              <label>Product (Optional):</label>
              <input type="text" [(ngModel)]="newUser().productId" name="productId" placeholder="Select or leave empty for Super Admin users">
            </div>

            <button type="submit" class="btn btn-primary">Create User</button>
          </form>
        </div>

        <div class="section">
          <h2>Existing Users</h2>
          <p class="info-text">Users will be listed here once created. Each user can be assigned to specific products.</p>
          <div class="empty-state">
            <p>No users created yet</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .user-management {
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
    .form-group select {
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
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
export class UserManagementComponent {
  newUser: WritableSignal<User> = signal({
    email: '',
    name: '',
    role: 'ATTENDEE',
    password: '',
    productId: ''
  });

  constructor(public authService: AuthService) {}

  createUser(): void {
    console.log('Create user:', this.newUser());
    // TODO: Implement user creation API call
  }
}

