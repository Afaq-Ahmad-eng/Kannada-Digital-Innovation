# Yatre Admin - separate admin web app

Independent React + Vite + TypeScript + Tailwind project (own port 5174, own bundle, own refresh cookie). It talks to the same backend API gateway as the traveller site but only accepts **ADMIN** accounts.

```bash
npm install
cp .env.example .env
npm run dev          # http://localhost:5174
```

Sign in with the seeded admin from the backend `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`, default `admin@example.com` / `ChangeMe12345` - change it).

Screens: Overview (live stats and charts), Travellers (search, suspend / reactivate, notify), Trips (status filter and detail), Disruptions, Operations (service health, run disruption scan, observability links), Audit log.

Requires the backend `admin-service` (see the integration guide in the admin add-on). In production, host this app on a separate, access-restricted origin (VPN / IP allow-list); `nginx.conf` and `Dockerfile` are included.
