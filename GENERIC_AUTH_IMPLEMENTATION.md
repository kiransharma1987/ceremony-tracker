# Generic Authentication System - Implementation Summary

## Overview

You wanted a **generic login screen** where all users (regardless of role) enter **username/email and password**, instead of having tabs for different roles on the login screen.

## What Changes

### ❌ BEFORE (Current System)
```
Login Page
├── 👑 Admin Login Tab
│   └── Password only
├── 👤 Brother Login Tab
│   ├── Select Brother dropdown
│   └── Password
└── 🤝 Contributor Portal Tab
    └── Enter Name
```

### ✅ AFTER (New System)
```
Login Page
├── Email input
├── Password input
├── Remember me (optional)
└── Login button

User directed to appropriate dashboard based on their role
```

---

## User Roles & Access

### 1. **SUPER_ADMIN** (YOU)
- **Who**: You - system administrator
- **Email**: superadmin@ceremony.local (configured once)
- **Access**: `/super-admin` dashboard
- **Permissions**:
  - Create products (ceremonies, weddings, etc.)
  - Create users and assign roles
  - Manage all products
  - System settings
  - View all data
- **What You See**: Dashboard to manage everything

### 2. **ADMIN** (Product Admin)
- **Who**: Admin for specific event/product
- **Email**: admin@ceremony.local
- **Access**: `/admin` dashboard
- **Permissions**:
  - Create/edit expenses
  - Create/edit deposits
  - Create/edit contributions
  - Manage participants (add/remove)
  - Create settlements
  - View reports
- **What They See**: Event management interface (current)

### 3. **PARTICIPANT** (Brother/Family)
- **Who**: Family member who owns share
- **Email**: hnk@ceremony.local
- **Access**: `/brother` (view-only)
- **Permissions**:
  - View settlement (who paid what, who owes)
  - View expense breakdown
  - View contributions
  - View budgets
- **What They See**: Settlement view only

### 4. **CONTRIBUTOR** (External)
- **Who**: Someone from outside who contributed
- **Email**: contributor@ceremony.local
- **Access**: `/contributor` portal
- **Permissions**:
  - Submit contribution amount
  - View contribution status
- **What They See**: Simple form to add contribution

---

## Database Schema Change

```prisma
model User {
  id             String   @id @default(cuid())
  email          String   @unique
  password       String   (hashed with bcrypt)
  name           String
  displayName    String?  (override per product)
  role           UserRole (SUPER_ADMIN | ADMIN | PARTICIPANT | BROTHER | CONTRIBUTOR)
  
  productId      String?  (NULL for SUPER_ADMIN only)
  brotherId      String?  (legacy, for backward compat)
  
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  product        Product? @relation(fields: [productId], references: [id])
}

enum UserRole {
  SUPER_ADMIN
  ADMIN
  PARTICIPANT
  BROTHER      // backward compat for PARTICIPANT
  CONTRIBUTOR
}
```

---

## Login Flow

```
User visits app
    ↓
Directed to /login (if not authenticated)
    ↓
User enters email: admin@ceremony.local
User enters password: ***
    ↓
Clicks "Login"
    ↓
Backend validates credentials
    ↓
Backend looks up user role and product
    ↓
Backend generates JWT token with role + productId
    ↓
Frontend receives token + user info + redirectUrl
    ↓
Frontend stores token in localStorage
    ↓
Frontend redirects to:
  - /super-admin (if SUPER_ADMIN)
  - /admin (if ADMIN)
  - /brother (if PARTICIPANT/BROTHER)
  - /contributor (if CONTRIBUTOR)
    ↓
User sees their role-specific dashboard
```

---

## Backend Changes

### New Login Endpoint

**POST /auth/login**
```typescript
Request:
{
  "email": "admin@ceremony.local",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "email": "admin@ceremony.local",
    "name": "Admin",
    "displayName": "Event Admin",
    "role": "admin",
    "productId": "ceremony_2026",
    "productName": "Padmamma's First Year"
  },
  "redirectUrl": "/admin"
}
```

### Other Endpoints (New)

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/auth/login` | POST | ❌ | Generic login for all users |
| `/auth/users` | POST | ✅ (SUPER_ADMIN) | Create new user |
| `/auth/users` | GET | ✅ (SUPER_ADMIN) | List all users |
| `/auth/users/:userId` | PUT | ✅ (SUPER_ADMIN or self) | Update user |
| `/auth/change-password` | POST | ✅ (authenticated) | User changes own password |
| `/auth/reset-password/:userId` | POST | ✅ (SUPER_ADMIN) | Admin resets user password |

---

## Frontend Changes

### Login Component
- **Old**: 3 tabs (Admin, Brother, Contributor)
- **New**: Single form (Email + Password)
- **New**: Forgot password link (optional)
- **New**: Better error messages
- **New**: Loading state

### Auth Service
- **New Method**: `login(email, password)` - generic login
- **New Method**: `changePassword(current, new)` - user changes password
- **New Method**: `forgotPassword(email)` - request password reset
- **New Computed Signals**: 
  - `isSuperAdmin()`
  - `isAdmin()`
  - `isParticipant()`
  - `isContributor()`

### New Guards
- **SuperAdminGuard**: Only SUPER_ADMIN can access `/super-admin`
- **AdminGuard**: Only ADMIN can access `/admin`
- **ParticipantGuard**: Only PARTICIPANT/BROTHER can access `/brother`
- **ContributorGuard**: Only CONTRIBUTOR can access `/contributor`
- **AuthenticatedGuard**: Only authenticated users
- **NoAuthGuard**: Prevent logged-in users from accessing `/login`

### New Routes

```typescript
routes: [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [NoAuthGuard]  // Already logged in? Redirect
  },
  
  // Super Admin routes
  {
    path: 'super-admin',
    canActivate: [SuperAdminGuard],
    children: [
      { path: '', component: SuperAdminDashboard },
      { path: 'products', component: ProductManagement },
      { path: 'users', component: UserManagement },
      { path: 'settings', component: SystemSettings }
    ]
  },
  
  // Admin routes (existing)
  {
    path: 'admin',
    canActivate: [AdminGuard],
    component: AdminDashboard
  },
  
  // Participant routes
  {
    path: 'brother',
    canActivate: [ParticipantGuard],
    component: BrotherView
  },
  
  // Contributor routes
  {
    path: 'contributor',
    canActivate: [ContributorGuard],
    component: ContributorPortal
  }
]
```

---

## Example Users for Your Ceremony

| Email | Password | Name | Role | Product | Purpose |
|-------|----------|------|------|---------|---------|
| super@ceremony.local | SuperSecure123! | You | SUPER_ADMIN | — | System admin (you manage everything) |
| admin@ceremony.local | AdminPass123! | Admin | ADMIN | Ceremony 2026 | Event admin (manages expenses) |
| hnk@ceremony.local | HNKPass123! | HNK | PARTICIPANT | Ceremony 2026 | Brother (view settlement) |
| hnp@ceremony.local | HNPPass123! | HNP | PARTICIPANT | Ceremony 2026 | Brother (view settlement) |
| hns@ceremony.local | HNSPass123! | HNS | PARTICIPANT | Ceremony 2026 | Brother (view settlement) |
| hnm@ceremony.local | HNMPass123! | HNM | PARTICIPANT | Ceremony 2026 | Brother (view settlement) |
| donor1@ceremony.local | DonorPass123! | External Donor | CONTRIBUTOR | Ceremony 2026 | Can submit contribution |

---

## Key Benefits

✅ **Professional**: Industry-standard login (email + password)  
✅ **Secure**: No role hints on login screen  
✅ **Scalable**: Support multiple products easily  
✅ **Flexible**: Add/remove users without code changes  
✅ **Maintainable**: Single login flow, not 3 separate ones  
✅ **Future-Proof**: Ready for multiple event support  
✅ **Role-Based**: Automatic redirection to appropriate dashboard  
✅ **User Management**: Super admin can create users anytime  

---

## Migration Path

### Phase 1: Setup Super Admin Account
```
Create user:
- Email: super@ceremony.local
- Password: Generate secure password
- Role: SUPER_ADMIN
```

### Phase 2: Create Product Users
```
Create users for Ceremony 2026:
- Email: admin@ceremony.local (ADMIN)
- Emails: hnk@, hnp@, hns@, hnm@ceremony.local (PARTICIPANT)
- Emails: contributor@ceremony.local (CONTRIBUTOR)
```

### Phase 3: Test Login Flows
```
✓ Super admin login → sees /super-admin
✓ Admin login → sees /admin (existing)
✓ Participant login → sees /brother (existing)
✓ Contributor login → sees /contributor (existing)
```

### Phase 4: Deprecate Old Tab System
```
Once tested and working:
- Remove the old 3-tab login
- Deploy new generic login
```

---

## Files Created (DRAFT)

1. **AUTH_SYSTEM_UPDATE.md** - This strategic overview
2. **backend/src/routes/auth.ts.draft** - New backend endpoints
3. **src/app/features/auth/login.component.ts.draft** - New login UI
4. **src/app/services/auth.service.ts.draft** - Updated auth service
5. **src/app/guards/index.ts.draft** - New role-based guards
6. **src/app/models/user.model.ts.draft** - Updated user models

---

## Next Steps

1. **Review**: Look at the draft files and confirm architecture matches your vision
2. **Database**: Run migration to add new `UserRole` enum and `displayName` field
3. **Backend**: Replace auth routes with new generic login
4. **Frontend**: Update login component and auth service
5. **Guards**: Add new role-based guards to routes
6. **Testing**: Test all login flows with different roles
7. **Deploy**: Roll out to production

---

## Security Notes

✅ Passwords hashed with bcrypt (10 rounds)  
✅ JWT tokens expire in 7 days  
✅ Token stored in localStorage  
✅ CORS enabled for your domain  
✅ Rate limiting recommended for `/auth/login`  
✅ HTTPS only in production  
✅ No role hints on login screen  
✅ Email existence not revealed on login failure  
