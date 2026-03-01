# Salad Khatora

## Current State
Phase 1 is live. The app has:
- Authentication (login/logout) with admin@saladkhatora.com
- Dashboard showing static sales stats, top sellers, recent transactions, and low stock alerts
- Inventory management (CRUD for ingredients with cost, supplier, unit, low stock threshold)
- Notification system (low stock alerts, mark read)
- Sidebar with Dashboard and Inventory nav items
- Logo: currently a generated PNG (`/assets/generated/salad-khatora-logo-transparent.dim_120x120.png`)

## Requested Changes (Diff)

### Add
- **Sales module** (`/sales` route and `SalesPage.tsx`):
  - Record a new sale: select menu item (salad bowl), set quantity and unit price, which auto-deducts ingredients from inventory
  - View sales history table with date, item name, quantity, unit price, total, and profit
  - Sales analytics: daily/weekly/monthly totals, best-selling item
  - Sales report summary card at top of sales page
- **Menu items** (`/menu` route optional or managed inline): a predefined list of salad bowls (Greek Salad, Caesar Bowl, Quinoa Power, Super Greens, Fruit Mix) each with an associated ingredient usage map (which ingredients and how much per unit)
- **Backend**: Sales recording with real inventory deduction. Sales storage, getSales, addSale, getSalesSummary endpoints. DashboardStats should pull from real sales data when available.
- **Logo update**: Replace generated logo image with uploaded `/assets/uploads/Salad-Khatora-1.jpeg` in the Sidebar and Login page

### Modify
- `Sidebar.tsx`: Add "Sales" nav link. Update logo `src` to `/assets/uploads/Salad-Khatora-1.jpeg`
- `LoginPage.tsx`: Update logo `src` to `/assets/uploads/Salad-Khatora-1.jpeg`
- `DashboardPage.tsx`: Recent transactions should pull from real sales data via updated backend stats
- `App.tsx`: Add `/sales` route

### Remove
- Nothing removed

## Implementation Plan
1. Write updated `main.mo` with Sales types, MenuItem types, addSale (deducts ingredients), getSales, getSalesSummary, seedMenuItems backend functions
2. Run generate_motoko_code to produce new backend and `backend.d.ts`
3. Update Sidebar logo src to uploaded image
4. Update Login page logo src to uploaded image
5. Create `SalesPage.tsx` with:
   - New Sale form: menu item dropdown, quantity, auto-calculated price and profit
   - Sales history table (sortable by date)
   - Sales summary cards (daily/weekly/monthly revenue, profit)
6. Add `/sales` route in `App.tsx` and nav item in `Sidebar.tsx`
