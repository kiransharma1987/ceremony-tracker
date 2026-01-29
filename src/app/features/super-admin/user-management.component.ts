import { Component, OnInit, signal, WritableSignal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User, CreateUserRequest, UserRole, Product } from '../../models';

interface UserForm {
  email: string;
  name: string;
  role: string;
  password: string;
  productId: string;
}

interface EditingUser extends User {
  editing?: boolean;
}

interface PasswordResetForm {
  userId: string;
  userName: string;
  newPassword: string;
  confirmPassword: string;
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
          <form (ngSubmit)="createUser()" class="form" *ngIf="!isLoading()">
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
              <select [(ngModel)]="newUser().productId" name="productId">
                <option value="">-- No Product (Super Admin) --</option>
                <option *ngFor="let product of products()" [value]="product.id">
                  {{ product.name }}
                </option>
              </select>
            </div>

            <button type="submit" class="btn btn-primary">
              {{ isLoading() ? 'Creating...' : 'Create User' }}
            </button>
          </form>

          <div *ngIf="isLoading()" class="loading-spinner">
            <p>Creating user...</p>
          </div>

          <div *ngIf="successMessage()" class="alert alert-success">
            ✅ {{ successMessage() }}
          </div>

          <div *ngIf="errorMessage()" class="alert alert-error">
            ❌ {{ errorMessage() }}
          </div>
        </div>

        <div class="section">
          <h2>Existing Users ({{ users().length }})</h2>
          <p class="info-text">All users in the system</p>
          
          <div *ngIf="users().length === 0" class="empty-state">
            <p>No users created yet</p>
          </div>

          <div *ngIf="users().length > 0" class="users-table">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of users()">
                  <td>{{ user.email }}</td>
                  <td>{{ user.name }}</td>
                  <td><span class="badge" [ngClass]="'badge-' + user.role.toLowerCase()">{{ getRoleDisplay(user.role) }}</span></td>
                  <td>{{ user.productName || '-' }}</td>
                  <td><span class="status" [ngClass]="user.isActive ? 'status-active' : 'status-inactive'">
                    {{ user.isActive ? 'Active' : 'Inactive' }}
                  </span></td>
                  <td>
                    <div class="user-actions">
                      <button (click)="editUser(user)" class="btn-action btn-edit" title="Edit">✏️</button>
                      <button (click)="resetPassword(user)" class="btn-action btn-reset" title="Reset Password">🔑</button>
                      <button (click)="deleteUser(user.id)" class="btn-action btn-delete" title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Edit User Modal -->
        <div *ngIf="editingUserData()" class="modal-overlay" (click)="cancelEdit()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Edit User</h2>
              <button (click)="cancelEdit()" class="btn-close">&times;</button>
            </div>
            <form (ngSubmit)="updateUser()" class="form">
              <div class="form-group">
                <label>Email:</label>
                <input type="email" [value]="editingUserData()!.email" disabled>
                <small>Email cannot be changed</small>
              </div>

              <div class="form-group">
                <label>Name:</label>
                <input type="text" [(ngModel)]="editingUserData()!.name" name="name" required>
              </div>

              <div class="form-group">
                <label>Role:</label>
                <select [(ngModel)]="editingUserData()!.role" name="role" required>
                  <option value="ADMIN">Admin</option>
                  <option value="ORGANIZER">Organizer</option>
                  <option value="ATTENDEE">Attendee</option>
                  <option value="SPONSOR">Sponsor</option>
                </select>
              </div>

              <div class="form-group">
                <label>Product (Optional):</label>
                <select [(ngModel)]="editingUserData()!.productId" name="productId">
                  <option value="">-- No Product --</option>
                  <option *ngFor="let product of products()" [value]="product.id">
                    {{ product.name }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>
                  <input type="checkbox" [(ngModel)]="editingUserData()!.isActive" name="isActive">
                  Active
                </label>
              </div>

              <div class="modal-actions">
                <button type="submit" class="btn btn-primary">Save Changes</button>
                <button type="button" (click)="cancelEdit()" class="btn btn-cancel">Cancel</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Password Reset Modal -->
        <div *ngIf="passwordResetForm()" class="modal-overlay" (click)="cancelPasswordReset()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Reset Password</h2>
              <button (click)="cancelPasswordReset()" class="btn-close">&times;</button>
            </div>
            <form (ngSubmit)="performPasswordReset()" class="form">
              <div class="form-group">
                <label>User:</label>
                <input type="text" [value]="passwordResetForm()!.userName" disabled>
              </div>

              <div class="form-group">
                <label>New Password:</label>
                <input type="password" [(ngModel)]="passwordResetForm()!.newPassword" name="newPassword" 
                       placeholder="Enter new password" required minlength="6">
              </div>

              <div class="form-group">
                <label>Confirm Password:</label>
                <input type="password" [(ngModel)]="passwordResetForm()!.confirmPassword" name="confirmPassword" 
                       placeholder="Confirm password" required minlength="6">
              </div>

              <div class="modal-actions">
                <button type="submit" class="btn btn-primary">Reset Password</button>
                <button type="button" (click)="cancelPasswordReset()" class="btn btn-cancel">Cancel</button>
              </div>
            </form>
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

    .users-table {
      overflow-x: auto;
      margin-top: 20px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
    }

    table thead {
      background-color: #f5f5f5;
    }

    table th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #ddd;
    }

    table td {
      padding: 12px 16px;
      border-bottom: 1px solid #eee;
      color: #555;
    }

    table tbody tr:hover {
      background-color: #f9f9f9;
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      color: white;
    }

    .badge-admin {
      background-color: #667eea;
    }

    .badge-organizer {
      background-color: #2196f3;
    }

    .badge-attendee {
      background-color: #4caf50;
    }

    .badge-sponsor {
      background-color: #ff9800;
    }

    .status {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-active {
      background-color: #d4edda;
      color: #155724;
    }

    .status-inactive {
      background-color: #f8d7da;
      color: #721c24;
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

    .user-actions {
      display: flex;
      gap: 6px;
    }

    .btn-action {
      padding: 6px 10px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }

    .btn-edit {
      background-color: #667eea;
      color: white;
    }

    .btn-edit:hover {
      background-color: #5a67d8;
    }

    .btn-reset {
      background-color: #ff9800;
      color: white;
    }

    .btn-reset:hover {
      background-color: #f57c00;
    }

    .btn-delete {
      background-color: #f44336;
      color: white;
    }

    .btn-delete:hover {
      background-color: #da190b;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #eee;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 20px;
    }

    .btn-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-close:hover {
      color: #333;
    }

    .modal .form {
      padding: 20px;
    }

    .modal-actions {
      display: flex;
      gap: 10px;
      padding: 20px;
      border-top: 1px solid #eee;
      background: #f9f9f9;
    }

    .btn-cancel {
      background-color: #ddd;
      color: #333;
      flex: 1;
    }

    .btn-cancel:hover {
      background-color: #ccc;
    }

    .modal .btn-primary {
      width: auto;
      flex: 1;
    }

    small {
      color: #999;
      display: block;
      margin-top: 4px;
    }
  `]
})
export class UserManagementComponent implements OnInit {
  newUser: WritableSignal<UserForm> = signal({
    email: '',
    name: '',
    role: 'ATTENDEE',
    password: '',
    productId: ''
  });

  private usersData = signal<User[]>([]);
  readonly users = this.usersData.asReadonly();

  private productsData = signal<Product[]>([]);
  readonly products = this.productsData.asReadonly();

  private isLoadingSignal = signal(false);
  readonly isLoading = this.isLoadingSignal.asReadonly();

  private successMsg = signal('');
  readonly successMessage = this.successMsg.asReadonly();

  private errorMsg = signal('');
  readonly errorMessage = this.errorMsg.asReadonly();

  private editingUserSignal = signal<EditingUser | null>(null);
  readonly editingUserData = this.editingUserSignal.asReadonly();

  private passwordResetFormSignal = signal<PasswordResetForm | null>(null);
  readonly passwordResetForm = this.passwordResetFormSignal.asReadonly();

  readonly isFormValid = computed(() => {
    const user = this.newUser();
    return user.email.trim().length > 0 &&
           user.name.trim().length > 0 &&
           user.role.trim().length > 0 &&
           user.password.trim().length > 0;
  });

  constructor(
    public authService: AuthService,
    private authServiceAPI: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadProducts();
  }

  getRoleDisplay(role: string): string {
    const roleMap: Record<string, string> = {
      'ADMIN': 'Admin',
      'ORGANIZER': 'Organizer',
      'ATTENDEE': 'Attendee',
      'SPONSOR': 'Sponsor'
    };
    return roleMap[role] || role;
  }

  async createUser(): Promise<void> {
    const user = this.newUser();

    // Validate email
    if (!user.email || !user.email.trim()) {
      this.errorMsg.set('Email is required');
      setTimeout(() => this.errorMsg.set(''), 5000);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      this.errorMsg.set('Please enter a valid email address');
      setTimeout(() => this.errorMsg.set(''), 5000);
      return;
    }

    // Validate name
    if (!user.name || !user.name.trim()) {
      this.errorMsg.set('Name is required');
      setTimeout(() => this.errorMsg.set(''), 5000);
      return;
    }

    // Validate role
    if (!user.role || !user.role.trim()) {
      this.errorMsg.set('Role is required');
      setTimeout(() => this.errorMsg.set(''), 5000);
      return;
    }

    // Validate password
    if (!user.password || !user.password.trim()) {
      this.errorMsg.set('Password is required');
      setTimeout(() => this.errorMsg.set(''), 5000);
      return;
    }

    if (user.password.length < 6) {
      this.errorMsg.set('Password must be at least 6 characters');
      setTimeout(() => this.errorMsg.set(''), 5000);
      return;
    }

    this.isLoadingSignal.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    try {
      const createRequest: CreateUserRequest = {
        email: user.email,
        name: user.name,
        role: user.role as Exclude<UserRole, 'SUPER_ADMIN'>,
        password: user.password,
        productId: user.productId || undefined
      };

      await this.authServiceAPI.createUser(createRequest);

      this.successMsg.set(`User "${user.email}" created successfully!`);

      // Reset form
      this.newUser.set({
        email: '',
        name: '',
        role: 'ATTENDEE',
        password: '',
        productId: ''
      });

      // Reload users
      await this.loadUsers();

      // Clear success message after 5 seconds
      setTimeout(() => this.successMsg.set(''), 5000);
    } catch (error: any) {
      const errorMessage = error?.error?.error || 'Failed to create user. Please try again.';
      this.errorMsg.set(errorMessage);
      console.error('User creation error:', error);
      
      // Still reload users so they can see the existing user with duplicate email
      await this.loadUsers();
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  private async loadUsers(): Promise<void> {
    try {
      const users = await this.authServiceAPI.getAllUsers();
      this.usersData.set(users);
    } catch (error) {
      console.error('Failed to load users:', error);
      this.usersData.set([]);
    }
  }

  private async loadProducts(): Promise<void> {
    try {
      const products = await this.authServiceAPI.getAllProducts();
      this.productsData.set(products);
    } catch (error) {
      console.error('Failed to load products:', error);
      this.productsData.set([]);
    }
  }

  editUser(user: User): void {
    this.editingUserSignal.set({
      ...user,
      editing: true
    });
  }

  cancelEdit(): void {
    this.editingUserSignal.set(null);
    this.errorMsg.set('');
  }

  async updateUser(): Promise<void> {
    const user = this.editingUserData();
    if (!user) return;

    if (!user.name || !user.name.trim()) {
      this.errorMsg.set('Name is required');
      return;
    }

    if (!user.role || !user.role.trim()) {
      this.errorMsg.set('Role is required');
      return;
    }

    this.isLoadingSignal.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    try {
      await this.authServiceAPI.updateUser(user.id, {
        name: user.name,
        role: user.role as UserRole,
        productId: user.productId || undefined,
        isActive: user.isActive
      } as any);

      this.successMsg.set(`User "${user.name}" updated successfully!`);
      this.editingUserSignal.set(null);

      // Reload users
      try {
        await this.loadUsers();
      } catch (loadError) {
        console.error('Failed to reload users:', loadError);
      }

      setTimeout(() => this.successMsg.set(''), 5000);
    } catch (error: any) {
      const errorMessage = error?.error?.error || 'Failed to update user. Please try again.';
      this.errorMsg.set(errorMessage);
      console.error('User update error:', error);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  resetPassword(user: User): void {
    this.passwordResetFormSignal.set({
      userId: user.id,
      userName: user.name || user.email,
      newPassword: '',
      confirmPassword: ''
    });
  }

  cancelPasswordReset(): void {
    this.passwordResetFormSignal.set(null);
    this.errorMsg.set('');
  }

  async performPasswordReset(): Promise<void> {
    const form = this.passwordResetForm();
    if (!form) return;

    if (!form.newPassword || form.newPassword.length < 6) {
      this.errorMsg.set('Password must be at least 6 characters');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      this.errorMsg.set('Passwords do not match');
      return;
    }

    this.isLoadingSignal.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    try {
      await this.authServiceAPI.resetUserPassword(form.userId, form.newPassword);
      this.successMsg.set(`Password for "${form.userName}" has been reset successfully!`);
      this.passwordResetFormSignal.set(null);

      setTimeout(() => this.successMsg.set(''), 5000);
    } catch (error: any) {
      const errorMessage = error?.error?.error || 'Failed to reset password. Please try again.';
      this.errorMsg.set(errorMessage);
      console.error('Password reset error:', error);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    const user = this.usersData().find(u => u.id === userId);
    const userName = user?.name || user?.email || 'User';
    
    if (!confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) {
      return;
    }

    this.isLoadingSignal.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    try {
      await this.authServiceAPI.deleteUser(userId);
      this.successMsg.set(`User "${userName}" deleted successfully!`);

      // Reload users
      try {
        await this.loadUsers();
      } catch (loadError) {
        console.error('Failed to reload users:', loadError);
      }

      setTimeout(() => this.successMsg.set(''), 5000);
    } catch (error: any) {
      const errorMessage = error?.error?.error || 'Failed to delete user. Please try again.';
      this.errorMsg.set(errorMessage);
      console.error('User delete error:', error);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }
}

