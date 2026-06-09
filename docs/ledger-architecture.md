# Phase 3 - Double Entry Ledger Architecture

SecurePay AI utilizes a fully immutable double-entry ledger engine to record all financial state. 

## Double Entry Principles
The core law of this architecture is strict invariance: `SUM(DEBITS) == SUM(CREDITS)` across all active accounts.
- **Debits:** Decrease liability balances (sender's money goes down).
- **Credits:** Increase liability balances (receiver's money goes up).
- **Immutability:** `LedgerEntry` tables are strictly insert-only. Deletions and updates are structurally prohibited by design. To correct an error, a `Reversal` batch must be explicitly posted.

## Ledger Flow & Batch Lifecycle
Every transfer triggers the following atomic chain via Prisma's `$transaction`:
1. `PENDING` Batch creation.
2. `DEBIT` entry written against Sender Account (`USR-WALLET-XYZ`).
3. `CREDIT` entry written against Receiver Account (`USR-WALLET-ABC`).
4. **Validation Filter:** Service calculates sum of entries. If mathematically unbalanced, an Error is thrown, triggering a hard database rollback.
5. Batch is marked `POSTED` with a `posted_at` timestamp.
6. Derived `Wallet.balance` cache is updated to reflect the new state.

## Balance Rebuild Process
Balances on the `Wallet` table are merely performance caches. The true financial truth is the sum of a user's ledger entries.
`ledgerService.rebuildBalance()` executes a raw aggregation of all DEBIT and CREDIT records for a specific account. The resulting mathematical delta is the indisputable balance.

## Reconciliation Logic
The system automatically calculates the difference between the cached Wallet balances and the rebuilt Ledger balances.
- If difference `=== 0.00`, status is `HEALTHY`.
- If difference `!== 0.00`, status is `CRITICAL` and explicitly flags the diverging wallet IDs.

## Audit Trail
The immutable nature of the ledger provides a comprehensive audit trail for external analysis. By aggregating entries under a specific `transaction_id`, an analyst can perfectly trace the money from origin account to destination account.
