# App Distribution Plan for Consultorio

## 1. Current State

### Hardcoded Tenant References

The codebase has **`consultorio`** hardcoded in multiple files:

| File | What is hardcoded | Line(s) |
|------|-------------------|---------|
| `src/lib/api.ts` | `const TENANT_ID = 'consultorio'` | 2 |
| `src/lib/api-client.ts` | `const TENANT_ID = 'consultorio'` | 2 |
| `src/lib/auth.ts` | `const TENANT_ID = 'consultorio'` | 2 |
| `src/lib/api-client.ts` | `localStorage` keys: `consultorio_token`, `consultorio_user` | 5, 19-20 |
| `src/lib/auth.ts` | `localStorage` keys: `consultorio_token`, `consultorio_user` | 24, 26, 35-36, 41, 46, 52 |
| `src/lib/cart.ts` | `const CART_KEY = 'consultorio_cart'` | 8 |
| `src/layouts/AdminLayout.astro` | `localStorage.removeItem('consultorio_token')` etc. | 137-138 |
| `src/layouts/Layout.astro` | Default text: "Consultorio" in nav, footer, title | throughout |
| `src/layouts/AdminLayout.astro` | Default text: "Consultorio" in sidebar | 37, 91 |

### Hardcoded API Base URL

Both `api.ts`, `api-client.ts`, and `auth.ts` hardcode:
```ts
const BASE_URL = 'https://app.fyso.dev';
```
This is the Fyso platform URL and is correct for all tenants -- it does **not** need to change per instance.

### What is Already Configurable

- **`site_config` entity**: The public layout (`Layout.astro`) fetches `site_config` at build time and applies it via `data-sc` attributes. Clinic name, slogan, address, phone, email, hours, and WhatsApp number are all overridable per-tenant through this entity.
- **`FYSO_API_TOKEN`**: Already an env var (`.env`). Each instance just needs its own token.

### Build Configuration

- Astro is configured as `output: 'static'` -- the site is fully pre-rendered at build time.
- `site_config` is fetched during SSG (server-side generation), so the built output already contains the correct tenant data.

---

## 2. Runtime Tenant Resolution Strategy

Since the site is statically built, "runtime" resolution happens at **build time** (SSG) and **client-side** (admin panel, auth). Three strategies were evaluated:

### Option A: Environment Variable (Recommended)

Each deployment sets `TENANT_ID` as an env var. The build reads it, and client-side code receives it via Astro's `import.meta.env.PUBLIC_TENANT_ID`.

| Pros | Cons |
|------|------|
| Simplest to implement | One build per tenant |
| Works with any hosting (Vercel, Netlify, Docker) | Cannot share a single deployment |
| No DNS/routing changes needed | - |
| Clear separation between instances | - |

**Env vars needed:**
```
PUBLIC_TENANT_ID=mi-clinica        # Used by client-side code (auth, api-client, cart)
TENANT_ID=mi-clinica               # Used by server-side SSG (api.ts)
FYSO_API_TOKEN=fyso_pkey_...       # Per-instance API token
```

### Option B: Subdomain Resolution

Tenant ID derived from subdomain: `mi-clinica.consultorio-app.com` -> `mi-clinica`.

| Pros | Cons |
|------|------|
| Single deployment serves all tenants | Requires SSR (not compatible with current static output) |
| Professional per-tenant URLs | DNS wildcard + TLS wildcard needed |
| - | Much higher complexity |

**Verdict**: Not viable without migrating from `output: 'static'` to `output: 'server'`. Overkill for the current stage.

### Option C: Path-Based Resolution

Tenant ID from URL path: `consultorio-app.com/mi-clinica/...`.

| Pros | Cons |
|------|------|
| Single domain | Breaks all existing routes |
| No DNS changes | SEO complications |
| - | Requires SSR or complex rewrite rules |

**Verdict**: Poor UX and high migration cost. Not recommended.

### Decision: Option A (Environment Variable)

Each instance tenant gets its own deployment with its own env vars. This aligns perfectly with the existing static build model and Fyso's app distribution architecture where each instance is an independent tenant.

---

## 3. Per-Instance Environment Variables

```bash
# .env.example (updated)

# Fyso tenant identifier for this instance
PUBLIC_TENANT_ID=consultorio
TENANT_ID=consultorio

# Fyso developer token (generate via Fyso dashboard)
FYSO_API_TOKEN=your-developer-token-here
```

- `TENANT_ID` -- used at build time by `src/lib/api.ts` (SSG fetch). Not exposed to the browser.
- `PUBLIC_TENANT_ID` -- used by client-side code (`api-client.ts`, `auth.ts`, `cart.ts`). Astro exposes `PUBLIC_`-prefixed vars to the client.
- `FYSO_API_TOKEN` -- server-side only, used during SSG to fetch data.

---

## 4. How `site_config` Works Per Instance

Each Fyso instance tenant has its own `site_config` entity records with their own data. The flow:

1. **Build time**: `Layout.astro` calls `fetchSiteConfig()` which hits the Fyso API with the instance's `TENANT_ID` and `FYSO_API_TOKEN`.
2. **Response**: The API returns that tenant's `site_config` records (clinic name, phone, address, etc.).
3. **Render**: The static HTML is generated with default placeholders, then the inline `<script>` applies `site_config` values via `data-sc` attributes.
4. **Result**: Each instance's build output is fully customized to that clinic.

No code changes are needed for `site_config` itself -- the multi-tenant aspect is handled entirely by the tenant ID and API token.

---

## 5. Seed Data for Source Tenant

The source tenant (`consultorio`) should include the following seed data so that new instances start with a working configuration:

### Schema (already exists, inherited automatically)
- `appointments` entity
- `services` entity
- `site_config` entity
- `patients` (pacientes) entity
- `professionals` (profesionales) entity
- `obras_sociales` entity

### Seed Records (should be created in the source tenant)
- **`site_config`**: One record with all keys set to sensible defaults:
  - `clinic_name`: "Mi Consultorio"
  - `clinic_slogan`: "Tu consultorio de confianza"
  - `address`: "(configurar direccion)"
  - `phone`: "(configurar telefono)"
  - `email`: "(configurar email)"
  - `hours_weekday`: "8:00 - 20:00"
  - `hours_saturday`: "9:00 - 14:00"
  - `whatsapp`: ""
- **`services`**: 2-3 example services (e.g., "Consulta General", "Control") so the appointment flow works out of the box.

Instance tenants inherit the schema but start with empty data. The seed data in the source gives new instances a starting point to customize.

---

## 6. Follow-Up Code-Change Issues

### Issue: Extract `TENANT_ID` to environment variable
**Priority**: High
**Files**: `src/lib/api.ts`, `src/lib/api-client.ts`, `src/lib/auth.ts`
**Change**: Replace `const TENANT_ID = 'consultorio'` with:
- `api.ts`: `const TENANT_ID = import.meta.env.TENANT_ID || 'consultorio'`
- `api-client.ts` / `auth.ts`: `const TENANT_ID = import.meta.env.PUBLIC_TENANT_ID || 'consultorio'`

### Issue: Namespace localStorage keys with tenant ID
**Priority**: High
**Files**: `src/lib/auth.ts`, `src/lib/api-client.ts`, `src/lib/cart.ts`, `src/layouts/AdminLayout.astro`
**Change**: Replace hardcoded `consultorio_token` / `consultorio_user` / `consultorio_cart` with template using tenant ID:
```ts
const prefix = import.meta.env.PUBLIC_TENANT_ID || 'consultorio';
const TOKEN_KEY = `${prefix}_token`;
const USER_KEY = `${prefix}_user`;
```

### Issue: Update `.env.example` with tenant vars
**Priority**: Medium
**Files**: `.env.example`
**Change**: Add `PUBLIC_TENANT_ID` and `TENANT_ID` entries with documentation.

### Issue: Replace hardcoded "Consultorio" fallback text in layouts
**Priority**: Low
**Files**: `src/layouts/Layout.astro`, `src/layouts/AdminLayout.astro`
**Change**: The `<title>` tag and sidebar logo text use "Consultorio" as default. These are already overridden by `site_config` at runtime, so this is cosmetic -- but replacing them with a generic default (or reading from env) would be cleaner.

### Issue: Prepare source tenant seed data
**Priority**: Medium
**Change**: Create/verify `site_config` defaults and example services in the source tenant so new instances boot with usable data.

### Issue: Document instance deployment process
**Priority**: Low
**Change**: Add a `docs/deploy-instance.md` guide covering how to deploy a new instance (create Fyso instance, set env vars, build, deploy).

---

## 7. Recommended Approach

### Phase 1: Make the site tenant-agnostic (code changes)
1. Extract `TENANT_ID` to env vars in all three files (`api.ts`, `api-client.ts`, `auth.ts`).
2. Namespace `localStorage` keys with the tenant ID.
3. Update `.env.example`.
4. Verify the site still works with `TENANT_ID=consultorio` (backward compatible).

### Phase 2: Prepare the source tenant (data changes)
1. Ensure `site_config` has complete seed defaults.
2. Add example services.
3. Mark the source tenant as `standalone` -> ready for distribution.

### Phase 3: Test distribution
1. Create a test instance tenant via Fyso.
2. Deploy the site with the instance's env vars.
3. Verify: login, appointments, site config, admin panel all work against the instance tenant.

### Estimated Effort
- Phase 1: ~2 hours (straightforward string replacements + testing)
- Phase 2: ~1 hour (data entry via Fyso dashboard or API)
- Phase 3: ~1 hour (deployment + smoke testing)

Total: ~4 hours of work across 3-4 small issues.
