# Salad Khatora

## Current State
The app has a full-stack backend with Motoko and a React frontend. All backend functions (addIngredient, addMenuItem, recordSale, etc.) are guarded by an ICP-based access control system that requires a registered principal. The frontend uses email/password login (not Internet Identity), so all backend calls come from anonymous or unregistered principals. This causes every write operation to fail with "Unauthorized" or "User is not registered" errors.

## Requested Changes (Diff)

### Add
- Nothing new to add

### Modify
- Backend: Remove all access control checks from every function. All operations (CRUD for ingredients, menu items, sales, notifications, dashboard, reports, profile) should be open/unrestricted since the app uses frontend-only email/password authentication.

### Remove
- Backend: Remove the `MixinAuthorization` include and `AccessControl` permission checks from all functions
- Backend: Remove the authorization component dependency

## Implementation Plan
1. Regenerate the Motoko backend without the authorization component — all functions should work without any caller-based permission checks
2. The frontend does not need changes since the backend.d.ts interface remains the same (same function signatures, just no auth enforcement)
