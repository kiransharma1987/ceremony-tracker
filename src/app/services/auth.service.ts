import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  User, 
  UserRole,
  LoginResponse,
  ChangePasswordRequest,
  CreateUserRequest,
  Product
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);
  private token = signal<string | null>(null);
  
  // Computed signals for easy access
  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isSuperAdmin = computed(() => this.currentUser()?.role === 'super_admin');
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly isParticipant = computed(() => 
    this.currentUser()?.role === 'participant' || this.currentUser()?.role === 'brother'
  );
  readonly isContributor = computed(() => this.currentUser()?.role === 'contributor');
  readonly userRole = computed(() => this.currentUser()?.role);
  readonly productId = computed(() => this.currentUser()?.productId);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
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
  }

  private clearStorage(): void {
    localStorage.removeItem('ceremony_tracker_token');
    localStorage.removeItem('ceremony_tracker_user');
  }

  getAuthHeaders(): HttpHeaders {
    const t = this.token();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(t ? { 'Authorization': `Bearer ${t}` } : {})
    });
  }

  getToken(): string | null {
    return this.token();
  }

  /**
   * Generic login with email and password
   */
  async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
          email,
          password
        })
      );

      const user: User = response.user;
      user.accessToken = response.token;

      this.token.set(response.token);
      this.currentUser.set(user);
      this.saveToStorage(response.token, user);

      // Redirect based on role
      this.redirectAfterLogin(response.redirectUrl);
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Redirect user based on their role and redirect URL from backend
   */
  private redirectAfterLogin(redirectUrl: string): void {
    this.router.navigate([redirectUrl]).catch(error => {
      console.error('Navigation error:', error);
      // Fallback redirect
      if (this.isSuperAdmin()) {
        this.router.navigate(['/super-admin']);
      } else if (this.isAdmin()) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  /**
   * Logout user
   */
  logout(): void {
    this.clearStorage();
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  /**
   * Change password (user themselves)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.post<{ message: string }>(
          `${environment.apiUrl}/auth/change-password`,
          { currentPassword, newPassword },
          { headers: this.getAuthHeaders() }
        )
      );
      return true;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Get current user (refresh from backend)
   */
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

  /**
   * Create user (Super Admin only)
   */
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

  /**
   * Get all users (Super Admin only)
   */
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

  /**
   * Update user (Super Admin or self)
   */
  async updateUser(userId: string, updates: any): Promise<User> {
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
}
      this.saveToStorage('demo', user);
      return true;
    }
    return false;
  }

  // Brother login - uses API authentication with admin credentials
  async loginAsBrother(brotherId: BrotherId, password: string): Promise<boolean> {
    const brother = BROTHERS.find(b => b.id === brotherId);
    if (!brother) return false;

    // Brother password maps to admin password for API access
    const apiPassword = password === 'padmamma2026' ? 'puranjana@2026' : password;

    // Try API login with admin credentials
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
          email: 'admin@ceremony.app',
          password: apiPassword
        })
      );

      const user: User = {
        id: brotherId,
        role: 'brother',
        brotherId: brotherId,
        accessToken: response.token
      };

      this.token.set(response.token);
      this.currentUser.set(user);
      this.saveToStorage(response.token, user);
      console.log('Brother API login successful');
      return true;
    } catch (error) {
      console.error('Brother API login failed:', error);
      // Fallback to demo mode only for development
      if (password === 'padmamma2026') {
        const user: User = {
          id: brotherId,
          role: 'brother',
          brotherId: brotherId,
          accessToken: 'demo'
        };
        this.currentUser.set(user);
        this.token.set('demo');
        this.saveToStorage('demo', user);
        return true;
      }
      return false;
    }
  }

  // Contributor login via secure link
  loginAsContributor(name: string, token: string): boolean {
    if (token === 'demo' || this.validateContributorToken(token)) {
      const user: User = {
        id: `contributor_${Date.now()}`,
        role: 'contributor',
        contributorName: name,
        accessToken: token
      };
      this.currentUser.set(user);
      this.token.set(token);
      this.saveToStorage(token, user);
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUser.set(null);
    this.token.set(null);
    this.clearStorage();
    this.router.navigate(['/login']);
  }

  // Generate access links for brothers
  generateBrotherAccessLink(brotherId: BrotherId): string {
    const tkn = this.generateToken();
    localStorage.setItem(`brother_token_${brotherId}`, tkn);
    return `${window.location.origin}/brother/${brotherId}?token=${tkn}`;
  }

  // Generate access link for contributors
  generateContributorAccessLink(): string {
    const tkn = this.generateToken();
    localStorage.setItem('contributor_token', tkn);
    return `${window.location.origin}/contribute?token=${tkn}`;
  }

  private validateBrotherToken(brotherId: BrotherId, token: string): boolean {
    const storedToken = localStorage.getItem(`brother_token_${brotherId}`);
    return storedToken === token;
  }

  private validateContributorToken(token: string): boolean {
    const storedToken = localStorage.getItem('contributor_token');
    return storedToken === token;
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Check if user can perform action
  canEdit(): boolean {
    return this.isAdmin();
  }

  canViewAllExpenses(): boolean {
    return this.isAdmin() || this.isBrother();
  }

  canAddContribution(): boolean {
    return this.isAdmin() || this.isContributor();
  }

  getCurrentBrotherId(): BrotherId | null {
    const user = this.currentUser();
    return user?.brotherId || null;
  }
}
