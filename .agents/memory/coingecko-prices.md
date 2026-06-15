---
name: CoinGecko prix live
description: Intégration CoinGecko gratuite dans le backend prices.controller.ts avec cache et fallback
---

## Règle
CoinGecko API v3 gratuite (pas de clé requise) — utiliser le cache 30s en mémoire pour éviter le rate limiting (free tier = ~30 req/min).

**Why:** Sans cache, chaque appel `/api/v1/prices` ferait une requête CoinGecko. Avec un cache de 30s, peu importe le nombre d'utilisateurs, on ne fait au plus 2 req/min vers CoinGecko.

**How to apply:**
- `priceCache = { data: any[] | null; timestamp: number }` en module-level variable
- Si `Date.now() - priceCache.timestamp < 30_000`, retourner le cache
- En cas d'erreur CoinGecko, retourner le cache périmé s'il existe, sinon MOCK_PRICES
- Le champ `source` dans la réponse indique `"live"` ou `"mock"` — le frontend l'utilise pour afficher un badge

## Mapping CoinGecko IDs
- bitcoin → BTC
- ethereum → ETH
- tether → USDT_TRC20, USDT_ERC20, USDT_BEP20
- binancecoin → BNB
- solana → SOL
- litecoin → LTC
- ripple → XRP
- matic-network → MATIC
- dogecoin → DOGE
