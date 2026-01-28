# Generic Authentication System - Draft Architecture

## Current State ❌
- Login screen has 3 separate tabs (Admin, Brother, Contributor)
- Admin: password only
- Brother: dropdown selection + password
- Contributor: just name

## New Architecture ✅

### 1. Generic Login Screen
```
┌─────────────────────────┐
│  🪔 Event Expense Track │
│  (Event name)           │
├─────────────────────────┤
│ Username/Email:         │
│ [____________]          │
│                         │
│ Password:               │
│ [____________]          │
│                         │
│ [Login] [Forgot Pass]   │
│                         │
│ Error: Invalid creds    │
└─────────────────────────┘
```

### 2. User Types & Permissions

#### Super Admin (YOU)
- **Email**: superadmin@ceremony.local (or configured)
- **Role**: SUPER_ADMIN
- **Permissions**:
  - Create products (ceremonies, weddings, etc.)
  - Create users and assign roles
  - Define product participants
  - Configure expense categories
  - Configure roles and permissions
  - View all reports
  - System settings
- **UI Routes**: `/super-admin` (new)

#### Admin (For Each Product)
- **Email**: admin@ceremony.local (you create these)
- **Role**: ADMIN
- **Permissions**:
  - Create/edit expenses, deposits, contributions
  - Manage participants (add/remove from this product)
  - Create settlements
  - View reports
  - Cannot create users or modify roles
- **UI Routes**: `/admin`

#### Brother/Participant
- **Email**: brother@ceremony.local (you create)
- **Role**: PARTICIPANT or BROTHER
- **Permissions**:
  - View their own settlement
  - View expense breakdown
  - View deposits paid
  - View contributions
  - Cannot modify anything
- **UI Routes**: `/brother` (view-only)

#### Contributor (External)
- **Email**: contributor@ceremony.local (you create)
- **Role**: CONTRIBUTOR
- **Permissions**:
  - Submit contributions
  - View contribution status
  - Cannot see expenses or settlement
- **UI Routes**: `/contributor`

### 3. Database Schema Changes

**Existing Users Table**:
```prisma
model User {
  id             String   @id @default(cuid())
  email          String   @unique
  password       String
  name           String
  role           UserRole  // SUPER_ADMIN | ADMIN | PARTICIPANT | BROTHER | CONTRIBUTOR
  productId      String?   // Null for SUPER_ADMIN
  brotherId      String?   // Only for BROTHER/PARTICIPANT (legacy field)
  displayName    String?   // Override name per product
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  product        Product?  @relation(fields: [productId], references: [id])
  @@index([email])
  @@index([productId])
}

enum UserRole {
  SUPER_ADMIN
  ADMIN
  PARTICIPANT
  BROTHER      // Alias for PARTICIPANT (backward compat)
  CONTRIBUTOR
}
```

### 4. Backend Changes

#### New Routes

**POST /auth/login** (Generic)
```typescript
// Request
{
  "email": "admin@ceremony.local",
  "password": "password123"
}

// Response
{
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "email": "admin@ceremony.local",
    "name": "Admin Name",
    "role": "ADMIN",
    "productId": "product_123",
    "displayName": "Admin",
    "redirectUrl": "/admin"  // Determine based on role
  }
}
```

**POST /auth/logout**
```typescript
// Clears token on frontend, no backend action needed
```

**POST /auth/refresh-token** (Optional)
```typescript
// Refresh expired JWT
```

**POST /auth/forgot-password** (New)
```typescript
{
  "email": "admin@ceremony.local"
}
// Sends reset link via email
```

### 5. Frontend Changes

#### Login Component
```typescript
// BEFORE: 3 tab components
activeTab: 'admin' | 'brother' | 'contributor'
adminPassword: string
selectedBrother: string
brotherPassword: string
contributorName: string

// AFTER: Single generic form
email: string
password: string
isLoading: boolean
errorMessage: string
```

#### Auth Service
```typescript
// Add new method
async loginGeneric(email: string, password: string): Promise<boolean>

// Redirect logic based on role
redirectAfterLogin(user: User) {
  if (user.role === 'SUPER_ADMIN') {
    this.router.navigate(['/super-admin']);
  } else if (user.role === 'ADMIN') {
    this.router.navigate(['/admin']);
  } else if (user.role === 'PARTICIPANT' || user.role === 'BROTHER') {
    this.router.navigate(['/brother']);
  } else if (user.role === 'CONTRIBUTOR') {
    this.router.navigate(['/contributor']);
  }
}
```

#### Guard Updates
```typescript
// Create new guards
- super-admin.guard.ts: role === 'SUPER_ADMIN'
- admin.guard.ts: role === 'ADMIN'
- participant.guard.ts: role === 'PARTICIPANT' || role === 'BROTHER'
- contributor.guard.ts: role === 'CONTRIBUTOR'
```

### 6. Super Admin Features (New Screens)

#### Dashboard (`/super-admin`)
- List of all products
- User management
- System settings

#### Product Management
- Create new product (ceremony, wedding, etc.)
- Configure participants
- Assign admin user
- Define categories

#### User Management
- Create users
- Assign roles
- Link to products
- Reset passwords
- Deactivate users

### 7. Login Flow

```
User enters email/password
        ↓
Backend validates credentials
        ↓
Backend checks role and product
        ↓
Generate JWT with role/productId
        ↓
Frontend receives token + user info
        ↓
Frontend checks role
        ↓
Redirect to appropriate dashboard
```

### 8. Migration from Current System

**Current Hardcoded Users**:
```
Email: admin@ceremony.local
Password: admin123
Name: Admin
Role: ADMIN
ProductId: ceremony_001
```

```
Email: hnk@ceremony.local
Password: hnk123
Name: HNK
Role: PARTICIPANT / BROTHER
ProductId: ceremony_001
```

### 9. Security Considerations

✅ **Password Hashing**: bcrypt (already implemented)
✅ **JWT Tokens**: Signed with secret, expiry 7 days
✅ **Email Validation**: Check format
✅ **Rate Limiting**: Needed for login endpoint (to prevent brute force)
✅ **CORS**: Already configured
✅ **HTTPS Only**: In production

### 10. Example Users Configuration

**For Your Ceremony Product**:

| Email | Password | Name | Role | Product |
|-------|----------|------|------|---------|
| super@ceremony.local | SuperPassword123! | You | SUPER_ADMIN | - |
| admin@ceremony.local | AdminPass123! | Admin Name | ADMIN | Ceremony 2026 |
| hnk@ceremony.local | HNKPass123! | HNK | PARTICIPANT | Ceremony 2026 |
| hnp@ceremony.local | HNPPass123! | HNP | PARTICIPANT | Ceremony 2026 |
| hnm@ceremony.local | HNMPass123! | HNM | PARTICIPANT | Ceremony 2026 |
| hns@ceremony.local | HNSPass123! | HNS | PARTICIPANT | Ceremony 2026 |
| contributor1@ceremony.local | Contrib123! | External Donor | CONTRIBUTOR | Ceremony 2026 |

## Implementation Phases

### Phase 1: Authentication Updates
- Update schema with new role enum
- Update backend login endpoint
- Create super-admin route
- Update frontend login component
- Create guards for each role

### Phase 2: Super Admin Dashboard
- Create product CRUD
- Create user management
- Create role assignment

### Phase 3: Redirect Logic
- Role-based routing
- Landing page per role
- Product context switching

### Phase 4: Migration & Testing
- Seed new users
- Test all auth flows
- Verify permissions
- Test product switching

## Benefits

✅ **Scalable**: Add new products and users easily
✅ **Flexible**: Different roles for different products
✅ **Secure**: Generic login, no role hints on login screen
✅ **Professional**: Industry-standard authentication
✅ **Maintainable**: Single login flow instead of 3 tabs
✅ **Future-Proof**: Ready for multi-product deployments
