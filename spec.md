# Salad Khatora

## Current State
- Full-stack admin panel with authentication (email/password), dashboard, inventory management, menu management, sales recording, and reports.
- Backend: Motoko canister with user profile (name), ingredients, menu items, sales, notifications, and reports APIs.
- Frontend: React + TypeScript with TanStack Router. Pages: Login, Dashboard, Inventory, Menu, Sales, Reports.
- Auth: simple localStorage-based with hardcoded credentials (admin@saladkhatora.com / admin123).
- User profile: `saveCallerUserProfile` and `getCallerUserProfile` exist in backend, store `{ name: Text }`.

## Requested Changes (Diff)

### Add
- **Settings page (`/settings`)** with three sections:
  1. **Profile** — display name field, saved to/from `saveCallerUserProfile` / `getCallerUserProfile`
  2. **Security** — change password form (current password, new password, confirm new password). Since auth is localStorage-based, store a custom password in localStorage, validate current password against stored or default.
  3. **App Preferences** — business name display (read-only, shows "Salad Khatora"), currency symbol selector (PKR, USD, SAR), low-stock alert toggle. Store preferences in localStorage.
- **Settings nav item** in Sidebar (Settings icon, `/settings`)
- Route registered in App.tsx

### Modify
- **Sidebar** — add Settings nav link with gear/settings icon
- **App.tsx** — register `/settings` route

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/pages/SettingsPage.tsx` with three tab sections: Profile, Security, Preferences
2. Profile tab: load `getCallerUserProfile` on mount, allow editing display name, save via `saveCallerUserProfile`
3. Security tab: current password validated against localStorage (default `admin123`), new password stored in localStorage key `sk_password`
4. Preferences tab: currency selector + low-stock alert toggle, persisted in localStorage key `sk_prefs`
5. Update `Sidebar.tsx` to add Settings nav item (Settings icon from lucide-react)
6. Update `App.tsx` to add the settings route
