# Yatre (ಯಾತ್ರೆ) - Karnataka Travel Web Client

React 18 + Vite + TypeScript + Tailwind. Feature-sliced, mobile-first, service-worker-ready for a later offline PWA.

```bash
npm install
cp .env.example .env     # VITE_API_PROXY must point at the backend api-gateway (default http://localhost:8080)
npm run dev              # http://localhost:5173
npm run build            # type-checks, then builds to dist/
```

The dev server proxies `/api` to the gateway, so the HttpOnly refresh cookie stays same-origin. In production serve `dist/` behind a reverse proxy that forwards `/api` to the gateway with buffering off (see `nginx.conf`, needed for Server-Sent Events).

## Structure

```
src/
  features/
    auth/                  login + register, session restore, token refresh
    itinerary-planner/     trip form, live generation progress, day accordion, reorder, budget, Leaflet map
    culture-assistant/     Kannada voice assistant (FAB + sheet), cultural guide (RAG)
    travel-alerts/         live advisory ribbon with one-click reroute acceptance
    user-profile/          preferences (diet, pace, budget, channels, accessibility)
  components/ui.tsx        shared atoms        layouts/   shell + navigation
  services/http.ts         axios + single-flight refresh      services/sse.ts   persistent SSE listener
  store/                   zustand: auth (memory-only access token), live (progress, advisories, proposals)
public/                    manifest.json, icon.svg, sw.js (app-shell cache only; API is never cached)
```

Features do not import each other's components; pages in `routes/` compose them.

## Behaviour notes

- Access token lives in memory only; the refresh token is an HttpOnly cookie handled by the backend. A 401 triggers one shared refresh, then a retry.
- After `POST /itineraries/generate` (202) the page follows the trip over SSE (`progress`, `ready`, `legs`, `disrupted`, `reroute-proposed`, `rerouted`) and also polls every 4 s while generating, so a dropped stream cannot strand the user.
- Maps use OpenStreetMap tiles via Leaflet (no token needed). Respect the OSM tile usage policy or swap in your own tile provider for production.
- Voice: records with `MediaRecorder`, sends audio to `/language/translate-voice`; falls back to typed input and to the browser's speech synthesis when the server returns no audio.
- Set `VITE_ENABLE_DEMO=true` (and `ENABLE_DEMO_ENDPOINTS=true` on the backend) to show a "Simulate rain alert" button on trip pages.
- Not yet built: offline map/itinerary caching, Kannada UI translation (the preference is stored), automated tests.
