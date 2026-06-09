# Phase 1 - Authentication & Wallet Architecture Flow

This document details the fintech-grade authentication patterns established in Phase 1. This serves as the reference architecture for all future phases.

## 1. Registration & Auto-Wallet Creation Flow
When a user signs up, the backend handles their account and primary financial anchor (wallet) transactionally.

1.  **Input:** User provides `name`, `email`, and `password`.
2.  **Validation:** `authService` checks for email collisions.
3.  **Hashing:** `bcrypt` generates a salt and hashes the plaintext password.
4.  **Wallet Generation:** `walletGenerator` generates a unique, human-readable ID (`SP-XXXXXXXX`).
5.  **Database Transaction:** 
    *   Creates the `User` record.
    *   Creates the `Wallet` record linked to the `User`.
    *   *If either fails, the transaction rolls back.*
6.  **Token Generation:** Generates short-lived JWT `access_token` (15m) and long-lived `refresh_token` (7d).
7.  **Token Storage:** The `refresh_token` is hashed and stored in the database for revocation capabilities.
8.  **Delivery:** 
    *   `refresh_token` is sent via an `httpOnly`, `secure` cookie to prevent XSS.
    *   `access_token` and User/Wallet payload are returned in the JSON body.

## 2. Login Flow & Security Tracking
Every authentication event is tracked for future risk scoring.

1.  **Validation:** Verifies `email` and checks `password_hash` against the `bcrypt` hash.
2.  **Audit Logging:** Creates a record in the `LoginHistory` table containing `user_id`, `ip_address`, and `device` (User-Agent).
3.  **Token Generation & Delivery:** Re-issues new `access_token` and `refresh_token` identically to the Registration flow.

## 3. Token Refresh Flow
Maintains session persistence securely without exposing long-lived credentials to XSS vectors.

1.  **Trigger:** Frontend `axios` interceptor detects a `401 Unauthorized` response.
2.  **Request:** Axios automatically pauses queued requests and calls `POST /api/auth/refresh` using the `httpOnly` cookie.
3.  **Validation:** 
    *   Verifies the JWT signature of the `refresh_token`.
    *   Queries the `User` record.
    *   Compares the raw token against the `refresh_token` hash in the database.
4.  **Re-issue:** Rotates the refresh token (improves security) and issues a new `access_token`.
5.  **Resume:** Frontend interceptor injects the new token into headers and resumes the failed requests.

## 4. Protected Route Flow (Frontend)
1.  **State Init:** On mount, `AuthContext` calls `GET /api/auth/me`.
2.  **Authentication:** If successful, populates global state with `User` and `Wallet`. If it fails, state remains `null`.
3.  **Routing:** `ProtectedRoute` checks the `user` state. 
    *   If `null`, user is redirected via React Router `<Navigate to="/login" />`.
    *   If authenticated, grants access to the Dashboard and child routes.

## 5. Logout Flow
1.  **Backend Invalidations:** Deletes the `refresh_token` hash from the database.
2.  **Cookie Clearing:** Sets the `refresh_token` cookie to an expired date.
3.  **Frontend State Clearing:** Wipes `user`, `wallet`, and `token` from `AuthContext` memory, and redirects to Login.
