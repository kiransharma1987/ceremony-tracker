import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  User, 
  UserRole, 
  BrotherId, 
  BROTHERS 
} from '../models';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    brotherId?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);
  private token = signal<string | null>(null);
  
  // Computed signals for easy access
  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');
  readonly isBrother = computed(() => this.currentUser()?.role === 'brother');
  readonly isContributor = computed(() => this.currentUser()?.role === 'contributor');
  readonly userRole = computed(() => this.currentUser()?.role);

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

  // Login with email and password (API)
  async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, {
          email,
          password
        })
      );

      const user: User = {
        id: response.user.id,
        role: response.user.role as UserRole,
        brotherId: response.user.brotherId as BrotherId | undefined,
        accessToken: response.token
      };

      this.token.set(response.token);
      this.currentUser.set(user);
      this.saveToStorage(response.token, user);

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  // Admin login - tries API first, falls back to demo mode
  async loginAsAdmin(password: string): Promise<boolean> {
    // Try API login first
    try {
      const success = await this.login('admin@ceremony.app', password);
      if (success) {
        console.log('API login successful, token:', this.token()?.substring(0, 20) + '...');
        return true;
      }
    } catch (error) {
      console.error('API login failed:', error);
    }

    // Fallback to demo mode for offline/development ONLY if password matches
    if (password === 'admin123') {
      console.log('Falling back to demo mode');
      const user: User = {
        id: 'KHK',
        role: 'admin',
        accessToken: 'demo'
      };
      this.currentUser.set(user);
      this.token.set('demo');
      this.saveToStorage('demo', user);
      return true;
    }
    return false;
  }

  // Brother login via access link
  loginAsBrother(brotherId: BrotherId, token: string): boolean {
    const brother = BROTHERS.find(b => b.id === brotherId);
    if (brother && (token === 'demo' || this.validateBrotherToken(brotherId, token))) {
      const user: User = {
        id: brotherId,
        role: 'brother',
        brotherId: brotherId,
        accessToken: token
      };
      this.currentUser.set(user);
      this.token.set(token);
      this.saveToStorage(token, user);
      return true;
    }
    return false;
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
