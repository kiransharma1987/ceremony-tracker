import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, LoginResponse, CreateUserRequest, Product } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);
  private token = signal<string | null>(null);
  
  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isSuperAdmin = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'SUPER_ADMIN';
  });
  readonly isAdmin = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'ADMIN';
  });
  readonly isOrganizer = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'ORGANIZER';
  });
  readonly isAttendee = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'ATTENDEE';
  });
  readonly isSponsor = computed(() => {
    const role = this.currentUser()?.role;
    return role === 'SPONSOR';
  });
  readonly userRole = computed(() => this.currentUser()?.role);
  readonly productId = computed(() => this.currentUser()?.productId);

  constructor(private http: HttpClient, private router: Router) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const storedToken = localStorage.getItem('ceremony_tracker_token');
    const storedUser = localStorage.getItem('ceremony_tracker_user');
    if (storedToken && storedUser) {
      try {
        this.token.set(storedToken);
        this.currentUser.set(JSON.parse(storedUser) as User);
      } catch {
        this.clearStorage();
      }
    }
  }

  private saveToStorage(token: string, user: User): void {
    localStorage.setItem('ceremony_tracker_token', token);
    localStorage.setItem('ceremony_tracker_user', JSON.stringify(user));
    this.token.set(token);
    this.currentUser.set(user);
  }

  private clearStorage(): void {
    localStorage.removeItem('ceremony_tracker_token');
    localStorage.removeItem('ceremony_tracker_user');
    localStorage.removeItem('selectedProductId');
    this.token.set(null);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return this.token();
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.token();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
          email,
          password
        })
      );

      if (response.token && response.user) {
        this.saveToStorage(response.token, response.user);
        if (response.redirectUrl) {
          this.router.navigate([response.redirectUrl]);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  logout(): void {
    this.clearStorage();
    this.router.navigate(['/login']);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/auth/change-password`,
          { currentPassword, newPassword },
          { headers: this.getAuthHeaders() }
        )
      );
      return true;
    } catch (error) {
      console.error('Change password error:', error);
      return false;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<User>(
          `${environment.apiUrl}/auth/me`,
          { headers: this.getAuthHeaders() }
        )
      );
      this.currentUser.set(response);
      return response;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ user: User }>(
          `${environment.apiUrl}/auth/users`,
          userData,
          { headers: this.getAuthHeaders() }
        )
      );
      return response.user;
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ users: User[] }>(
          `${environment.apiUrl}/auth/users`,
          { headers: this.getAuthHeaders() }
        )
      );
      return response.users;
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const response = await firstValueFrom(
        this.http.put<{ user: User }>(
          `${environment.apiUrl}/auth/users/${userId}`,
          updates,
          { headers: this.getAuthHeaders() }
        )
      );
      return response.user;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.delete(
          `${environment.apiUrl}/auth/users/${userId}`,
          { headers: this.getAuthHeaders() }
        )
      );
      return true;
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  async resetUserPassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post(
          `${environment.apiUrl}/auth/reset-password/${userId}`,
          { newPassword },
          { headers: this.getAuthHeaders() }
        )
      );
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  async getAllProducts(): Promise<Product[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ products: Product[] }>(
          `${environment.apiUrl}/products`,
          { headers: this.getAuthHeaders() }
        )
      );
      return response.products;
    } catch (error) {
      console.error('Get products error:', error);
      throw error;
    }
  }
}
