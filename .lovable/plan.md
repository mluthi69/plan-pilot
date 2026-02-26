

## Plan: Integrate Clerk for Multi-Tenant Auth + RBAC

### Overview
Replace the static user/tenant UI with Clerk for authentication, multi-tenancy (via Clerk Organizations), and role-based access control. Clerk's React SDK provides `ClerkProvider`, pre-built sign-in/sign-up components, organization switching, and role/permission checks — all client-side with no backend needed initially.

### Technical Details

**Clerk Concepts Mapping to NDIS Platform:**
- **Clerk Organization** = Tenant (e.g., "Acme Plan Managers")
- **Clerk Organization Roles** = NDIS roles (Tenant Admin, Finance Admin, Plan Manager, SC Lead, Support Coordinator, Approver, Read-Only Auditor)
- **Clerk User** = Platform user who can belong to multiple orgs
- Participant/Nominee portal users would be separate Clerk users with a dedicated role

**Package:** `@clerk/clerk-react` (Vite/React SDK)

### Implementation Steps

1. **Install `@clerk/clerk-react`** and store the publishable key in the codebase (it's a public key, safe to include)

2. **Wrap app in `ClerkProvider`** in `main.tsx` with the publishable key and configure routing for sign-in/sign-up paths

3. **Create auth pages:**
   - `/sign-in` — uses Clerk's `<SignIn />` component
   - `/sign-up` — uses Clerk's `<SignUp />` component

4. **Protect the app shell** — wrap `AppLayout` routes with Clerk's `<SignedIn>` / `<SignedOut>` guards so unauthenticated users redirect to sign-in

5. **Replace static tenant selector** in `AppSidebar.tsx` with Clerk's `<OrganizationSwitcher />` component (handles org creation, switching, invites)

6. **Replace static user profile** in sidebar footer with Clerk's `<UserButton />` (handles profile, sign-out, account management)

7. **Add role-based route guards** — create a `<RequireRole>` wrapper component that uses `useOrganization()` to check the user's current org role and conditionally renders content or redirects (e.g., Settings only for admins)

8. **Update the Settings → Roles tab** to read from Clerk's organization membership data via `useOrganization()` instead of the static `roles` array

9. **Configure Clerk Dashboard (manual step for user):**
   - Create custom organization roles matching NDIS roles
   - Set up custom permissions (e.g., `org:invoices:approve`, `org:participants:write`)
   - Enable Organizations feature

### Files to Create
- `src/pages/SignIn.tsx` — Clerk sign-in page
- `src/pages/SignUp.tsx` — Clerk sign-up page  
- `src/components/RequireRole.tsx` — role gate wrapper

### Files to Modify
- `package.json` — add `@clerk/clerk-react`
- `src/main.tsx` — wrap with `ClerkProvider`
- `src/App.tsx` — add sign-in/sign-up routes, protect app routes
- `src/components/AppSidebar.tsx` — replace tenant selector with `<OrganizationSwitcher />`, replace user section with `<UserButton />`
- `src/pages/Settings.tsx` — wire roles tab to Clerk org data

### Prerequisites
The user will need to:
1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Provide their **Clerk Publishable Key** (public, safe in code)
3. Enable the **Organizations** feature in the Clerk Dashboard
4. Create custom roles and permissions in the Clerk Dashboard

