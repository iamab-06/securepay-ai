# Phase 3 - Ledger & Reconciliation Strategy

This document details the immutable double-entry accounting engine implemented in Phase 3. 

## Double Entry Principles Implemented
- **Immutability:** `LedgerEntry` rows are strictly insert-only. There are no `UPDATE` or `DELETE` capabilities exposed by the API or the engine.
- **Balancing:** A `LedgerBatch` groups atomic events. The Transfer Engine asserts mathematically that `SUM(DEBIT) == SUM(CREDIT)` strictly before attempting to write any batch to the database. Unbalanced events instantly revert the overarching transaction.

## Account Nomenclature
We utilize strings mapped against UUIDs for scalable reporting:
- `USR-WALLET-<UUID>`: Standard user liability accounts.
- Extensibility for Phase 4: `SYS-RESERVE`, `SYS-FEES`, `SYS-ESCROW`.

## Reconciliation & Integrity
The API provides `GET /api/admin/ledger/health` to expose two distinct checks:
1. **Global Mathematical Integrity**: Performs a complete summation of ALL debits and credits in the system and ensures they sum strictly to 0 variance.
2. **Snapshot Reconciliation**: Calculates every user's derived ledger balance using `ledgerService.rebuildBalance()`. It then strictly compares this mathematical fact against the cached `Wallet.balance` snapshot. 

If any anomaly occurs, the engine returns `WARNING` or `CRITICAL` flags. Future AI Fraud components will consume this telemetry.

## Audit Capabilities
The `/audit` frontend dashboard renders the underlying ledger rows beneath standard "Transactions". It displays the exact `LGR-XXXXX` batches, explicit DEBITS/CREDITS, and timestamps, elevating the app from a visual interface to an auditable financial platform.
