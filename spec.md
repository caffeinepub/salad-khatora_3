# Salad Khatora

## Current State
Phase 6 is complete with Dashboard, Inventory, Menu, Sales, Reports, and Settings pages all wired to a Motoko backend. The backend persists all data (ingredients, menu items, sales, notifications, user profiles). Authentication uses a localStorage-based flow. The logo is referenced from `/assets/uploads/Salad-Khatora-1.jpeg`. Some pages still use `PKR`/`en-PK` locale strings from earlier phases.

## Requested Changes (Diff)

### Add
- Nothing new to add

### Modify
1. **Logo fix**: Move logo reference to `/assets/generated/Salad-Khatora-1.jpeg` (copy file there) so it survives the build pipeline and is properly served. Update Sidebar and LoginPage to reference the new path.
2. **Currency - INR everywhere**: 
   - `SettingsPage.tsx`: Change `DEFAULT_PREFS.currency` from `"PKR"` to `"INR"`, add INR as first option in currency select, remove or reprioritize PKR
   - `ReportsPage.tsx`: Replace all `en-PK` locale with `en-IN`, replace `PKR` label strings in CSV headers and tooltip formatter with `₹` / `INR`
3. **Database connectivity**: Ensure actor initialization reliably connects frontend to backend. Add a seed button on Dashboard for first-time setup. Make sure the actor's admin token initialization happens before data fetches.

### Remove
- Nothing to remove

## Implementation Plan
1. Copy `Salad-Khatora-1.jpeg` from `uploads/` to `generated/` folder with a clean filename
2. Update `Sidebar.tsx` and `LoginPage.tsx` image src paths
3. Fix `SettingsPage.tsx` default currency and options (PKR → INR)
4. Fix `ReportsPage.tsx` all `en-PK` → `en-IN`, `PKR` label text → `₹`/`INR`
5. Verify `useActor.ts` properly awaits admin initialization before queries run
