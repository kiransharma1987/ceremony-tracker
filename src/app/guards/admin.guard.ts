import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const isAdmin = this.authService.isAdmin();
    const isSuperAdmin = this.authService.isSuperAdmin();

    if (!isAdmin && !isSuperAdmin) {
      console.warn('Admin access denied');
      this.router.navigate(['/login']);
      return false;
    }

    // If SUPER_ADMIN, check if they have selected a product
    if (isSuperAdmin && !this.authService.productId()) {
      const selectedProductId = localStorage.getItem('selectedProductId');
      if (!selectedProductId) {
        // Redirect to product selector
        this.router.navigate(['/super-admin/select-product']);
        return false;
      }
    }

    return true;
  }
}
