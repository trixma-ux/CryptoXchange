---
name: App mobile Expo auth flow
description: JWT stocké dans AsyncStorage, refresh automatique sur 401, AuthContext centralisé
---

## Règle
Le client API mobile (`lib/api.ts`) intercepte les 401 et tente un refresh automatique. Si le refresh échoue, il vide AsyncStorage et lance l'erreur `"SESSION_EXPIRED"` — le composant appelant doit rediriger vers login.

**Why:** Sans refresh automatique, l'utilisateur serait déconnecté toutes les 15 minutes (durée du JWT access token). Le refresh token dure 7j.

**How to apply:**
- `request()` avec `isRetry = false` → sur 401, appeler `refreshTokens()` → relancer avec `isRetry = true`
- Si le refresh échoue sur `isRetry = true`, purger AsyncStorage
- AuthContext utilise `AsyncStorage.getItem("user")` pour restaurer la session au démarrage
- Le token est stocké sous la clé `"accessToken"`, le refresh sous `"refreshToken"`, l'objet user sous `"user"`
