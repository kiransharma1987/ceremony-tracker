# Product Configuration Plan

## Overview
Convert the Ceremony Expense Tracker into a configurable multi-product platform.

## Key Concepts

### 1. Product
A product instance (e.g., "Padmamma's Ceremony", "Wedding Expenses", "Family Event", etc.)
- Each product has its own data, users, roles, and categories
- Products can be independently configured

### 2. Configurable Elements

#### Product Settings
- Product name (e.g., "Ceremony Expense Tracker" → "Event Expense Manager")
- Event name (e.g., "Padmamma's First Year Ceremony" → user-defined)
- Number of primary users/participants (currently 4 brothers)
- Currency (₹ by default, configurable)
- Financial year/period
- Status (active, closed, archived)

#### Categories
- Completely user-configurable
- Examples: Food & Catering, Priest Renumeration, Return Gifts, Decorations, etc.
- Can add unlimited categories
- Each category can have budget

#### Roles
- Currently: ADMIN, BROTHER, CONTRIBUTOR
- Make this configurable for different use cases:
  - For wedding: ADMIN, GROOM, BRIDE, FAMILY, CONTRIBUTOR
  - For business: ADMIN, MANAGER, TEAM_MEMBER, VENDOR
  - For shared expense: ADMIN, PARTICIPANT, OBSERVER

#### Participants/Users
- Currently: 4 hardcoded brothers (HNK, HNP, HNS, HNM)
- Make configurable:
  - Add/remove participants
  - Assign roles to participants
  - Custom participant names

### 3. Data Model Changes

#### New Tables
```
Product
  - id (UUID)
  - name (String)
  - description (Text)
  - eventName (String)
  - currency (String) default: "₹"
  - numParticipants (Int) default: 4
  - createdBy (UserId)
  - createdAt (DateTime)
  - updatedAt (DateTime)
  - archivedAt (DateTime?) nullable

ProductRole
  - id (UUID)
  - productId (UUID) FK -> Product
  - name (String)
  - permissions (JSON) // array of permission strings
  - createdAt (DateTime)
  - updatedAt (DateTime)

ProductCategory
  - id (UUID)
  - productId (UUID) FK -> Product
  - name (String)
  - description (Text?)
  - createdAt (DateTime)
  - updatedAt (DateTime)

ProductParticipant
  - id (UUID)
  - productId (UUID) FK -> Product
  - name (String)
  - email (String?)
  - roleId (UUID) FK -> ProductRole
  - createdAt (DateTime)
  - updatedAt (DateTime)

ProductUser
  - id (UUID)
  - productId (UUID) FK -> Product
  - userId (UUID) FK -> User
  - participantId (UUID) FK -> ProductParticipant
  - roleId (UUID) FK -> ProductRole
  - createdAt (DateTime)
  - updatedAt (DateTime)

ProductSettings
  - id (UUID)
  - productId (UUID) FK -> Product
  - isClosed (Boolean)
  - closedAt (DateTime?)
  - overallBudget (Decimal)
  - customSettings (JSON) // for future extensibility
  - createdAt (DateTime)
  - updatedAt (DateTime)
```

#### Modified Tables
```
Expense
  - Add: productId (UUID) FK -> Product
  - Add: categoryId (UUID) FK -> ProductCategory
  - Modify: paidBy references ProductParticipant instead of string

Contribution
  - Add: productId (UUID) FK -> Product
  
Budget
  - Add: productId (UUID) FK -> Product
  - Add: categoryId (UUID) FK -> ProductCategory

Deposit
  - Add: productId (UUID) FK -> Product
  - Modify: depositedBy references ProductParticipant
```

### 4. Backend API Structure

```
/api/products
  GET /               - List all products for user
  POST /              - Create new product
  GET /:productId     - Get product details
  PUT /:productId     - Update product
  DELETE /:productId  - Archive product

/api/products/:productId/config
  GET /               - Get all configuration
  PUT /               - Update configuration
  
/api/products/:productId/categories
  GET /               - List categories
  POST /              - Create category
  PUT /:categoryId    - Update category
  DELETE /:categoryId - Delete category

/api/products/:productId/roles
  GET /               - List roles
  POST /              - Create role
  PUT /:roleId        - Update role
  DELETE /:roleId     - Delete role

/api/products/:productId/participants
  GET /               - List participants
  POST /              - Create participant
  PUT /:participantId - Update participant
  DELETE /:participantId - Delete participant

/api/products/:productId/settings
  GET /               - Get product settings
  PUT /               - Update product settings
```

### 5. Frontend Structure

#### New Pages
- **Product Dashboard**: List of all products, create new
- **Product Configuration**: Main settings, name, event name, etc.
- **Category Management**: Add/edit/delete categories
- **Role Management**: Configure roles and permissions
- **Participant Management**: Add/remove participants, assign roles
- **Data Import/Export**: Import config templates, export data

#### Modified Pages
- Update all existing pages to use productId context
- Replace hardcoded values with configuration
- Add product selector/switcher

### 6. Implementation Strategy

#### Phase 1: Core Infrastructure
1. Extend Prisma schema
2. Create configuration service (backend)
3. Create configuration service (frontend)
4. Add product context to app

#### Phase 2: Configuration UI
1. Create product management pages
2. Create category management
3. Create role management
4. Create participant management

#### Phase 3: Data Migration
1. Update existing models to use configuration
2. Create data import/export utilities
3. Add seed data for multiple product types

#### Phase 4: Polish & Deploy
1. Multi-tenancy support (optional)
2. Template system for common use cases
3. Settings/preferences
4. Documentation

### 7. Example Use Cases After Configuration

#### 1. Wedding Expenses
- Event: "Sharma-Patel Wedding"
- Participants: Groom, Bride, Father-in-law, Mother-in-law
- Categories: Venue, Catering, Decorations, Photography, Music, Return Gifts
- Roles: ORGANIZER (full access), FAMILY (view only), VENDOR (add expenses)

#### 2. Team Dinner
- Event: "Q4 Team Celebration"
- Participants: Alice, Bob, Carol, David
- Categories: Venue, Food, Drinks, Activities, Favors
- Roles: COORDINATOR (full access), PARTICIPANT (add expenses), GUEST

#### 3. Shared Rent
- Event: "Apartment Rent - Jan 2026"
- Participants: Person A, Person B, Person C
- Categories: Rent, Utilities, Maintenance, Supplies
- Roles: OWNER (full access), ROOMMATE (view own), ADMIN (full access)

### 8. Benefits
✅ Single codebase for multiple use cases
✅ Easy to adapt for different event types
✅ Scalable and extensible
✅ Reusable for different organizations/events
✅ Easy onboarding for new products
✅ Data portability and export

### 9. Backward Compatibility
- Keep existing ceremony data intact
- Default product on first load
- Migrate existing data to "Padmamma's Ceremony" product
- No breaking changes for current users
