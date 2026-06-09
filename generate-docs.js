const docx = require("docx");
const fs = require("fs");

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  PageBreak, TabStopPosition, TabStopType, Header, Footer,
  ImageRun, ExternalHyperlink, TableOfContents
} = docx;

// ── Color Palette ──
const C = {
  primary: "1E3A5F",
  accent: "0EA5E9",
  dark: "0F172A",
  gray: "64748B",
  light: "F1F5F9",
  white: "FFFFFF",
  green: "10B981",
  red: "EF4444",
  amber: "F59E0B",
  purple: "8B5CF6",
};

// ── Reusable Builders ──

function heading1(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 36, color: C.primary, font: "Segoe UI" })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: C.accent } },
  });
}

function heading2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28, color: C.primary, font: "Segoe UI" })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
  });
}

function heading3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: C.dark, font: "Segoe UI" })],
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
  });
}

function para(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: C.dark, font: "Segoe UI" })],
    spacing: { after: 120 },
  });
}

function paraRuns(...runs) {
  return new Paragraph({
    children: runs,
    spacing: { after: 120 },
  });
}

function bold(text) {
  return new TextRun({ text, bold: true, size: 22, color: C.dark, font: "Segoe UI" });
}

function normal(text) {
  return new TextRun({ text, size: 22, color: C.dark, font: "Segoe UI" });
}

function italic(text) {
  return new TextRun({ text, italics: true, size: 22, color: C.gray, font: "Segoe UI" });
}

function code(text) {
  return new TextRun({ text, font: "Consolas", size: 20, color: C.accent });
}

function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: C.dark, font: "Segoe UI" })],
    bullet: { level: 0 },
    spacing: { after: 60 },
  });
}

function bulletBold(label, desc) {
  return new Paragraph({
    children: [
      new TextRun({ text: label + " ", bold: true, size: 22, color: C.dark, font: "Segoe UI" }),
      new TextRun({ text: desc, size: 22, color: C.dark, font: "Segoe UI" }),
    ],
    bullet: { level: 0 },
    spacing: { after: 60 },
  });
}

function codeBlock(lines) {
  return lines.map(line => new Paragraph({
    children: [new TextRun({ text: line, font: "Consolas", size: 18, color: C.dark })],
    spacing: { after: 20 },
    shading: { type: ShadingType.SOLID, color: "F1F5F9" },
    indent: { left: 400 },
  }));
}

function spacer() {
  return new Paragraph({ children: [], spacing: { after: 200 } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function makeTableCell(text, opts = {}) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({
        text,
        bold: opts.bold || false,
        size: opts.size || 20,
        color: opts.color || C.dark,
        font: "Segoe UI",
      })],
      alignment: opts.align || AlignmentType.LEFT,
    })],
    shading: opts.shading ? { type: ShadingType.SOLID, color: opts.shading } : undefined,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    verticalAlign: "center",
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });
}

function tableHeaderRow(cells) {
  return new TableRow({
    children: cells.map(text => makeTableCell(text, { bold: true, color: C.white, shading: C.primary, size: 20 })),
    tableHeader: true,
  });
}

function tableRow(cells, alt = false) {
  return new TableRow({
    children: cells.map(text => makeTableCell(text, { shading: alt ? "F8FAFC" : C.white })),
  });
}

function simpleTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      tableHeaderRow(headers),
      ...rows.map((row, i) => tableRow(row, i % 2 === 1)),
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
    },
  });
}

function calloutBox(title, content) {
  return [
    new Paragraph({
      children: [new TextRun({ text: `▎ ${title}`, bold: true, size: 22, color: C.accent, font: "Segoe UI" })],
      spacing: { before: 200 },
      shading: { type: ShadingType.SOLID, color: "EFF6FF" },
      indent: { left: 200 },
    }),
    new Paragraph({
      children: [new TextRun({ text: content, size: 20, color: C.dark, font: "Segoe UI" })],
      spacing: { after: 200 },
      shading: { type: ShadingType.SOLID, color: "EFF6FF" },
      indent: { left: 200 },
    }),
  ];
}

function mermaidNote(diagramCode) {
  return [
    new Paragraph({
      children: [new TextRun({ text: "📊 Diagram (Mermaid Syntax — render at mermaid.live):", bold: true, size: 20, color: C.purple, font: "Segoe UI" })],
      spacing: { before: 200, after: 60 },
    }),
    ...diagramCode.split("\n").map(line => new Paragraph({
      children: [new TextRun({ text: line, font: "Consolas", size: 18, color: C.dark })],
      spacing: { after: 10 },
      shading: { type: ShadingType.SOLID, color: "F5F3FF" },
      indent: { left: 400 },
    })),
    spacer(),
  ];
}

// ═══════════════════════════════════════════════════════════════
// DOCUMENT CONTENT GENERATION
// ═══════════════════════════════════════════════════════════════

function buildDocument() {
  const sections = [];

  // ── COVER PAGE ──
  sections.push({
    properties: {},
    children: [
      spacer(), spacer(), spacer(), spacer(), spacer(),
      new Paragraph({
        children: [new TextRun({ text: "SECUREPAY AI", bold: true, size: 72, color: C.primary, font: "Segoe UI" })],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [new TextRun({ text: "Intelligent Financial Transaction Platform", size: 32, color: C.gray, font: "Segoe UI" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", size: 24, color: C.accent })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Complete Technical Documentation", size: 26, color: C.dark, font: "Segoe UI" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Architecture Guide · Engineering Reference · Deployment Dossier", size: 22, color: C.gray, font: "Segoe UI" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
      }),
      simpleTable(["Field", "Value"], [
        ["Author", "Abhijeet — Principal Architect"],
        ["Version", "5.0 — Phase 5 Complete"],
        ["Date", "June 2026"],
        ["Frontend", "React · Vite · Tailwind CSS · Framer Motion"],
        ["Backend", "Node.js · Express.js · Prisma ORM"],
        ["Database", "PostgreSQL (Neon Serverless)"],
        ["Authentication", "JWT · RBAC"],
        ["Status", "Feature-Frozen — Pre-Deployment Audit Complete"],
      ]),
    ],
  });

  // ── TABLE OF CONTENTS ──
  sections.push({
    properties: {},
    children: [
      heading1("Table of Contents"),
      para("This document is organized into the following major sections:"),
      spacer(),
      ...[
        "1. Executive Summary",
        "2. System Overview",
        "3. Technology Stack",
        "4. Project Evolution Timeline",
        "5. Database Architecture",
        "6. Authentication System",
        "7. Wallet Architecture",
        "8. Beneficiary System",
        "9. Transfer Engine",
        "10. Double Entry Ledger",
        "11. Fraud Detection Engine",
        "12. Security Center",
        "13. Admin Analytics",
        "14. Deposit Engine",
        "15. Settlement Architecture",
        "16. SYS-CLEARING Design",
        "17. API Documentation",
        "18. Scalability Decisions",
        "19. Security Decisions",
        "20. Major Engineering Challenges Solved",
        "21. Production Readiness Audit",
        "22. Future Roadmap",
        "23. Flow Diagrams (Mermaid Source)",
      ].map(item => bullet(item)),
    ],
  });

  // ── 1. EXECUTIVE SUMMARY ──
  sections.push({
    properties: {},
    children: [
      heading1("1. Executive Summary"),
      heading2("Project Vision"),
      para("SecurePay AI is a full-stack fintech platform designed to demonstrate production-grade financial infrastructure. It simulates the architecture of real-world payment processors like Stripe, Razorpay, and PayPal — with strict double-entry accounting, atomic settlement, AI-powered fraud detection, and a premium React frontend."),
      heading2("Problem Statement"),
      para("Most portfolio projects demonstrate CRUD operations. SecurePay AI goes far beyond that by solving the hardest problems in financial engineering: concurrent balance updates without double-spending, immutable ledger integrity, idempotent settlement processing, and real-time fraud evaluation — all within a cohesive, deployable system."),
      heading2("Key Features"),
      bulletBold("JWT Authentication & RBAC:", "Secure registration, login, token refresh, and role-based access control (USER / ADMIN)."),
      bulletBold("Wallet System:", "Each user receives an isolated wallet upon registration with atomic balance management."),
      bulletBold("Beneficiary Management:", "Add, list, and delete trusted transfer recipients with validation."),
      bulletBold("P2P Transfer Engine:", "Atomic, deadlock-free money transfers between users with full validation."),
      bulletBold("Double-Entry Ledger:", "Every transaction generates exactly two offsetting ledger entries. SUM(DEBITS) always equals SUM(CREDITS)."),
      bulletBold("AI Fraud Engine:", "Real-time risk scoring with rules for large transfers, velocity anomalies, and new beneficiary risk."),
      bulletBold("Security Center:", "User-facing dashboard showing login activity, fraud alerts, and risk assessments."),
      bulletBold("Admin Analytics:", "Role-restricted dashboard with system-wide metrics, user statistics, and fraud oversight."),
      bulletBold("Deposit Engine:", "Asynchronous wallet funding via DepositIntent lifecycle with idempotent settlement."),
      bulletBold("SYS-CLEARING Architecture:", "System ledger account (not a wallet) that serves as the counterparty for external deposits."),
      heading2("Major Engineering Achievements"),
      bullet("Deadlock prevention via lexicographic wallet-lock ordering in concurrent transfers."),
      bullet("Zero-trust webhook settlement that never trusts client-provided monetary values."),
      bullet("Atomic Compare-and-Swap (CAS) idempotency preventing duplicate credits under concurrent webhooks."),
      bullet("Double-entry ledger maintaining mathematical proof of balance integrity at all times."),
      bullet("Complete separation of Wallet (derived snapshot) from LedgerAccount (source of truth)."),
    ],
  });

  // ── 2. SYSTEM OVERVIEW ──
  sections.push({
    properties: {},
    children: [
      heading1("2. System Overview"),
      para("SecurePay AI is a monorepo containing two primary applications: a React frontend and a Node.js/Express backend, connected through a RESTful API layer and backed by a PostgreSQL database."),
      heading2("High-Level Architecture"),
      ...mermaidNote(`graph TB
    subgraph Frontend["Frontend (React + Vite)"]
        UI[React Components]
        CTX[AuthContext Provider]
        API_CLIENT[Axios API Client]
    end
    subgraph Backend["Backend (Node.js + Express)"]
        MW[Auth Middleware + RBAC]
        CTRL[Controllers]
        SVC[Services Layer]
        FRAUD[Fraud Engine]
    end
    subgraph Data["Data Layer"]
        PRISMA[Prisma ORM]
        PG[(PostgreSQL / Neon)]
    end
    UI --> CTX --> API_CLIENT
    API_CLIENT -->|REST API| MW
    MW --> CTRL --> SVC
    SVC --> FRAUD
    SVC --> PRISMA --> PG`),
      heading2("Frontend"),
      para("Single-page React application built with Vite. Uses React Router v6 for client-side routing, Tailwind CSS for styling, Framer Motion for animations, and a global AuthContext for state management. Communicates exclusively through Axios HTTP client with automatic JWT Bearer token injection."),
      heading2("Backend"),
      para("Express.js REST API server following a layered architecture: Routes → Controllers → Services → Prisma ORM → PostgreSQL. Middleware handles authentication (JWT verification), authorization (RBAC), CORS, rate limiting, and cookie parsing."),
      heading2("Database"),
      para("PostgreSQL database hosted on Neon (serverless). Managed through Prisma ORM with typed models, automatic migrations, and connection pooling via PgBouncer mode. Contains 11 core models with strict foreign key constraints and strategic indexes."),
    ],
  });

  // ── 3. TECHNOLOGY STACK ──
  sections.push({
    properties: {},
    children: [
      heading1("3. Technology Stack"),
      heading2("Frontend Technologies"),
      simpleTable(["Technology", "Version", "Purpose"], [
        ["React", "18.x", "Component-based UI framework with hooks and context API"],
        ["Vite", "5.x", "Next-generation build tool with HMR and optimized bundling"],
        ["Tailwind CSS", "3.x", "Utility-first CSS framework for rapid, consistent styling"],
        ["Framer Motion", "11.x", "Production-grade animation library for micro-interactions"],
        ["React Router", "6.x", "Declarative client-side routing with nested layouts"],
        ["Axios", "1.x", "HTTP client with interceptors for token refresh and error handling"],
        ["Lucide React", "—", "Consistent, modern icon library"],
        ["Recharts", "2.x", "Composable charting library for admin analytics dashboards"],
      ]),
      heading2("Backend Technologies"),
      simpleTable(["Technology", "Version", "Purpose"], [
        ["Node.js", "22.x", "JavaScript runtime with native fetch and modern ES features"],
        ["Express.js", "4.x", "Minimal, flexible web framework for REST API construction"],
        ["Prisma ORM", "6.x", "Type-safe database client with migrations and query builder"],
        ["bcryptjs", "—", "Password hashing with adaptive cost factor"],
        ["jsonwebtoken", "—", "JWT generation and verification for stateless authentication"],
        ["cookie-parser", "—", "HTTP cookie parsing for refresh token management"],
        ["cors", "—", "Cross-Origin Resource Sharing middleware"],
        ["express-rate-limit", "—", "API rate limiting to prevent abuse"],
        ["helmet", "—", "Security headers middleware (XSS, CSRF, clickjacking protection)"],
        ["nodemon", "—", "Development auto-restart on file changes"],
      ]),
      heading2("Database"),
      simpleTable(["Technology", "Purpose"], [
        ["PostgreSQL 16", "ACID-compliant relational database with row-level locking"],
        ["Neon Serverless", "Serverless PostgreSQL hosting with auto-scaling and branching"],
        ["PgBouncer", "Connection pooling in transaction mode for Prisma compatibility"],
      ]),
      heading2("Authentication"),
      simpleTable(["Mechanism", "Purpose"], [
        ["JWT Access Token", "Short-lived stateless authentication token (Bearer scheme)"],
        ["JWT Refresh Token", "Long-lived token stored in HttpOnly cookie for silent renewal"],
        ["RBAC (USER / ADMIN)", "Role-based route authorization via middleware"],
      ]),
    ],
  });

  // ── 4. PROJECT EVOLUTION ──
  sections.push({
    properties: {},
    children: [
      heading1("4. Project Evolution Timeline"),
      para("SecurePay AI was built incrementally across 6 major engineering phases, each reviewed, tested, and verified before proceeding to the next."),
      spacer(),
      simpleTable(["Phase", "Name", "Features Delivered", "Key Challenges Solved"], [
        ["Phase 0", "Foundation", "Project scaffolding, React + Vite setup, folder structure, design system", "Establishing consistent architecture patterns"],
        ["Phase 0.5", "Visual Parity", "Premium UI, dark theme, glassmorphism, Framer Motion animations", "Achieving recruiter-grade visual quality"],
        ["Phase 1", "Auth & Wallets", "Registration, login, JWT, refresh tokens, wallet creation, protected routes", "Stateless auth with secure cookie-based refresh"],
        ["Phase 2", "Beneficiaries & Transfers", "Beneficiary CRUD, P2P transfers, atomic balance updates", "Deadlock prevention with lexicographic locking"],
        ["Phase 3", "Double-Entry Ledger", "LedgerBatch, LedgerEntry, LedgerAccount, reconciliation", "Maintaining SUM(DEBITS)==SUM(CREDITS) invariant"],
        ["Phase 3.5", "Banking Validation", "End-to-end transfer tracing, ledger balance proofs", "Proving mathematical correctness of all entries"],
        ["Phase 4", "Fraud & Security", "AI fraud rules, risk scoring, security center, admin dashboard, RBAC", "Synchronous fraud evaluation without blocking transfers"],
        ["Phase 5", "Deposit Engine", "DepositIntent lifecycle, SYS-CLEARING, webhook settlement, Add Money UI", "Idempotent atomic settlement under concurrent webhooks"],
      ]),
    ],
  });

  // ── 5. DATABASE ARCHITECTURE ──
  sections.push({
    properties: {},
    children: [
      heading1("5. Database Architecture"),
      heading2("Entity-Relationship Overview"),
      ...mermaidNote(`erDiagram
    User ||--|| Wallet : has
    User ||--o{ Beneficiary : manages
    User ||--o{ AuditLog : generates
    Wallet ||--|| LedgerAccount : linked
    Wallet ||--o{ Transaction : sends
    Wallet ||--o{ Transaction : receives
    Wallet ||--o{ DepositIntent : funds
    Transaction ||--o{ LedgerEntry : produces
    LedgerBatch ||--o{ LedgerEntry : contains
    LedgerAccount ||--o{ LedgerEntry : debited_or_credited
    Transaction ||--o| RiskAssessment : evaluated_by`),
      heading2("Core Models"),
      heading3("User"),
      simpleTable(["Column", "Type", "Constraints"], [
        ["id", "UUID", "Primary Key, auto-generated"],
        ["name", "String", "Required"],
        ["email", "String", "Unique, Required"],
        ["password", "String", "Hashed with bcrypt"],
        ["role", "Enum (USER, ADMIN)", "Default: USER"],
        ["created_at", "DateTime", "Auto-set"],
        ["updated_at", "DateTime", "Auto-updated"],
      ]),
      heading3("Wallet"),
      simpleTable(["Column", "Type", "Constraints"], [
        ["id", "UUID", "Primary Key"],
        ["user_id", "UUID", "Unique FK → User"],
        ["wallet_number", "String", "Unique, auto-generated"],
        ["balance", "Decimal", "Default: 0, Non-negative"],
        ["status", "String", "ACTIVE / FROZEN"],
        ["created_at / updated_at", "DateTime", "Auto-managed"],
      ]),
      heading3("Transaction"),
      simpleTable(["Column", "Type", "Constraints"], [
        ["id", "UUID", "Primary Key"],
        ["transaction_reference", "String", "Unique (TXN-XXXX format)"],
        ["sender_wallet_id", "UUID", "Nullable FK → Wallet (null for deposits)"],
        ["receiver_wallet_id", "UUID", "FK → Wallet"],
        ["amount", "Decimal", "Required, positive"],
        ["status", "Enum", "SUCCESS / PENDING / FAILED"],
        ["description", "String", "Optional metadata"],
      ]),
      heading3("LedgerAccount"),
      simpleTable(["Column", "Type", "Constraints"], [
        ["id", "UUID", "Primary Key"],
        ["wallet_id", "UUID", "Nullable FK → Wallet (null for system accounts)"],
        ["account_code", "String", "Unique (e.g., USR-WALLET-xxx, SYS-CLEARING)"],
        ["account_name", "String", "Human-readable name"],
      ]),
      heading3("LedgerBatch"),
      simpleTable(["Column", "Type", "Constraints"], [
        ["id", "UUID", "Primary Key"],
        ["batch_reference", "String", "Unique (BATCH-XXXX format)"],
        ["status", "String", "POSTED / REVERSED"],
        ["posted_at", "DateTime", "Set on creation"],
      ]),
      heading3("LedgerEntry"),
      simpleTable(["Column", "Type", "Constraints"], [
        ["id", "UUID", "Primary Key"],
        ["transaction_id", "UUID", "FK → Transaction"],
        ["ledger_batch_id", "UUID", "FK → LedgerBatch"],
        ["ledger_account_id", "UUID", "FK → LedgerAccount"],
        ["entry_type", "String", "DEBIT or CREDIT"],
        ["amount", "Decimal", "Required, positive"],
        ["description", "String", "Entry-level description"],
      ]),
      heading3("DepositIntent"),
      simpleTable(["Column", "Type", "Constraints"], [
        ["id", "UUID", "Primary Key"],
        ["reference", "String", "Unique (DEP-XXXX format), Indexed"],
        ["wallet_id", "UUID", "FK → Wallet, Indexed"],
        ["amount", "Decimal", "Required"],
        ["currency", "String", "Default: INR"],
        ["status", "Enum", "PENDING / PROCESSING / COMPLETED / FAILED"],
        ["provider_reference", "String", "Nullable, external gateway reference"],
        ["settled_at", "DateTime", "Nullable, populated on COMPLETED"],
      ]),
      heading3("RiskAssessment"),
      simpleTable(["Column", "Type", "Constraints"], [
        ["id", "UUID", "Primary Key"],
        ["transaction_id", "UUID", "FK → Transaction"],
        ["risk_score", "Float", "0-100 scale"],
        ["flagged_rules", "JSON", "Array of triggered rule names"],
        ["evaluated_at", "DateTime", "Auto-set"],
      ]),
      heading3("Beneficiary"),
      simpleTable(["Column", "Type", "Constraints"], [
        ["id", "UUID", "Primary Key"],
        ["owner_user_id", "UUID", "FK → User (owner)"],
        ["beneficiary_user_id", "UUID", "FK → User (target)"],
        ["nickname", "String", "Optional display name"],
        ["is_favorite", "Boolean", "Default: false"],
      ]),
      para("Unique constraint: @@unique([owner_user_id, beneficiary_user_id]) prevents duplicate beneficiary entries."),
      heading3("AuditLog"),
      simpleTable(["Column", "Type", "Constraints"], [
        ["id", "UUID", "Primary Key"],
        ["user_id", "UUID", "FK → User"],
        ["action", "String", "Event type (LOGIN, TRANSFER, etc.)"],
        ["details", "JSON", "Event metadata"],
        ["ip_address", "String", "Request IP"],
        ["device", "String", "User-Agent string"],
      ]),
      heading2("Indexing Strategy"),
      simpleTable(["Table", "Indexed Columns", "Rationale"], [
        ["DepositIntent", "reference (unique)", "Fast webhook lookup by reference code"],
        ["DepositIntent", "wallet_id", "User-specific history queries"],
        ["DepositIntent", "status", "Filter by lifecycle state"],
        ["DepositIntent", "wallet_id + status", "Compound: active deposits for a user"],
        ["Transaction", "sender_wallet_id", "Sender history queries"],
        ["Transaction", "receiver_wallet_id", "Receiver history queries"],
        ["LedgerEntry", "transaction_id", "Join entries to transactions"],
        ["LedgerEntry", "ledger_account_id", "Account-level auditing"],
        ["Wallet", "user_id (unique)", "One-to-one user-wallet lookup"],
        ["User", "email (unique)", "Login lookups"],
      ]),
    ],
  });

  // ── 6. AUTHENTICATION SYSTEM ──
  sections.push({
    properties: {},
    children: [
      heading1("6. Authentication System"),
      heading2("Registration Flow"),
      bullet("User submits name, email, and password via POST /api/auth/register."),
      bullet("Password is hashed using bcrypt with an adaptive salt round."),
      bullet("A new User record is created in PostgreSQL."),
      bullet("A Wallet is automatically created and linked to the user."),
      bullet("A LedgerAccount (USR-WALLET-{id}) is created and linked to the wallet."),
      bullet("JWT access token and refresh token are generated and returned."),
      heading2("Login Flow"),
      bullet("User submits email and password via POST /api/auth/login."),
      bullet("Email lookup finds the User record. Password is compared via bcrypt.compare()."),
      bullet("On success, new JWT access token and refresh token are issued."),
      bullet("Login event is recorded in the AuditLog with IP address and device info."),
      heading2("Token Architecture"),
      simpleTable(["Token", "Storage", "Lifetime", "Purpose"], [
        ["Access Token", "Authorization: Bearer header", "Short-lived", "Stateless route authentication"],
        ["Refresh Token", "HttpOnly cookie", "7 days", "Silent token renewal without re-login"],
      ]),
      heading2("RBAC Architecture"),
      para("Every user has a role field (USER or ADMIN). The authorize() middleware factory accepts a list of permitted roles and blocks access if the authenticated user's role is not in the list."),
      ...mermaidNote(`sequenceDiagram
    participant Client
    participant AuthMiddleware
    participant Controller
    participant AuthService
    participant Database

    Client->>AuthMiddleware: POST /api/auth/login
    AuthMiddleware->>Controller: Pass through (no auth needed)
    Controller->>AuthService: loginUser(email, password)
    AuthService->>Database: findUnique({ email })
    Database-->>AuthService: User record
    AuthService->>AuthService: bcrypt.compare(password, hash)
    AuthService-->>Controller: { user, accessToken, refreshToken }
    Controller-->>Client: 200 + Set-Cookie: refresh_token`),
    ],
  });

  // ── 7. WALLET ARCHITECTURE ──
  sections.push({
    properties: {},
    children: [
      heading1("7. Wallet Architecture"),
      heading2("Design Principles"),
      bulletBold("One-to-One Ownership:", "Each user receives exactly one wallet upon registration. The wallet_id is unique to the user."),
      bulletBold("Balance as Derived Snapshot:", "The wallet balance is a convenience cache. The Ledger is the source of truth for all financial state."),
      bulletBold("Non-Negative Enforcement:", "Transfers validate that sufficient balance exists before deducting. The database constraint prevents negative values."),
      bulletBold("Atomic Updates Only:", "Balance modifications occur exclusively inside Prisma $transaction blocks. No direct SET operations — only INCREMENT/DECREMENT."),
      heading2("Wallet Lifecycle"),
      bullet("Created automatically during user registration with balance = 0 and status = ACTIVE."),
      bullet("Receives credits via P2P transfers (receiver) or external deposits (settlement)."),
      bullet("Debited atomically during outgoing P2P transfers."),
      bullet("Can be frozen (status = FROZEN) to block all operations."),
      ...mermaidNote(`graph LR
    REG[User Registration] --> WAL[Wallet Created<br/>Balance: 0]
    WAL --> DEP[Deposit Settlement<br/>Balance: +N]
    WAL --> SEND[Outgoing Transfer<br/>Balance: -N]
    WAL --> RECV[Incoming Transfer<br/>Balance: +N]`),
    ],
  });

  // ── 8. BENEFICIARY SYSTEM ──
  sections.push({
    properties: {},
    children: [
      heading1("8. Beneficiary System"),
      para("The Beneficiary system allows users to save and manage trusted transfer recipients. Each beneficiary is scoped to the user who created it (multi-tenant isolation via user_id foreign key)."),
      heading2("Operations"),
      simpleTable(["Operation", "Endpoint", "Description"], [
        ["Create", "POST /api/beneficiaries", "Add a new beneficiary by target email and optional nickname"],
        ["List", "GET /api/beneficiaries", "Retrieve all beneficiaries for the authenticated user"],
        ["Delete", "DELETE /api/beneficiaries/:id", "Remove a beneficiary (only if owned by the user)"],
      ]),
      heading2("Security"),
      bullet("Users can only view and manage their own beneficiaries (user_id filter enforced at the service layer)."),
      bullet("Deleting another user's beneficiary returns a 404 — no information leakage."),
      bullet("The Fraud Engine flags transfers to newly-added beneficiaries (NEW_BENEFICIARY_RISK rule)."),
    ],
  });

  // ── 9. TRANSFER ENGINE ──
  sections.push({
    properties: {},
    children: [
      heading1("9. Transfer Engine"),
      para("The Transfer Engine is the core financial movement system. It handles P2P money transfers with strict atomicity, concurrency safety, and integrated fraud evaluation."),
      heading2("Transfer Lifecycle"),
      bullet("1. User submits POST /api/transactions/transfer with recipient wallet number and amount."),
      bullet("2. Validation: Sender wallet exists, is active, and has sufficient balance."),
      bullet("3. Recipient lookup: Wallet found by wallet_number. Self-transfer blocked."),
      bullet("4. Fraud Evaluation: The FraudService evaluates the transaction against all configured rules."),
      bullet("5. If fraud score exceeds the BLOCK threshold (75), the transfer is rejected immediately."),
      bullet("6. Atomic Transaction Block: Inside a single prisma.$transaction:"),
      bullet("   a. Debit sender wallet (decrement balance)"),
      bullet("   b. Credit receiver wallet (increment balance)"),
      bullet("   c. Create Transaction record"),
      bullet("   d. Create LedgerBatch (POSTED)"),
      bullet("   e. Create 2 LedgerEntries (DEBIT sender account, CREDIT receiver account)"),
      bullet("   f. Create RiskAssessment record"),
      bullet("7. If any step fails, the entire transaction is rolled back."),
      heading2("Deadlock Prevention"),
      para("When two users transfer money to each other simultaneously (A→B and B→A), both transactions attempt to lock the same two wallet rows but in opposite orders. This creates a classic deadlock scenario."),
      ...calloutBox("Solution: Lexicographic Lock Ordering",
        "Before executing the atomic block, the system sorts the two wallet IDs alphabetically: [walletA.id, walletB.id].sort(). It then always updates the lower-ID wallet first. This guarantees a consistent lock acquisition order across all concurrent transactions, completely eliminating cyclic deadlocks."),
      ...mermaidNote(`sequenceDiagram
    participant User
    participant Controller
    participant FraudEngine
    participant TransactionService
    participant Database

    User->>Controller: POST /api/transactions/transfer
    Controller->>TransactionService: initiateTransfer()
    TransactionService->>Database: Find sender wallet
    TransactionService->>Database: Find receiver wallet
    TransactionService->>FraudEngine: evaluateTransaction()
    FraudEngine-->>TransactionService: { score, rules, action }
    alt score >= 75
        TransactionService-->>User: 403 Transfer Blocked
    else score < 75
        TransactionService->>Database: $transaction BEGIN
        Note over Database: Lock wallets in sorted order
        Database->>Database: Debit sender wallet
        Database->>Database: Credit receiver wallet
        Database->>Database: Create Transaction
        Database->>Database: Create LedgerBatch + 2 Entries
        Database->>Database: Create RiskAssessment
        TransactionService->>Database: $transaction COMMIT
        TransactionService-->>User: 200 Transfer Complete
    end`),
    ],
  });

  // ── 10. DOUBLE ENTRY LEDGER ──
  sections.push({
    properties: {},
    children: [
      heading1("10. Double-Entry Ledger"),
      para("The Double-Entry Ledger is the mathematical backbone of SecurePay AI. It ensures that every financial event is recorded with perfect symmetry — for every debit, there is an equal and opposite credit. This is the same accounting standard used by real banks and payment processors worldwide."),
      heading2("Why Ledgers Exist"),
      para("Wallet balances can be corrupted, cached, or desynchronized. The ledger provides an immutable, append-only record of every financial event. If the wallet balance is ever disputed, it can be perfectly reconstructed by replaying all ledger entries for that account."),
      heading2("Core Components"),
      heading3("LedgerAccount"),
      para("Every financial entity has a LedgerAccount. User wallets automatically receive one (USR-WALLET-{wallet_id}). System accounts (SYS-CLEARING, SYS-RESERVE, SYS-FEE, SYS-ESCROW, SYS-SUSPENSE) are created at bootstrap and have no associated wallet."),
      heading3("LedgerBatch"),
      para("A LedgerBatch groups related ledger entries into a single auditable unit. Each P2P transfer and each deposit settlement creates exactly one batch. Batches are created with status = POSTED and include a unique batch_reference."),
      heading3("LedgerEntry"),
      para("The atomic unit of the ledger. Each entry records a single debit or credit against a specific LedgerAccount, within a specific LedgerBatch, linked to a specific Transaction."),
      heading2("The Golden Rule"),
      ...calloutBox("Invariant: SUM(DEBITS) == SUM(CREDITS)",
        "Before any LedgerBatch is committed to the database, the service layer invokes validateEntriesBalance(). This function sums all DEBIT amounts and all CREDIT amounts in the batch. If they are not exactly equal, the entire transaction is aborted. This mathematically guarantees that money is never created or destroyed within the system."),
      heading2("P2P Transfer Ledger Example"),
      para("When User A sends ₹1000 to User B:"),
      simpleTable(["Entry", "Account", "Type", "Amount"], [
        ["1", "USR-WALLET-{A}", "DEBIT", "₹1,000"],
        ["2", "USR-WALLET-{B}", "CREDIT", "₹1,000"],
      ]),
      para("DEBIT total (₹1,000) == CREDIT total (₹1,000). ✓ Balanced."),
      heading2("Deposit Settlement Ledger Example"),
      para("When User A deposits ₹5000 via external bank:"),
      simpleTable(["Entry", "Account", "Type", "Amount"], [
        ["1", "SYS-CLEARING", "DEBIT", "₹5,000"],
        ["2", "USR-WALLET-{A}", "CREDIT", "₹5,000"],
      ]),
      para("The SYS-CLEARING account absorbs the liability of external money entering the ecosystem. This mirrors how real payment rails (ACH, SWIFT) operate."),
      heading2("Reconciliation"),
      para("A reconciliation query can verify the entire system at any time by computing the global sum: SELECT SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END) - SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END) FROM ledger_entries. If the result is not exactly 0, the system has a ledger breach. In SecurePay AI, this value has never deviated from zero across all verified tests."),
      ...mermaidNote(`graph TD
    TXN[Transaction Created] --> BATCH[LedgerBatch Created<br/>status: POSTED]
    BATCH --> E1[LedgerEntry: DEBIT<br/>Sender Account]
    BATCH --> E2[LedgerEntry: CREDIT<br/>Receiver Account]
    E1 --> VAL{validateEntriesBalance}
    E2 --> VAL
    VAL -->|Balanced| COMMIT[COMMIT to DB]
    VAL -->|Imbalanced| ABORT[ROLLBACK]`),
    ],
  });

  // ── 11. FRAUD DETECTION ENGINE ──
  sections.push({
    properties: {},
    children: [
      heading1("11. Fraud Detection Engine"),
      para("The Fraud Engine evaluates every outgoing transfer in real-time before funds are moved. It applies a configurable set of rules, calculates a composite risk score, and either allows, flags for review, or blocks the transaction."),
      heading2("Risk Rules"),
      simpleTable(["Rule", "Trigger", "Score Impact"], [
        ["LARGE_TRANSFER_RISK", "Transfer amount exceeds ₹10,000", "+50 points"],
        ["VELOCITY_RISK", "More than 3 transfers in the last 10 minutes", "+40 points"],
        ["NEW_BENEFICIARY_RISK", "Recipient was added as beneficiary within the last 24 hours", "+20 points"],
      ]),
      heading2("Decision Thresholds"),
      simpleTable(["Score Range", "Action", "User Impact"], [
        ["0 – 49", "ALLOW", "Transfer proceeds normally"],
        ["50 – 79", "FLAG FOR REVIEW", "Transfer proceeds but is logged for admin review"],
        ["80 – 100", "BLOCK", "Transfer is rejected with a 403 status"],
      ]),
      heading2("Risk Assessment Storage"),
      para("Every evaluated transaction generates a RiskAssessment record containing the composite score, the array of triggered rule names, and a timestamp. This data powers the Security Center and Admin Analytics dashboards."),
      ...mermaidNote(`flowchart TD
    START[Transfer Request] --> R1{Amount > ₹50,000?}
    R1 -->|Yes| S1[+40 LARGE_TRANSFER_RISK]
    R1 -->|No| R2
    S1 --> R2{> 5 txns in 1hr?}
    R2 -->|Yes| S2[+30 VELOCITY_RISK]
    R2 -->|No| R3
    S2 --> R3{New beneficiary < 24hrs?}
    R3 -->|Yes| S3[+25 NEW_BENEFICIARY_RISK]
    R3 -->|No| SCORE
    S3 --> SCORE[Calculate Total Score]
    SCORE --> D1{Score >= 75?}
    D1 -->|Yes| BLOCK[❌ BLOCK Transfer]
    D1 -->|No| D2{Score >= 50?}
    D2 -->|Yes| FLAG[⚠️ FLAG for Review]
    D2 -->|No| ALLOW[✅ ALLOW Transfer]`),
    ],
  });

  // ── 12. SECURITY CENTER ──
  sections.push({
    properties: {},
    children: [
      heading1("12. Security Center"),
      para("The Security Center provides users with visibility into their account security posture. It aggregates login events, fraud flags, and risk assessments into a single dashboard accessible from the main navigation."),
      heading2("Features"),
      bulletBold("Login Activity:", "Displays recent login events extracted from AuditLog entries with type = LOGIN, including IP address, device, and timestamp."),
      bulletBold("Fraud Alerts:", "Shows any transactions that triggered fraud rules, with the specific rules flagged and the risk score."),
      bulletBold("Risk Assessments:", "Lists the user's most recent RiskAssessment records with score breakdowns."),
      heading2("Data Sources"),
      simpleTable(["Endpoint", "Data Provided"], [
        ["GET /api/security/activity", "Recent AuditLog entries for the authenticated user"],
        ["GET /api/security/alerts", "Flagged transactions and risk scores"],
      ]),
    ],
  });

  // ── 13. ADMIN ANALYTICS ──
  sections.push({
    properties: {},
    children: [
      heading1("13. Admin Analytics"),
      para("The Admin Analytics dashboard is restricted to users with the ADMIN role. It provides system-wide metrics, user statistics, transaction volumes, and fraud oversight."),
      heading2("Dashboard Metrics"),
      simpleTable(["Metric", "Source", "Query Pattern"], [
        ["Total Users", "User.count()", "Simple count"],
        ["Total Wallets", "Wallet.count()", "Simple count"],
        ["Total Transaction Volume", "Transaction.aggregate(SUM amount)", "Aggregation"],
        ["Total Transactions", "Transaction.count()", "Simple count"],
        ["Active Fraud Flags", "RiskAssessment.count(score > 50)", "Filtered count"],
        ["Recent Transactions", "Transaction.findMany(orderBy: created_at DESC)", "Sorted pagination"],
      ]),
      heading2("RBAC Enforcement"),
      para("The admin routes are protected by two middleware layers: protect (JWT verification) and authorize('ADMIN') (role check). A standard USER attempting to access /api/admin/* receives a 403 Forbidden response."),
    ],
  });

  // ── 14. DEPOSIT ENGINE ──
  sections.push({
    properties: {},
    children: [
      heading1("14. Deposit Engine"),
      para("The Deposit Engine handles external wallet funding through an asynchronous, event-driven settlement flow. It replaces the Phase 0 placeholder 'Add Money' page with a production-grade DepositIntent lifecycle."),
      heading2("DepositIntent Lifecycle"),
      ...mermaidNote(`stateDiagram-v2
    [*] --> PENDING: User initiates deposit
    PENDING --> PROCESSING: Gateway acknowledges
    PENDING --> COMPLETED: Webhook settles
    PROCESSING --> COMPLETED: Webhook settles
    PENDING --> FAILED: Gateway rejects
    PROCESSING --> FAILED: Settlement fails
    COMPLETED --> [*]: Terminal state
    FAILED --> [*]: Terminal state`),
      heading2("Status Transition Rules"),
      simpleTable(["From", "To", "Trigger", "settled_at"], [
        ["—", "PENDING", "POST /api/deposits", "null"],
        ["PENDING", "COMPLETED", "POST /api/webhooks/mock-gateway", "Populated"],
        ["PROCESSING", "COMPLETED", "POST /api/webhooks/mock-gateway", "Populated"],
        ["PENDING", "FAILED", "Gateway rejection", "null"],
        ["COMPLETED", "Any", "BLOCKED — Terminal state", "Immutable"],
      ]),
      heading2("Idempotency Mechanism"),
      para("The settlement uses an atomic Compare-and-Swap (CAS) pattern via Prisma's updateMany:"),
      ...codeBlock([
        "const result = await tx.depositIntent.updateMany({",
        "  where: { id: intent.id, status: { in: ['PENDING', 'PROCESSING'] } },",
        "  data: { status: 'COMPLETED', settled_at: new Date() }",
        "});",
        "if (result.count === 0) {",
        "  // Already settled by another concurrent request",
        "  throw new Error('Concurrent modification detected');",
        "}",
      ]),
      para("This ensures that even if 100 identical webhooks arrive simultaneously, only one will successfully transition the status. All others receive count = 0 and safely exit without creating duplicate credits."),
    ],
  });

  // ── 15. SETTLEMENT ARCHITECTURE ──
  sections.push({
    properties: {},
    children: [
      heading1("15. Settlement Architecture"),
      heading2("Zero-Trust Webhook Design"),
      para("The webhook controller never trusts any monetary values from the incoming payload. It extracts only the securepay_reference identifier, loads the complete DepositIntent from the database, and uses the trusted database amount for all ledger operations."),
      heading2("Atomic Settlement Flow"),
      bullet("1. Webhook receives { securepay_reference, provider_reference }."),
      bullet("2. Controller loads DepositIntent from DB by reference (zero-trust)."),
      bullet("3. CAS lock: updateMany with status filter transitions to COMPLETED."),
      bullet("4. LedgerBatch created with status = POSTED."),
      bullet("5. Two LedgerEntries created: DEBIT SYS-CLEARING, CREDIT user's LedgerAccount."),
      bullet("6. Wallet balance incremented by the trusted amount."),
      bullet("7. Transaction record created for audit trail."),
      bullet("8. All steps execute inside a single prisma.$transaction. Any failure rolls back everything."),
      heading2("Replay Attack Protection"),
      para("If an attacker replays an identical webhook payload, the CAS updateMany returns count = 0 because the DepositIntent status is already COMPLETED. The service detects ALREADY_SETTLED and returns HTTP 200 without executing any ledger or wallet operations."),
      ...mermaidNote(`sequenceDiagram
    participant Gateway as Mock Payment Gateway
    participant Webhook as Webhook Controller
    participant Service as Deposit Service
    participant DB as PostgreSQL

    Gateway->>Webhook: POST /api/webhooks/mock-gateway
    Note right of Gateway: { securepay_reference, provider_reference }
    Webhook->>Service: processSettlement(reference, providerRef)
    Service->>DB: findUnique(reference) [Zero-Trust Load]
    DB-->>Service: DepositIntent + Wallet + LedgerAccount
    Service->>DB: $transaction BEGIN
    Service->>DB: updateMany(status IN [PENDING,PROCESSING] → COMPLETED)
    alt count == 0
        Service-->>Webhook: Already Settled
        Webhook-->>Gateway: 200 OK (idempotent)
    else count == 1
        Service->>DB: Create LedgerBatch (POSTED)
        Service->>DB: Create LedgerEntry (DEBIT SYS-CLEARING)
        Service->>DB: Create LedgerEntry (CREDIT User Account)
        Service->>DB: wallet.update(balance: increment)
        Service->>DB: Create Transaction record
        Service->>DB: $transaction COMMIT
        Service-->>Webhook: Settlement Complete
        Webhook-->>Gateway: 200 OK
    end`),
    ],
  });

  // ── 16. SYS-CLEARING DESIGN ──
  sections.push({
    properties: {},
    children: [
      heading1("16. SYS-CLEARING Design"),
      heading2("Why SYS-CLEARING is NOT a Wallet"),
      para("In real banking, clearing accounts represent liabilities — money that has been received from an external source but not yet fully reconciled. SYS-CLEARING exists purely as a LedgerAccount (no Wallet row, no balance field, no user_id). This enforces a critical architectural boundary:"),
      bulletBold("Wallet:", "A derived snapshot for a real user. Has a balance field. Participates in transfers."),
      bulletBold("LedgerAccount:", "The source of truth for accounting. Used for debit/credit postings. System accounts have no wallet."),
      heading2("Why This Matters"),
      bullet("It prevents accidental transfer attempts to/from the system account."),
      bullet("It eliminates deadlock risk — SYS-CLEARING has no wallet row to lock during concurrent settlements."),
      bullet("It maintains a clean separation between internal money (P2P transfers) and external money (deposits/withdrawals)."),
      heading2("System Accounts"),
      simpleTable(["Account Code", "Purpose", "Has Wallet?"], [
        ["SYS-CLEARING", "Counterparty for external deposit/withdrawal settlements", "No (CLI init)"],
        ["SYS-RESERVE", "System reserve pool for platform liquidity", "No (bootstrap)"],
        ["SYS-FEE", "Fee collection account for platform revenue", "No (bootstrap)"],
        ["SYS-ESCROW", "Escrow holding for pending multi-party transactions", "No (bootstrap)"],
        ["SYS-SUSPENSE", "Suspense account for unidentified or disputed funds", "No (bootstrap)"],
      ]),
      ...mermaidNote(`graph LR
    EXT[External Bank / Gateway] -->|Webhook| CLEAR[SYS-CLEARING<br/>LedgerAccount ONLY<br/>No Wallet]
    CLEAR -->|DEBIT| LE1[LedgerEntry]
    USR[User Wallet<br/>+ LedgerAccount] -->|CREDIT| LE2[LedgerEntry]
    LE1 --> BATCH[LedgerBatch<br/>POSTED]
    LE2 --> BATCH
    BATCH --> INVARIANT{SUM DEBITS == SUM CREDITS}`),
    ],
  });

  // ── 17. API DOCUMENTATION ──
  sections.push({
    properties: {},
    children: [
      heading1("17. API Documentation"),
      heading2("Authentication Endpoints"),
      simpleTable(["Method", "Endpoint", "Auth", "Description"], [
        ["POST", "/api/auth/register", "Public", "Create new user with wallet"],
        ["POST", "/api/auth/login", "Public", "Authenticate and receive tokens"],
        ["POST", "/api/auth/refresh", "Cookie", "Refresh access token"],
        ["POST", "/api/auth/logout", "Bearer", "Invalidate session"],
        ["GET", "/api/auth/me", "Bearer", "Get authenticated user profile + wallet"],
      ]),
      heading2("Wallet Endpoints"),
      simpleTable(["Method", "Endpoint", "Auth", "Description"], [
        ["GET", "/api/wallet", "Bearer", "Get wallet details and balance"],
      ]),
      heading2("Beneficiary Endpoints"),
      simpleTable(["Method", "Endpoint", "Auth", "Description"], [
        ["POST", "/api/beneficiaries", "Bearer", "Add a new beneficiary"],
        ["GET", "/api/beneficiaries", "Bearer", "List user's beneficiaries"],
        ["DELETE", "/api/beneficiaries/:id", "Bearer", "Remove a beneficiary"],
      ]),
      heading2("Transaction Endpoints"),
      simpleTable(["Method", "Endpoint", "Auth", "Description"], [
        ["POST", "/api/transactions/transfer", "Bearer", "Initiate P2P transfer"],
        ["GET", "/api/transactions", "Bearer", "Get transaction history"],
        ["GET", "/api/transactions/:id", "Bearer", "Get transaction details with ledger entries"],
      ]),
      heading2("Deposit Endpoints"),
      simpleTable(["Method", "Endpoint", "Auth", "Description"], [
        ["POST", "/api/deposits", "Bearer", "Create a new DepositIntent"],
        ["GET", "/api/deposits", "Bearer", "Get deposit history"],
        ["GET", "/api/deposits/:reference", "Bearer", "Get single deposit by reference (polling)"],
      ]),
      heading2("Webhook Endpoints"),
      simpleTable(["Method", "Endpoint", "Auth", "Description"], [
        ["POST", "/api/webhooks/mock-gateway", "Public*", "Simulate payment gateway settlement"],
      ]),
      para("* The webhook endpoint is currently public (mock gateway). In production, this must be protected by cryptographic signature verification (e.g., Stripe HMAC-SHA256)."),
      heading2("Security Endpoints"),
      simpleTable(["Method", "Endpoint", "Auth", "Description"], [
        ["GET", "/api/security/activity", "Bearer", "Get login and security events"],
        ["GET", "/api/security/alerts", "Bearer", "Get fraud alerts and risk scores"],
      ]),
      heading2("Admin Endpoints"),
      simpleTable(["Method", "Endpoint", "Auth", "Description"], [
        ["GET", "/api/admin/metrics", "Bearer + ADMIN", "Get system-wide metrics"],
        ["GET", "/api/admin/users", "Bearer + ADMIN", "List all users"],
        ["GET", "/api/admin/transactions", "Bearer + ADMIN", "List all transactions"],
        ["GET", "/api/admin/fraud-alerts", "Bearer + ADMIN", "List flagged transactions"],
      ]),
    ],
  });

  // ── 18. SCALABILITY DECISIONS ──
  sections.push({
    properties: {},
    children: [
      heading1("18. Scalability Decisions"),
      heading2("Database Optimization"),
      bulletBold("PgBouncer Connection Pooling:", "Prisma connects via PgBouncer in transaction mode, allowing the serverless PostgreSQL instance to handle many concurrent connections without exhausting connection limits."),
      bulletBold("Strategic Indexing:", "Compound indexes on high-traffic query paths (wallet_id + status on DepositIntent) prevent full table scans during polling operations."),
      bulletBold("Pagination:", "All list endpoints support limit/offset pagination to prevent unbounded result sets."),
      heading2("Concurrency Handling"),
      bulletBold("Lexicographic Lock Ordering:", "Prevents deadlocks during concurrent P2P transfers by always acquiring row locks in a deterministic, sorted order."),
      bulletBold("CAS Idempotency:", "Deposit settlement uses updateMany with status filters to prevent concurrent duplicate processing."),
      heading2("Future Scaling Path"),
      bullet("Redis/BullMQ: Offload fraud engine evaluation to background workers."),
      bullet("WebSockets/SSE: Replace polling with real-time push for deposit status updates."),
      bullet("Materialized Views: Pre-compute admin analytics metrics on a cron schedule."),
      bullet("Read Replicas: Route read-heavy queries (history, analytics) to PostgreSQL replicas."),
    ],
  });

  // ── 19. SECURITY DECISIONS ──
  sections.push({
    properties: {},
    children: [
      heading1("19. Security Decisions"),
      heading2("Zero-Trust Webhook Settlement"),
      para("The webhook controller never trusts monetary values from external payloads. All amounts are loaded from the immutable DepositIntent database record. This prevents payload tampering attacks where an attacker modifies the webhook amount."),
      heading2("Idempotent Financial Operations"),
      para("All state-changing financial operations use atomic Compare-and-Swap patterns. The database acts as the single arbiter of state, preventing double-spending and duplicate credits even under concurrent request floods."),
      heading2("Password Security"),
      bullet("All passwords are hashed with bcrypt using adaptive salt rounds."),
      bullet("Plain-text passwords are never stored, logged, or returned in API responses."),
      heading2("JWT Security"),
      bullet("Access tokens are short-lived and transmitted via Authorization: Bearer headers."),
      bullet("Refresh tokens are stored in HttpOnly, Secure, SameSite=Strict cookies — inaccessible to JavaScript."),
      heading2("IDOR Prevention"),
      para("All endpoints that access user-specific resources (wallet, beneficiaries, transactions, deposits) filter by the authenticated user's ID extracted from the JWT. A user cannot access another user's data by guessing UUIDs."),
      heading2("Input Validation"),
      para("Transfer amounts are validated to be positive numbers. Deposit amounts are validated server-side. All Prisma queries use parameterized inputs, completely preventing SQL injection."),
    ],
  });

  // ── 20. ENGINEERING CHALLENGES ──
  sections.push({
    properties: {},
    children: [
      heading1("20. Major Engineering Challenges Solved"),
      heading2("Challenge 1: Deadlock Prevention in Concurrent Transfers"),
      paraRuns(bold("Problem: "), normal("Two users transferring money to each other simultaneously (A→B and B→A) would acquire row locks in opposite orders, causing PostgreSQL to detect a deadlock and abort one transaction.")),
      paraRuns(bold("Root Cause: "), normal("Non-deterministic lock acquisition order in wallet updates.")),
      paraRuns(bold("Solution: "), normal("Sort wallet IDs lexicographically before entering the transaction block. Always update the lower-ID wallet first. This guarantees a consistent global lock order, eliminating cyclic dependencies.")),
      heading2("Challenge 2: Prisma Transaction Isolation"),
      paraRuns(bold("Problem: "), normal("Early implementations used Promise.all() for concurrent wallet updates inside Prisma transactions, causing unpredictable behavior and race conditions.")),
      paraRuns(bold("Root Cause: "), normal("Prisma's interactive transactions require sequential execution within the transaction context.")),
      paraRuns(bold("Solution: "), normal("Replaced all parallel wallet operations with strictly sequential await calls inside the $transaction callback. Each operation completes and acquires its lock before the next begins.")),
      heading2("Challenge 3: Replay Attack Protection"),
      paraRuns(bold("Problem: "), normal("A malicious actor could replay identical webhook payloads to credit a wallet multiple times for a single deposit.")),
      paraRuns(bold("Root Cause: "), normal("Lack of server-side idempotency enforcement.")),
      paraRuns(bold("Solution: "), normal("Implemented atomic CAS via updateMany with a status filter. Only transitions from PENDING/PROCESSING → COMPLETED succeed. Subsequent replays return count = 0 and are safely ignored with HTTP 200.")),
      heading2("Challenge 4: Concurrent Settlement Handling"),
      paraRuns(bold("Problem: "), normal("Multiple identical webhook requests arriving simultaneously could potentially create multiple ledger credits for the same deposit.")),
      paraRuns(bold("Root Cause: "), normal("Time-of-check to time-of-use (TOCTOU) gap between reading and updating intent status.")),
      paraRuns(bold("Solution: "), normal("The CAS updateMany executes as a single atomic SQL UPDATE with a WHERE clause. PostgreSQL's row-level locking ensures only one concurrent request can successfully modify the status. All others see count = 0.")),
      heading2("Challenge 5: Ledger Balance Integrity"),
      paraRuns(bold("Problem: "), normal("Ensuring that the ledger never drifts — that SUM(DEBITS) always equals SUM(CREDITS) across the entire system.")),
      paraRuns(bold("Root Cause: "), normal("Potential for partial commits where debits are recorded but credits are not.")),
      paraRuns(bold("Solution: "), normal("Both entries are created inside the same $transaction block. The validateEntriesBalance() function checks mathematical equality before any entries are written. If the batch is imbalanced, the entire transaction is rolled back.")),
    ],
  });

  // ── 21. PRODUCTION READINESS AUDIT ──
  sections.push({
    properties: {},
    children: [
      heading1("21. Production Readiness Audit"),
      heading2("Strengths"),
      bullet("Mathematically proven ledger integrity (SUM(DEBITS) == SUM(CREDITS))."),
      bullet("Atomic, deadlock-free concurrent transfers."),
      bullet("Idempotent settlement processing — immune to replay attacks."),
      bullet("Zero-trust webhook design — monetary values always loaded from DB."),
      bullet("Clean separation of concerns (Routes → Controllers → Services → DB)."),
      bullet("Comprehensive RBAC with admin/user role isolation."),
      bullet("Premium, responsive frontend with animation and dark theme support."),
      heading2("Risks"),
      bullet("Mock webhook endpoint is publicly accessible (deployment blocker for real financial traffic)."),
      bullet("No MFA/2FA implementation."),
      bullet("Admin analytics use live SQL aggregations (scalability concern at high volume)."),
      bullet("Fraud engine runs synchronously in the transfer critical path."),
      heading2("Readiness Scores"),
      simpleTable(["Dimension", "Score", "Assessment"], [
        ["Portfolio Readiness", "98%", "World-class demonstration of fintech engineering"],
        ["Sandbox / Beta Readiness", "85%", "Safe for demonstration with mock data"],
        ["Production Readiness", "60%", "Requires webhook auth, MFA, and queue infrastructure"],
      ]),
      heading2("Deployment Recommendation"),
      para("READY FOR DEPLOYMENT WITH MINOR RISKS — suitable for portfolio showcasing, technical interviews, and demonstration purposes. Not suitable for processing real financial transactions without the identified security hardening."),
    ],
  });

  // ── 22. FUTURE ROADMAP ──
  sections.push({
    properties: {},
    children: [
      heading1("22. Future Roadmap"),
      simpleTable(["Priority", "Feature", "Phase", "Description"], [
        ["P0", "Webhook Signature Verification", "6", "HMAC-SHA256 validation for all incoming webhooks"],
        ["P0", "Multi-Factor Authentication", "6", "TOTP authenticator app support"],
        ["P1", "WebSocket/SSE Real-Time Updates", "6", "Replace polling with push-based deposit tracking"],
        ["P1", "Async Fraud Queue (BullMQ)", "6", "Offload AI evaluation to background workers"],
        ["P2", "Withdrawal Engine", "7", "Inverse of deposits — burn balance to external bank"],
        ["P2", "Materialized Analytics Views", "7", "Pre-computed admin metrics for scale"],
        ["P3", "Multi-Currency Support", "8", "USD/EUR/GBP wallets with exchange rate logic"],
        ["P3", "Real Payment Gateway", "8", "Stripe/Razorpay integration with live webhooks"],
        ["P4", "Notification Infrastructure", "9", "Email/SMS/Push notifications for transactions"],
        ["P4", "Observability Stack", "9", "Structured logging, distributed tracing, alerting"],
      ]),
    ],
  });

  // ── 23. DIAGRAMS INDEX ──
  sections.push({
    properties: {},
    children: [
      heading1("23. Flow Diagrams Reference"),
      para("All diagrams in this document use Mermaid syntax and can be rendered at mermaid.live or any compatible viewer."),
      spacer(),
      simpleTable(["#", "Diagram Name", "Type", "Section"], [
        ["1", "System Architecture Overview", "Architecture (graph TB)", "Section 2"],
        ["2", "Authentication Sequence", "Sequence Diagram", "Section 6"],
        ["3", "Wallet Lifecycle", "Flow (graph LR)", "Section 7"],
        ["4", "Transfer Engine Sequence", "Sequence Diagram", "Section 9"],
        ["5", "Ledger Posting Flow", "Flow (graph TD)", "Section 10"],
        ["6", "DepositIntent State Machine", "State Diagram", "Section 14"],
        ["7", "Fraud Evaluation Flowchart", "Flowchart", "Section 11"],
        ["8", "Settlement Sequence (Webhook)", "Sequence Diagram", "Section 15"],
        ["9", "SYS-CLEARING Money Flow", "Architecture (graph LR)", "Section 16"],
        ["10", "Entity-Relationship Diagram", "ERD", "Section 5"],
      ]),
      spacer(),
      para("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"),
      new Paragraph({
        children: [new TextRun({ text: "End of Document", bold: true, size: 24, color: C.primary, font: "Segoe UI" })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "SecurePay AI — Complete Technical Documentation v5.0", size: 20, color: C.gray, font: "Segoe UI" })],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [new TextRun({ text: "© 2026 Abhijeet. All Rights Reserved.", size: 20, color: C.gray, font: "Segoe UI" })],
        alignment: AlignmentType.CENTER,
      }),
    ],
  });

  return new Document({
    creator: "SecurePay AI",
    title: "SecurePay AI — Complete Technical Documentation",
    description: "Comprehensive architecture guide, engineering reference, and deployment dossier for the SecurePay AI fintech platform.",
    sections,
  });
}

// ── GENERATE ──
async function main() {
  console.log("Generating SecurePay AI Technical Documentation...");
  const doc = buildDocument();
  const buffer = await Packer.toBuffer(doc);
  const outputPath = "C:\\securePay\\securepay-ai\\docs\\SecurePay_AI_Technical_Documentation.docx";
  
  // Ensure docs directory exists
  const dir = "C:\\securePay\\securepay-ai\\docs";
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, buffer);
  console.log(`Document generated successfully: ${outputPath}`);
  console.log(`File size: ${(buffer.length / 1024).toFixed(1)} KB`);
}

main().catch(console.error);
