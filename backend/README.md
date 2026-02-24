Backend API for wallet-voice-app (PostgreSQL + Express)

Overview
- Minimal, scalable backend for onboarding, with a PostgreSQL DB.
- Endpoints: auth (register/login), wallets CRUD, transactions per wallet, health check.

Run locally
- Ensure DATABASE_URL in .env or env var is set.
- npm install
- npm run start

Environment
- DATABASE_URL: PostgreSQL connection URL
- JWT_SECRET: Secret used for signing JWTs
