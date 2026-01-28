import { Routes } from '@angular/router';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { AdminGuard } from './guards/admin.guard';
import { ParticipantGuard } from './guards/participant.guard';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import { NoAuthGuard } from './guards/no-auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    canActivate: [NoAuthGuard],
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  
  // Super Admin routes
  {
    path: 'super-admin',
    canActivate: [SuperAdminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/super-admin/super-admin-dashboard.component').then(m => m.SuperAdminDashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./features/super-admin/product-management.component').then(m => m.ProductManagementComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/super-admin/user-management.component').then(m => m.UserManagementComponent)
      }
    ]
  },

  // Admin routes
  {
    path: 'admin',
    canActivate: [AdminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'expenses',
        loadComponent: () => import('./features/admin/expense-management.component').then(m => m.ExpenseManagementComponent)
      },
      {
        path: 'contributions',
        loadComponent: () => import('./features/admin/contribution-management.component').then(m => m.ContributionManagementComponent)
      },
      {
        path: 'deposits',
        loadComponent: () => import('./features/admin/deposit-management.component').then(m => m.DepositManagementComponent)
      },
      {
        path: 'budget',
        loadComponent: () => import('./features/admin/budget-management.component').then(m => m.BudgetManagementComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/admin/reports.component').then(m => m.ReportsComponent)
      }
    ]
  },

  // Participant routes
  {
    path: 'brother',
    canActivate: [ParticipantGuard],
    loadComponent: () => import('./features/brother/brother-view.component').then(m => m.BrotherViewComponent)
  },

  // Contributor routes
  {
    path: 'contributor',
    loadComponent: () => import('./features/contributor/contributor-view.component').then(m => m.ContributorViewComponent)
  },

  {
    path: '**',
    redirectTo: 'login'
  }
];
