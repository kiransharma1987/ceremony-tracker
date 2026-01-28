# Implementation Notes for Product Configuration

## Draft Files Created

### 1. **PRODUCT_CONFIG_PLAN.md**
Comprehensive plan for converting the app into a configurable product platform
- Overview of new concepts (Product, Configurable Elements)
- Detailed data model changes
- Backend API structure
- Frontend structure
- Implementation strategy (4 phases)
- Example use cases
- Benefits and backward compatibility

### 2. **backend/prisma/schema.prisma.draft**
Extended Prisma schema with configuration support
- New tables: Product, ProductRole, ProductCategory, ProductParticipant, ProductUser, ProductSettings
- Modified existing tables to reference product and configuration
- Maintains backward compatibility with legacy Settings model
- All foreign keys with cascade delete

### 3. **src/app/services/product-config.service.ts.draft**
Frontend configuration service for managing products and settings
- State management using Angular signals
- Load product and configuration
- CRUD operations for categories, participants, roles
- Utility functions for getting names from IDs

### 4. **src/app/models/product-config.model.ts.draft**
TypeScript interfaces and models for product configuration
- All models (Product, Category, Role, Participant, User, Settings)
- Create request models
- Default permissions and roles
- Product templates for different use cases:
  - CEREMONY (default)
  - WEDDING
  - TEAM_DINNER
  - SHARED_APARTMENT
  - TRIP

## Migration Strategy

### Phase 1: Backend Setup (Week 1)
1. Run database migration to add new tables
2. Create seed migration script to:
   - Create default product from existing settings
   - Create default roles (ADMIN, PARTICIPANT, VIEWER)
   - Create default categories
   - Create default participants (HNK, HNP, HNS, HNM)
   - Migrate existing expenses/contributions/deposits to new product
3. Build configuration API endpoints

### Phase 2: Frontend Setup (Week 1-2)
1. Add ProductConfigService
2. Update models and add new interfaces
3. Add product selector to header
4. Create AppComponent context provider for current product

### Phase 3: Refactor Existing Components (Week 2-3)
1. Update all components to use configuration instead of hardcoded values
2. Replace EXPENSE_CATEGORIES with dynamic categories
3. Replace BROTHERS with dynamic participants
4. Update models to use ProductParticipant IDs instead of strings

### Phase 4: Configuration UI (Week 3-4)
1. Create product management page
2. Create category management page
3. Create participant management page
4. Create role management page
5. Create product templates/wizard

### Phase 5: Testing & Deployment (Week 4-5)
1. Data migration testing
2. Backward compatibility testing
3. Multi-product testing
4. Deploy to staging

## Key Decisions Made

### 1. **Backward Compatibility**
- Keep legacy Settings table intact
- Create default product for existing data
- Gradual migration approach (not forced)

### 2. **Participant Model**
- Separate ProductParticipant from User
- One User can have multiple ProductUser entries (multi-product)
- Allows different roles in different products

### 3. **Foreign Keys**
- All product-related tables have productId FK with CASCADE delete
- Allows complete product deletion with all related data

### 4. **Permissions**
- Stored as JSON array for flexibility
- Can be extended for fine-grained access control
- Pre-defined permission sets provided

## API Endpoints to Create

### Products
```
GET    /api/products
POST   /api/products
GET    /api/products/:id
PUT    /api/products/:id
DELETE /api/products/:id
```

### Configuration
```
GET    /api/products/:id/config
PUT    /api/products/:id/config
GET    /api/products/:id/categories
POST   /api/products/:id/categories
PUT    /api/products/:id/categories/:catId
DELETE /api/products/:id/categories/:catId

GET    /api/products/:id/participants
POST   /api/products/:id/participants
PUT    /api/products/:id/participants/:pId
DELETE /api/products/:id/participants/:pId

GET    /api/products/:id/roles
POST   /api/products/:id/roles
PUT    /api/products/:id/roles/:roleId
DELETE /api/products/:id/roles/:roleId

GET    /api/products/:id/settings
PUT    /api/products/:id/settings
```

## Database Migration Steps

```sql
-- Create new tables
CREATE TABLE products (...)
CREATE TABLE product_roles (...)
CREATE TABLE product_categories (...)
CREATE TABLE product_participants (...)
CREATE TABLE product_users (...)
CREATE TABLE product_settings (...)

-- Add foreign keys to existing tables
ALTER TABLE expenses ADD COLUMN product_id
ALTER TABLE expenses ADD COLUMN category_id
ALTER TABLE contributions ADD COLUMN product_id
ALTER TABLE deposits ADD COLUMN product_id
ALTER TABLE budgets ADD COLUMN product_id
ALTER TABLE budgets ADD COLUMN category_id

-- Create default product from settings
INSERT INTO products (...) VALUES (DEFAULT)
INSERT INTO product_roles (...) VALUES (DEFAULT_ROLES)
INSERT INTO product_categories (...) VALUES (DEFAULT_CATEGORIES)
INSERT INTO product_participants (...) VALUES (BROTHERS)
INSERT INTO product_settings (...) SELECT * FROM settings

-- Migrate existing data
UPDATE expenses SET product_id = (SELECT id FROM products LIMIT 1)
UPDATE contributions SET product_id = (SELECT id FROM products LIMIT 1)
UPDATE deposits SET product_id = (SELECT id FROM products LIMIT 1)
UPDATE budgets SET product_id = (SELECT id FROM products LIMIT 1)
```

## Frontend Changes Overview

### AppComponent
```typescript
// Add product context provider
<app-product-selector />
<app-main-content [productId]="currentProduct().id" />
```

### Header Component
- Add product selector dropdown
- Show current product name
- Add "New Product" button

### All Management Components
Replace:
```typescript
// OLD
categories = EXPENSE_CATEGORIES;
brothers = BROTHERS;
```

With:
```typescript
// NEW
categories = this.configService.categories;
participants = this.configService.participants;
```

### Expense/Deposit/Contribution Components
Replace:
```typescript
// OLD
paidBy: { id: 'HNK', name: 'HNK' }

// NEW
paidBy: participantId (UUID)
paid_by_name: computed from participant lookup
```

## Testing Checklist

- [ ] Migration script creates default product correctly
- [ ] Existing data is preserved and migrated
- [ ] Configuration service loads product and config
- [ ] Categories are loadable and editable
- [ ] Participants are loadable and editable
- [ ] All components render with dynamic data
- [ ] Create new expense with dynamic categories
- [ ] Create new participant works
- [ ] Settlement calculation works with new structure
- [ ] Multi-product switching works
- [ ] Product creation from template works
- [ ] Data export/import works

## Notes for Implementation

1. **Keep it Modular**: ProductConfigService should be independent
2. **Lazy Loading**: Load configuration on product change
3. **Caching**: Cache product config to avoid repeated API calls
4. **Validation**: Add validation for category/participant names
5. **Error Handling**: Graceful fallbacks for missing data
6. **Performance**: Index product_id and category_id columns
7. **Transactions**: Use database transactions for seed data
8. **Documentation**: Add API documentation for new endpoints

## Future Enhancements

1. Multi-tenancy with different databases per organization
2. Role-based access control (RBAC) UI
3. Product sharing between users
4. Import/export of products and configurations
5. Backup and restore functionality
6. Analytics and insights across products
7. Mobile app for configuration management
8. Product templates marketplace
9. Custom permissions UI
10. Audit logging for configuration changes
