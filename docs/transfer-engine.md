# Phase 2 - Transfer Engine Architecture

This document details the core money movement infrastructure designed for SecurePay AI, adhering to stringent fintech consistency requirements.

## Core Philosophy
- **Transactions represent events, not state.** Phase 2 writes events to the `transactions` table. Phase 3 will introduce double-entry ledger capabilities to back these events.
- **Isolated Engine:** Controllers NEVER mutate balances. The `transactionService.js` is the sole engine for money movement.

## Validation → Authorize → Execute → Record Pattern
Every transfer flows strictly through this paradigm within `executeTransfer()`:

1. **Validate:** Check input amounts against configurable limits (`config/transfer.js`) rejecting floats or invalid inputs immediately.
2. **Authorize:** Load Sender and Receiver wallets. Verify they are `ACTIVE`. Pre-check sender balance to fail fast without touching DB locks.
3. **Execute (Atomic Transaction):**
   - Opens a `prisma.$transaction`.
   - Decrements sender balance. If the decrement yields a negative balance (due to concurrency), throws an error to force rollback.
   - Increments receiver balance.
4. **Record:** Writes the `Transaction` record with a cryptographically unique `TXN-XXXXXXXXXX` reference. Returns success.

## Failure Scenarios Handled
- **Concurrency Overdraft:** If two requests hit simultaneously, Prisma's Native DB operations (`decrement`) ensure mathematical consistency. The transaction rolls back if balance falls below 0.
- **Node Crash Midway:** Handled by Postgres. If Node dies between the sender decrement and receiver increment, Postgres aborts the transaction. No money is lost.
- **Wallet Inactive:** Checks explicitly for `ACTIVE` status to support future suspension flows.

## Phase 3 Ledger Integration Strategy
To integrate the Ledger in Phase 3 with minimal refactoring:
1. Update `transactionService.js` to insert rows into a `Ledger` table (Credit/Debit entries) *inside* the existing Prisma `$transaction` block.
2. The `Transaction` table remains the high-level receipt for the user.
3. No frontend or controller code will need to change.
