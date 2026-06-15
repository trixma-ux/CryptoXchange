# CryptoXchange - Plateforme d'Échange de Cryptomonnaies

Plateforme web complète d'achat, vente et échange de cryptomonnaies, moderne, sécurisée et responsive (Mobile + Desktop). Spécialement conçue pour l'Afrique avec intégration de **Mobile Money** (Orange Money, MTN, Wave, etc.) et paiements en **FCFA**.

## 🚀 Fonctionnalités Principales

- **Dashboard Complet :** Suivi en temps réel des portefeuilles et du marché crypto.
- **Dépôts / Retraits :** Via Mobile Money (FCFA) ou par adresse crypto directe.
- **Achat / Vente (Trading) :** Interface simplifiée pour convertir FCFA ↔ Crypto (BTC, ETH, USDT, BNB, SOL).
- **Échange (Swap) :** Conversion instantanée Crypto ↔ Crypto.
- **Sécurité et KYC :** Vérification d'identité (Upload de document + Selfie), Authentification 2FA, logs d'audit.
- **Interface Premium :** Design sombre (Dark mode) ultra-moderne inspiré des plus grands exchanges (Binance, Bybit) avec Glassmorphism et Tailwind CSS.
- **Panel d'Administration :** Suivi des utilisateurs, validation KYC, gestion des transactions et des frais.

## 🛠 Stack Technique

**Backend :**
- Node.js + Express (TypeScript)
- Base de données : PostgreSQL via Prisma ORM
- Authentification : JWT + TOTP (2FA)
- Intégration API : CoinGecko (pour les prix réels)

**Frontend :**
- Next.js 14 (App Router) + React 18
- Tailwind CSS + Framer Motion (Animations)
- Zustand (State management)
- Axios & React Hook Form

**Infrastructure :**
- Docker & Docker Compose (Base de données, Backend)

## ⚙️ Installation et Lancement Rapide (Docker)

La méthode la plus simple pour lancer le projet est d'utiliser Docker.

1. **Prérequis :** Assurez-vous d'avoir [Docker](https://www.docker.com/) et `docker-compose` installés sur votre machine.

2. **Démarrer les services :**
À la racine du projet, exécutez la commande suivante :
```bash
docker-compose up --build -d
```
Cela va démarrer la base de données PostgreSQL et le Backend. (Le Frontend peut aussi être lancé manuellement).

3. **Lancer le Frontend en mode Dev :**
Si vous souhaitez lancer le frontend en mode développement :
```bash
cd frontend
npm install
npm run dev
```
L'application web sera accessible sur [http://localhost:3000](http://localhost:3000).

## 🗄 Commandes Backend utiles

Si vous travaillez directement sur le backend en local (sans Docker) :
```bash
cd backend
npm install
npx prisma generate
npx prisma db push  # Synchronise la base de données
npm run dev         # Lance le backend sur http://localhost:4000
```

## 🔒 Sécurité et Variables d'Environnement

Le projet utilise des fichiers `.env` pour stocker les clés secrètes. Des fichiers exemples ont été configurés dans :
- `backend/.env`
- `frontend/.env.local`

En production, assurez-vous de changer `JWT_SECRET`, les identifiants de base de données, et les API keys.

---
*Conçu avec expertise pour répondre aux plus hauts standards de la Fintech.*
