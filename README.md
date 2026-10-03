# settla-frontend

Operations console for Settla / Rhea. Next.js (App Router) · TypeScript (strict) · Tailwind v4 · Redux Toolkit · TanStack Query · React Hook Form + Zod · Recharts · Framer Motion.

## Run
```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev                  # http://localhost:3000
```
Requires `settla-backend` running (see its README). Backend CORS must allow the frontend origin (`CORS_ORIGINS`).

## Scripts
`npm run typecheck` · `npm run lint` · `npm test` (unit) · `npm run build` · `npm run test:e2e` (Playwright; needs backend seeded + running, and `npx playwright install chromium`).

## Structure
`app/` routes · `components/ui` primitives · `components/layout` shell, command palette, shortcuts · `features/<domain>` · `services/` typed API client · `store/` · `types/api.ts` backend contract.

## Behaviour guarantees
- Access token in memory only; refresh via httpOnly cookie.
- UI never claims success the backend did not report; financial dialogs show amount, payment, customer, reason, policy, risk and approval requirement.
- Permission-aware navigation; 403/404/offline/empty/loading states on every list.
- Keyboard: `Ctrl/⌘ K` palette, `g d/c/a/e/p`, `?` help. Reduced-motion respected.

## Demo
Backend `npm run seed`, then sign in as `tenant_admin@urbanstep.test` (password in backend README; demo data only). **Run demo case** on the dashboard.

## Docker
`docker build -t settla-frontend --build-arg NEXT_PUBLIC_API_URL=https://api.example.com .`
