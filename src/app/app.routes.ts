import { Routes } from '@angular/router';
import { adminGuard, brotherGuard, contributorGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
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
  {
    path: 'brother/:brotherId',
    canActivate: [brotherGuard],
    loadComponent: () => import('./features/brother/brother-view.component').then(m => m.BrotherViewComponent)
  },
  {
    path: 'contribute',
    canActivate: [contributorGuard],
    loadComponent: () => import('./features/contributor/contributor-view.component').then(m => m.ContributorViewComponent)
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
