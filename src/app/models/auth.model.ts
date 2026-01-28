// User and Authentication Models

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'ORGANIZER' | 'ATTENDEE' | 'SPONSOR';

export interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  role: UserRole;
  productId?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  accessToken?: string;
}

export interface Product {
  id: string;
  name: string;
  type: 'CEREMONY' | 'WEDDING' | 'TEAM_DINNER' | 'SHARED_APARTMENT' | 'TRIP';
  description?: string;
  currency: string;
  overallBudget: number;
  isClosed: boolean;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  users?: User[];
  userCount?: number;
  expenseCount?: number;
  contributionCount?: number;
  depositCount?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  redirectUrl: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  displayName?: string;
  role: Exclude<UserRole, 'super_admin'>;
  productId?: string;
}

export interface UpdateUserRequest {
  name?: string;
  displayName?: string;
  role?: Exclude<UserRole, 'super_admin'>;
  productId?: string;
  isActive?: boolean;
}

// Role utilities

export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    SUPER_ADMIN: 'Super Administrator',
    ADMIN: 'Event Administrator',
    ORGANIZER: 'Event Organizer',
    ATTENDEE: 'Attendee',
    SPONSOR: 'Sponsor'
  };
  return displayNames[role];
}

export function getRoleIcon(role: UserRole): string {
  const icons: Record<UserRole, string> = {
    SUPER_ADMIN: '👑',
    ADMIN: '🔧',
    ORGANIZER: '📋',
    ATTENDEE: '👤',
    SPONSOR: '💰'
  };
  return icons[role];
}

export function getRoleColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    SUPER_ADMIN: '#f44336', // red
    ADMIN: '#667eea',        // purple
    ORGANIZER: '#2196f3',    // blue
    ATTENDEE: '#4caf50',     // green
    SPONSOR: '#ff9800'       // orange
  };
  return colors[role];
}

export const PRODUCT_TYPES = [
  { value: 'CEREMONY', label: 'Ceremony', icon: '🪔' },
  { value: 'WEDDING', label: 'Wedding', icon: '💒' },
  { value: 'TEAM_DINNER', label: 'Team Dinner', icon: '🍽️' },
  { value: 'SHARED_APARTMENT', label: 'Shared Apartment', icon: '🏠' },
  { value: 'TRIP', label: 'Trip', icon: '✈️' }
];

export function getProductTypeLabel(type: string): string {
  const pt = PRODUCT_TYPES.find(p => p.value === type);
  return pt?.label || type;
}

export function getProductTypeIcon(type: string): string {
  const pt = PRODUCT_TYPES.find(p => p.value === type);
  return pt?.icon || '📦';
}
