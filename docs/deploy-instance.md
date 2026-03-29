# Instance Deployment Guide

How to deploy a new instance of this clinic site for a different tenant.

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- A **Fyso account** with access to the source app

## 1. Create a Fyso instance tenant

Create a new instance tenant from the source app. This can be done via:

- **Fyso Dashboard**: Go to the source app, click "Create Instance", and follow the wizard.
- **Fyso MCP**: Use the `fyso_deploy` tool to create an instance programmatically.

The new tenant inherits the schema (entities, fields, rules) from the source but starts with its own data. Seed data (default `site_config` values and example services) is copied automatically.

Take note of the **tenant ID** assigned to the new instance (e.g., `my-clinic-abc12`).

## 2. Generate a developer token

Each instance needs its own API token for build-time data fetching.

1. Open the Fyso Dashboard.
2. Navigate to the instance tenant.
3. Go to **Settings > Developer Tokens**.
4. Generate a new token with read access.
5. Copy the token (starts with `fyso_pkey_...`).

## 3. Clone the repository

```bash
git clone https://github.com/fyso-dev/fyso-care.git
cd fyso-care
```

## 4. Set environment variables

Create a `.env` file in the project root (see `.env.example` for reference):

```bash
# Fyso tenant identifier
PUBLIC_TENANT_ID=my-clinic-abc12
TENANT_ID=my-clinic-abc12

# Fyso developer token (from step 2)
FYSO_API_TOKEN=fyso_pkey_your_token_here
```

| Variable | Scope | Purpose |
|----------|-------|---------|
| `PUBLIC_TENANT_ID` | Client-side | Used by auth, API client, and cart in the browser |
| `TENANT_ID` | Server/build-time | Used during static site generation to fetch data |
| `FYSO_API_TOKEN` | Server/build-time | Authenticates API requests during build |

## 5. Install dependencies and build

```bash
npm install
npm run build
```

The build fetches `site_config` and other data from the Fyso API using the configured tenant and token, then generates a fully static site in the `dist/` directory.

To preview locally before deploying:

```bash
npm run preview
```

## 6. Deploy

The build output is a static site (`dist/` folder). Choose any hosting platform.

### Vercel

1. Import the repository in the [Vercel dashboard](https://vercel.com/new).
2. Set the three environment variables (`PUBLIC_TENANT_ID`, `TENANT_ID`, `FYSO_API_TOKEN`) in **Settings > Environment Variables**.
3. Set the build command to `npm run build` and the output directory to `dist`.
4. Deploy. Subsequent pushes to the connected branch trigger automatic rebuilds.

### Netlify

1. Import the repository in [Netlify](https://app.netlify.com/start).
2. Set the build command to `npm run build` and the publish directory to `dist`.
3. Add the three environment variables in **Site settings > Environment variables**.
4. Deploy.

### Static hosting (any provider)

Run `npm run build` locally or in CI, then upload the contents of `dist/` to any static file host (S3, Cloudflare Pages, GitHub Pages, etc.).

### Docker

No Dockerfile is included, but a minimal one for serving the static build:

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG TENANT_ID
ARG PUBLIC_TENANT_ID
ARG FYSO_API_TOKEN
ENV TENANT_ID=$TENANT_ID
ENV PUBLIC_TENANT_ID=$PUBLIC_TENANT_ID
ENV FYSO_API_TOKEN=$FYSO_API_TOKEN
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

Build and run:

```bash
docker build \
  --build-arg TENANT_ID=my-clinic-abc12 \
  --build-arg PUBLIC_TENANT_ID=my-clinic-abc12 \
  --build-arg FYSO_API_TOKEN=fyso_pkey_your_token_here \
  -t clinic-site .

docker run -p 8080:80 clinic-site
```

## 7. Verify the deployment

After deploying, confirm the following work correctly:

- [ ] **Site loads** with the correct clinic name and branding from `site_config`
- [ ] **Login** works (admin panel authentication against the instance tenant)
- [ ] **Appointments** can be created and listed
- [ ] **Admin panel** is accessible and shows the correct tenant data
- [ ] **Services** list is populated (from seed data or manually added)

## 8. Customize the instance

Update the `site_config` entity in the Fyso Dashboard (or via API) to reflect the clinic details:

| Field | Description |
|-------|-------------|
| `clinic_name` | Display name of the clinic |
| `clinic_slogan` | Tagline shown on the site |
| `address` | Physical address |
| `phone` | Contact phone number |
| `email` | Contact email |
| `hours_weekday` | Weekday operating hours |
| `hours_saturday` | Saturday operating hours |
| `whatsapp` | WhatsApp number for contact button |

After updating `site_config`, **rebuild and redeploy** the site so the static pages reflect the new values. On Vercel/Netlify this means triggering a new build (push a commit or use the dashboard redeploy button).

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Build fails with 401 | Invalid or expired `FYSO_API_TOKEN` | Generate a new token in the Fyso Dashboard |
| Site shows default placeholder text | `site_config` not populated | Add records to `site_config` in the tenant, then rebuild |
| Login fails | Wrong `PUBLIC_TENANT_ID` | Verify the env var matches the actual tenant ID |
| Stale data after config change | Static site not rebuilt | Trigger a new build and deploy |
