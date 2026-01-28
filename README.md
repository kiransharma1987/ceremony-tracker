# Ceremony Expense Tracker

A comprehensive Angular web application for managing ceremony-related expenses, contributions, and settlements for family events.

## Features

- **Expense Management**: Track all ceremony expenses by category and payer
- **Contribution Tracking**: Record voluntary contributions from family members
- **Fair Settlement**: Automatic calculation of equal expense sharing among brothers
- **Budget Monitoring**: Category-wise budget tracking with visual indicators
- **Multi-role Access**: Separate views for Admin, Brothers, and Contributors
- **Reports & Export**: PDF and CSV export functionality

## User Roles

### Admin (KHK)
- Full control over all features
- Add/Edit/Delete expenses and contributions
- Manage budgets
- Close/Reopen events
- Export reports

### Brothers (HNK, HNP, HNS, HNM)
- Read-only access
- View all expenses and categories
- See personal settlement status
- View overall financial summary

### Contributors
- Add contributions via secure portal
- View own contribution history

## Financial Calculation Logic

```
Total Expenses = Sum of all expenses paid by the 4 brothers
Total Contributions = Sum of all contributions from sister and relatives
Net Expense = Total Expenses - Total Contributions
Share Per Brother = Net Expense ÷ 4
Balance = Share Per Brother - Amount Paid by Brother
```

- Positive Balance → Amount to pay
- Negative Balance → Amount to receive
- Zero Balance → Settled

## Expense Categories

1. Food & Catering
2. Priest Renumeration
3. Pooje Items
4. Dhaanas
5. Venue
6. Return Gifts
7. Transport
8. Miscellaneous

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open http://localhost:4200 in your browser

### Login Credentials

**Admin Login:**
- Password: `admin123`

**Brother/Contributor Login:**
- Use demo access (no password required)

## Project Structure

```
src/
├── app/
│   ├── features/
│   │   ├── admin/          # Admin dashboard & management
│   │   ├── auth/           # Login component
│   │   ├── brother/        # Brother view
│   │   └── contributor/    # Contributor portal
│   ├── guards/             # Route guards
│   ├── models/             # TypeScript interfaces
│   ├── services/           # Business logic services
│   └── shared/             # Shared components
├── styles.scss             # Global styles
└── index.html
```

## Technology Stack

- **Framework**: Angular 17 (Standalone Components)
- **State Management**: Angular Signals
- **Charts**: Chart.js
- **PDF Generation**: jsPDF + jsPDF-AutoTable
- **Styling**: SCSS with CSS Variables
- **Storage**: localStorage (for demo purposes)

## Budget Status Indicators

- 🟢 **Green**: < 70% used - On track
- 🟡 **Amber**: 70-90% used - Caution
- 🔴 **Red**: > 90% used - Alert

## Notes

- Data is stored in localStorage for demo purposes
- In production, implement proper backend API and authentication
- The admin (KHK) is excluded from expense sharing calculations

## License

This project is for family use only.
