# CryptoXchange

Plateforme web d'achat, vente et échange de cryptomonnaies avec support Mobile Money (FCFA) pour l'Afrique de l'Ouest.

## Run & Operate

- `pnpm --filter @workspace/cryptoxchange run dev` — frontend Vite (port 20409, preview path `/`)
- `pnpm --filter @workspace/api-server run dev` — API Express backend (port 8080)
- `pnpm run typecheck` — typecheck complet
- `pnpm run build` — typecheck + build all
- Required env: `DATABASE_URL` (obligatoire), `JWT_SECRET`, `JWT_REFRESH_SECRET` (optionnels, défaut dev only), `VITE_API_URL` (optionnel, défaut `/api/v1`)
- En dev: le frontend proxy `/api/v1/*` vers `localhost:8080` (Vite proxy)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, Wouter (routing), Zustand, TanStack Query, Framer Motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod, React Hook Form
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/cryptoxchange/src/` — frontend React app
- `artifacts/cryptoxchange/src/pages/` — toutes les pages (landing, auth, dashboard, admin)
- `artifacts/cryptoxchange/src/components/layout/` — Sidebar, DashboardLayout
- `artifacts/cryptoxchange/src/lib/api.ts` — tous les appels API (axios, interceptors JWT)
- `artifacts/cryptoxchange/src/lib/store.ts` — Zustand auth store (persist)
- `artifacts/cryptoxchange/src/index.css` — thème global (dark crypto, amber brand, composants CSS)
- `artifacts/api-server/src/modules/` — tous les modules backend (auth, wallets, transactions, trading, swap, payments, kyc, notifications, support, admin, prices)
- `artifacts/api-server/src/lib/` — config, helpers, jwt utils
- `artifacts/api-server/src/middlewares/` — authenticate, requireAdmin, errorHandler
- `lib/db/src/schema/index.ts` — schéma Drizzle complet (users, wallets, transactions, kyc, support, notifications, fees)

## Architecture decisions

- Routing côté client avec Wouter (pas React Router), base path depuis `import.meta.env.BASE_URL`
- JWT stocké dans localStorage + Zustand persist — refresh token automatique sur 401
- CSS entièrement custom via `@layer components` dans index.css — pas de shadcn/ui pour les pages métier
- Pages admin avec AdminLayout inline (évite import circulaire) — à refactoriser si beaucoup de pages admin
- API pointée vers `/api/v1` par défaut — configurable via `VITE_API_URL`
- Backend Express 5 avec Drizzle ORM (adapté depuis Prisma du backup)
- Schéma DB poussé via `pnpm --filter @workspace/db run push`
- JWT access (15min) + refresh (7j) stockés côté client

## Product

- Page d'accueil (landing) avec ticker de prix en temps réel
- Auth : inscription, connexion (avec 2FA), mot de passe oublié
- Dashboard utilisateur : vue d'ensemble du portefeuille
- Portefeuilles : liste multi-crypto avec adresses QR
- Achat / Vente : devis automatique, Mobile Money + virement bancaire
- Swap crypto-crypto : devis instantané, échange direct
- Dépôt : Mobile Money (Orange, MTN, Wave, Moov, Airtel), virement bancaire, crypto directe
- Retrait : Mobile Money, virement bancaire, crypto directe
- Historique des transactions avec filtres et pagination
- KYC : téléversement de documents, suivi du statut
- Profil & Sécurité : modifier profil, changer mot de passe, activer 2FA
- Support : tickets utilisateur avec messagerie
- Panel admin : dashboard stats, gestion utilisateurs, transactions, KYC, commissions, support

## User preferences

- Langue française pour toute l'interface
- Devise principale : FCFA (XOF)
- Mobile Money : Orange Money, MTN, Wave, Moov, Airtel

## Gotchas

- **En dev**: Vite proxy `/api/v1/*` → `localhost:8080` automatiquement (pas besoin de `VITE_API_URL`)
- **En prod**: configurer `VITE_API_URL` pour pointer vers le backend déployé
- Les pages admin ont AdminLayout dupliqué inline — à extraire dans un composant partagé si besoin
- `@workspace/api-client-react` est présent en dépendance mais non utilisé (lib codegen non configurée pour ce projet)
- `JWT_SECRET` et `JWT_REFRESH_SECRET` ont des fallback dev — CHANGER EN PRODUCTION
- `express-async-errors` supprimé (incompatible Express 5) — Express 5 gère les erreurs async nativement
- Les prix crypto sont simulés (MOCK_PRICES) — intégrer CoinGecko API en production

## Pointers

- Voir le skill `pnpm-workspace` pour la structure workspace et TypeScript
- `.migration-backup/` contient le code original Next.js + Express/Prisma de référence
