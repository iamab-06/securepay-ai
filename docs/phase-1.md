# Phase 1: Authentication & Wallet Foundation

This document outlines the architectural decisions and implementation details for Phase 1 of the SecurePay AI platform.

## Objective
Establish a secure, scalable backend infrastructure using Node.js, Express, PostgreSQL, and Prisma. Implement JWT-based authentication and a foundational Wallet system linked to User accounts.

## Tech Stack
- **Backend Framework:** Express.js (Node.js)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (JSON Web Tokens) with `bcrypt` for password hashing
- **Frontend Integration:** Axios interceptors, React `AuthContext`

## Database Architecture
The Prisma schema employs PostgreSQL and is designed for future fintech extensibility (transactions, risk, fraud alerts).

- **User Model:** Contains `id`, `name`, `email`, `password_hash`, `role` (enum), and `refresh_token` (hash).
- **Wallet Model:** Linked 1-to-1 with `User`. Auto-generates a globally unique `wallet_number` (format: `SP-XXXXXXXX`).
- **LoginHistory Model:** Tracks every authentication event (`ip_address`, `device`, `timestamp`) for future security auditing and AI anomaly detection.

## Authentication Strategy
We implement a high-security token rotation strategy:
- **Access Token:** Short-lived (15 minutes). Returned in the JSON response and stored in memory by the React app.
- **Refresh Token:** Long-lived (7 days). Set as an `httpOnly`, `secure` cookie by the backend. The raw token is NEVER stored in the database; instead, we store a `bcrypt` hash of the token to allow for targeted revocation while preventing theft if the DB is compromised.

## API Structure
All responses strictly follow a standardized wrapper to ensure uniform frontend handling:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description"
}
```

## Security Considerations
1. **No local storage for tokens:** Prevents Cross-Site Scripting (XSS) attacks from stealing long-lived credentials.
2. **Password Hashing:** Uses `bcrypt` with a 10-round salt.
3. **Database Constraints:** Uses Prisma's `@unique` and cascading deletes to maintain strict referential integrity.
4. **Middleware:** `authMiddleware.js` verifies the access token signature, while `errorMiddleware.js` standardizes error output without leaking stack traces in production.

*See `docs/auth-flow.md` for sequence-level details of authentication and wallet generation workflows.*
