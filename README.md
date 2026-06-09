# SecurePay AI

SecurePay AI is a high-performance, financially robust wallet and money transfer platform engineered with a strict double-entry ledger architecture. Built as a demonstration of modern fintech design, it strictly isolates funds, guarantees idempotency on all network operations, and dynamically blocks suspicious activities via an integrated Risk Assessment engine.

## 🚀 Features

* **Double-Entry Ledger Engine:** Mathematically guarantees that total system funds sum to zero across user accounts, pool accounts, and suspense accounts. No funds are ever created or destroyed out of thin air.
* **Idempotency & Replay Protection:** Core financial APIs are hardened against double-spend and concurrent modification issues utilizing database-level transaction locking.
* **Integrated Risk Assessment (Fraud Engine):** AI-inspired heuristics score transactions in real-time, blocking transfers that violate velocity, geographic, or abnormal behavioral rules.
* **Modern React Dashboard:** An exceptionally polished frontend utilizing Framer Motion, TailwindCSS, and Lucide React to deliver an immersive, low-latency financial console.
* **Webhook Simulation Engine:** A complete end-to-end deposit simulation system that mimics external banking gateways (ACH/UPI/Wire) for realistic staging and development.
* **Strict Privacy Isolation:** React Context completely segments user data boundaries—no cross-account state leakage can physically occur in the UI.

## 🏛 Architecture

* **Frontend:** React 18 (Vite), Tailwind CSS, Framer Motion, Recharts
* **Backend:** Node.js (Express), JSON Web Tokens (Access + Refresh Rotation)
* **Database:** Neon PostgreSQL, Prisma ORM
* **Security:** bcrypt password hashing, HTTP-only cookie support, strict CORS policies, Row-Level isolation.

## 🛠 Local Development Setup

### 1. Database Setup

SecurePay AI requires a PostgreSQL instance. The easiest way to get started is with Neon Tech or a local Postgres Docker container.

```bash
cd backend
npm install
# Configure your .env file
npx prisma generate
npx prisma db push
```

### 2. Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
JWT_ACCESS_SECRET="your_secure_access_secret_here"
JWT_REFRESH_SECRET="your_secure_refresh_secret_here"
PORT=5000
FRONTEND_URL="http://localhost:5173"
```

### 3. Running the Backend

```bash
cd backend
npm run dev
```

*Note: The server will automatically bootstrap the required master Pool and Suspense accounts on startup.*

### 4. Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🔒 Security & Fraud Detection

SecurePay AI operates on a **zero-trust** internal philosophy.
* **Role-Based Access Control:** Standard users and Administrators are logically separated via JWT claims.
* **Fraud Engine:** Transactions are evaluated by an interceptor before reaching the ledger. High-score transactions trigger an automatic `BLOCKED` state, requiring administrator review.
* **Concurrent Safeties:** Utilizing Postgres `SELECT ... FOR UPDATE` isolation locks to ensure atomic balance transfers and eliminate race conditions under heavy load.

## 🗺 Future Roadmap

* **Phase 6:** Advanced analytics dashboard, user KYC module, and simulated payout gateways.
* **Phase 7:** Docker compose deployment and GitHub Actions CI/CD pipelines.

## 📄 License

SecurePay AI is released under the MIT License. Use it as a reference, learn from its architecture, or build upon its foundation.
