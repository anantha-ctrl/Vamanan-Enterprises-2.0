# Vamanan Enterprises V — Complete Project Documentation

> Institutional gold / product **cashback platform** (Makkal Gold engine) built on **PHP + MySQL** (REST API) and **React + Vite + TailwindCSS** (SPA), running on XAMPP.
>
> This document covers the system end-to-end: architecture, database, roles, every feature module, the full API surface, business rules, setup, and the build history.

---

## 1. Overview

Vamanan Enterprises V is a multi-role platform where customers **buy gold / silver / products**, and the system pays them a **daily cashback (“yield”)** over a cycle, plus **referral commissions** through a multi-level genealogy. Admins/managers/staff run operations (KYC, approvals, payouts, inventory, reports), and everything is **GST-compliant** and **Tally-exportable**.

**Core value flow**
1. Customer places an order → pays a **GST-inclusive** invoice.
2. System generates a **CGST/SGST tax invoice** and auto-creates a **cashback application / cycle**.
3. Admin authorizes the cycle → daily yield accrues on the **ex-GST product amount only**.
4. Referral commissions are credited up the genealogy, also on the ex-GST base.
5. Payouts are reconciled and exported (Excel / Tally).

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 4, TailwindCSS 3, Framer Motion 10, Lucide icons, Axios, React Router 6 |
| Backend | PHP 8 (procedural REST endpoints), PDO |
| Database | MySQL / MariaDB (InnoDB), schema `makkal_gold` |
| Server | XAMPP (Apache + MySQL) on Windows |
| Accounting | Tally integration (XML voucher export + offline fallback) |

**Key versions:** react `^18.2.0`, vite `^4.2.0`, tailwindcss `^3.3.1`, axios `^1.3.5`, framer-motion `^10.12.4`, react-router-dom `^6.10.0`.

---

## 3. Architecture

```
Browser (React SPA, :5173 dev)
   │  Axios  →  /api/*  and  /uploads/*  (Vite proxy → http://localhost/Vamanan1)
   ▼
Apache / PHP  (d:/xampp/htdocs/Vamanan1/api/*.php)
   │  PDO
   ▼
MySQL  (database: makkal_gold)
```

### 3.1 Dual DB config layer
Two PHP DB layers both point at the **same** `makkal_gold` database:

- **`api/config.php`** — exposes global `$pdo` (and `$db` alias). Runs a **self-healing schema migration on every request**: `CREATE TABLE IF NOT EXISTS` + guarded `ALTER TABLE` for every column/enum, plus the **VEV ID system** (customer_id / product_code / referral codes). This is the authoritative bootstrap.
- **`api/config/db.php`** — a `Database` class used by some newer endpoints.

> Because DDL (`CREATE`/`ALTER`) triggers an implicit COMMIT in MySQL, any table-creation must run **before** `beginTransaction()`, never inside a transaction.

### 3.2 Vite dev proxy
`frontend/vite.config.js` proxies `/api` **and** `/uploads` to `http://localhost/Vamanan1` so the SPA and PHP share an origin in development.

### 3.3 Conventions
- Passwords are stored as **plain text** (stated project convention).
- IDs: customers `VEV###`, products `VEVP###`, referral codes `VEV` + 5 alphanumerics.
- Intra-state GST split: **CGST = SGST = GST/2**.

---

## 4. Roles & Access Control

Five roles (`users.role` enum): **admin, manager, staff, advocate, customer**.

| Role | Home | Scope |
|---|---|---|
| **admin** | `/admin` | Full access, bypasses all permission checks |
| **staff** | `/admin` | Admin nav **filtered** to permissions granted in Settings → Access Control |
| **manager** | `/manager` | Operations subset (customers, purchases, KYC, finance) |
| **advocate** | `/advocate` | Legal: agreements, members, disputes, archive |
| **customer** | `/dashboard` | Buy, cashback, referrals, wallet, KYC, profile |

- **`frontend/src/utils/accessControl.js`** — `hasPermission(user, id)`, `canAccessRoute()`, `defaultRouteForRole()`, `parsePermissions()`. Admin bypasses; staff are matched against the stored `users.permissions` (JSON/CSV) column; `ADMIN_PERMISSIONS` lists the grantable tabs.
- **`api/admin/update_permissions.php`** — persists a staff member’s permissions (admin is protected).
- The shared **Sidebar** renders per-role nav; staff get the admin nav trimmed by permission.

---

## 5. Database Schema (key tables)

All tables are created/migrated by `api/config.php`. Highlights:

### users
`id, customer_id (VEV###), name, email, password, role, kyc_status, referral_code (VEV…), referral_active, referrer_id, phone, address, aadhar_no, pan_no, kyc_document, avatar, bank_name, account_no, ifsc_code, branch_name, status, notify_email, notify_system, permissions, created_at`
- `referral_active` (TINYINT, default `1`) — admin switch to **stop/resume** a member's referral commissions; `0` makes the yield engine skip them for all referral payouts (own daily cashback unaffected).

### wallets
`id, user_id, balance, total_earned, total_withdrawn`

### products
`id, product_code (VEVP###), name, category, slug, weight, purity, price, image, description, is_active, created_at, updated_at`

### transactions
`id, wallet_id, amount, gross_amount, tds_amount, charges_amount, deduction, type(credit|debit), category, status(pending|completed|failed|rejected), description, created_at`
- `category` enum: `purchase, purchase_request, referral, cashback, payout, withdrawal, liquidation, manual, deposit, other`
- **Deduction breakdown** on incentive credits (cashback / referral): `amount` = **net** credited to the wallet, `gross_amount` = pre-deduction incentive, `tds_amount` + `charges_amount` = the two withheld components, `deduction` = their total. `NULL` where no deduction applies (purchases, withdrawals, legacy rows).

### cashback_cycles  *(the heart of the yield engine)*
`id, user_id, asset_type(gold|silver|product), weight, product_id, product_name,`
**GST split →** `product_amount, gst_amount, total_amount, cashback_eligible_amount,`
`total_value, daily_payout, days_paid, paid_amount, transaction_id, payment_method, payment_screenshot, status(active|completed|paused|pending|rejected|cancelled), last_paid_at, ledger_txn_id, created_at, updated_at`

- `cashback_eligible_amount` (= `product_amount`, **GST excluded**) is the **only** base used for cashback / referral / commission.
- `ledger_txn_id` links a cycle to its originating `transactions` row for exact approve / reject / delete.

### feedbacks  *(two-way feedback & remarks)*
`id, from_user_id, to_user_id (NULL = to company), from_role, direction('customer_to_admin'|'admin_to_customer'), subject, message, rating, is_read, created_at`

### offers  *(festival / promo banners shown on login)*
`id, title, message, image, badge, color(blue|amber|emerald|red|purple), is_active, starts_at, ends_at, created_at`

### Other tables
`withdrawals, agreements, categories, support_tickets, password_resets, login_otps, notifications, export_history`.

---

## 6. Feature Modules

### 6.1 Authentication & KYC
- Register / Login (`api/auth/*`), OTP login (`login_otps`), forgot/reset password, KYC submission + document upload, avatar upload.

### 6.2 Shop & Ordering (GST-exclusive cashback)
- **`api/shop/purchase.php`** computes **category-based GST**:
  - Gold / Silver → rate from setting **`gold_gst`** (default 3%).
  - All other products → **`general_gst`** (configurable).
- Stores `product_amount`, `gst_amount`, `total_amount`, `cashback_eligible_amount` separately.
- Customer pays the **GST-inclusive** total; **all incentives are calculated on the ex-GST product subtotal only.**
- On order: generates a **CGST/SGST tax invoice** and **auto-creates the cashback application/cycle** (with `daily_payout` = 1% of the ex-GST base); captures `ledger_txn_id`.
- **Cashback Application popup** (`CashbackApplicationModal.jsx`): immediately after a successful order, a modal opens **prefilled** with the customer's live profile + bank data (`customer/cashback_application.php` GET) and the just-placed purchase (amount, product, date). The customer completes it manually and submits (POST) to `cashback_applications`; a "Skip for now" option proceeds to WhatsApp + dashboard.
- Duplicate-submit guard: 60-second same-amount window (not a blanket pending block).
- Delivery messaging: *“Product delivered within 7 working days; payout starts within 48 hours.”*

### 6.3 Cashback / Yield Engine
- Admin **Authorize Activation** / **Reject** a cycle (`api/admin/approve_investment.php`). On activation the cycle's `daily_payout` is (re)computed as `cashback_eligible_amount × dailyRate` so dashboards/reports show the real 1% yield.
- **Process Daily Yield** (`api/admin/run_daily_payout.php`, `api/cron/daily_yield_engine.php`) credits `cashback_eligible_amount × dailyRate` to each active cycle and writes a `cashback` ledger transaction (feeds Tally).
- Referral commission credited up the genealogy on the ex-GST base. **Direct (L1) referral defaults to 1%** (`referral_commission_l1`); L2–L5 configurable in Settings.
- **TDS + service charges**: gross incentive accrues to the cycle; the wallet is credited **net** after admin-configurable `tds_rate` + `service_charge_rate`. Each ledger row records `gross_amount / tds_amount / charges_amount / deduction`.
- **Combined earnings cap (principal lock)**: a member's **cashback + referral together** cap at 100% of `cashback_eligible_amount`. Both cashback and referral increment the *same* cycle `paid_amount`; the cashback step **re-reads the live `paid_amount`** before crediting (so referral commissions credited earlier in the same pass are counted), and the cycle flips to `completed` the moment the combined total reaches the principal — **stopping payouts even before day 100**. Verified end-to-end that combined credits never exceed the principal.
- **Referral stop/resume**: the engine skips any referrer whose `users.referral_active = 0` (`api/admin/toggle_referral.php`), leaving their own daily cashback intact.

### 6.4 Genealogy / Referrals
- `api/admin/get_genealogy.php`, `api/customer/get_genealogy.php`, `api/customer/referrals.php`.
- Visual trees: `GenealogyTree.jsx`, `RecencyGenealogyTree.jsx`.

### 6.5 Wallet, Withdrawals & Payouts
- Wallet overview, transaction history, withdraw requests (`customer/request_withdrawal.php`), admin processing (`admin/process_withdrawal.php`).
- Payout tooling: **Cashback Payouts, Export Payout Excel, Payout Reconciliation, Payout Reports**.

### 6.6 Inventory & Product Requests
- Admin inventory CRUD, bulk product upload/delete, categories.
- Customers can **request a product**; admins fulfil via `advocate/update_purchase.php` / `admin/product_requests.php`.

### 6.7 GST Filing console (admin)
- **`api/admin/gst_filing.php`** returns: summary, **rate-wise slabs (GSTR-1 style)**, **invoice-wise** orders, and a months list. CSV export in the UI.

### 6.8 Tally Integration (GST-aware)
- **`api/admin/tally/_bootstrap.php`** builds GST-aware ledgers: ex-GST sales revenue + **Output CGST / SGST** ledgers, **GST Payable**, 4-leg sales voucher XML, P&L (ex-GST + GST collected), balance sheet.
- Customer ledger keyed by `customer_id`; inventory by `product_code`. Offline **XML fallback** when Tally is unreachable.

### 6.9 Bulk Add Users
- **`api/admin/bulk_add_users.php`** — accepts JSON rows **or** CSV; assigns sequential VEV id, referral code, and wallet; skips duplicate emails. UI provides a CSV template.

### 6.10 Notifications, Tickets, Reports, Market Rates
- Broadcast + per-user notifications, support tickets, admin reports (`admin/reports.php`), market rate sync.

### 6.11 Feedback & Remarks (two-way, real-time)
- Customer → company: `api/customer/submit_feedback.php` (message + star rating); reads replies via `api/customer/get_feedback.php`.
- Company → customer: `api/admin/feedback.php` — GET inbox + sent; POST `action: reply | read | delete`. A reply also inserts a `notifications` row for the customer.
- UI: `FeedbackWidget.jsx` (customer Dashboard + Profile), `AdminFeedback.jsx` (admin/staff console — inbox, compose-to-customer, sent history). Both poll every 20 s.

### 6.12 Festival Offers & Login Promotions
- Admin CRUD: `api/admin/offers.php` — GET list; POST `action: create | toggle | delete` (title, message, badge, accent `color`, optional `starts_at`/`ends_at`).
- Public feed: `api/offers/active.php` returns currently-active offers (respects the validity window).
- UI: `AdminOffers.jsx` (admin console). On login, `Login.jsx` shows active offers as a **popup after auth** and a **banner on the login page**.

### 6.13 Member Identity Surfacing (VEV IDs)
- `VEV###` member IDs are shown in: customer **Profile** (`customer/profile.php`), admin **Users** grid incl. a **Referred By** upline via self-join (`admin/all_users.php`), the **Advocate** directory (`advocate/stats.php`), and **Referral** direct + downline views (`customer/referrals.php`).

### 6.14 TDS & Service-Charge Deduction (real-time breakdown)
- Two admin-tunable rates in Settings — **TDS (%)** (`tds_rate`) and **Service / Processing Charges (%)** (`service_charge_rate`) — are withheld from every cashback and referral credit by `daily_yield_engine.php` (and the manual `admin/adjust_wallet.php` daily-payout path). Falls back to a legacy combined `tds_charges_rate` if the split keys are absent.
- Each `transactions` row stores `gross_amount / tds_amount / charges_amount / deduction`; the wallet receives the **net**.
- **Customer surfacing**: Transaction History (per-row gross · TDS · charges), Referral Network (Gross → TDS → Charges → Net card + per-txn split), and the Dashboard "Daily Payout (Net)" tile — all live.
- **Admin surfacing**: `admin/reports.php` aggregates gross/TDS/charges/deduction/net for the **Cashback** and **Referral** reports (rendered as a **Deduction Breakdown** panel in `AdminReports.jsx`), and the **Wallet Adjustment** panel shows the **final net amount credited to the customer** with a gross → TDS → charges → net breakdown (`get_user_daily_payout.php` returns `total_daily_net / total_daily_tds / total_daily_charges`).

### 6.15 Referral Stop / Resume (admin control)
- `api/admin/toggle_referral.php` sets `users.referral_active` (0 = stopped, 1 = earning) and drops a notification for the member.
- The yield engine skips paused members for referral commissions; the admin **Users** grid shows a live **● Earning / ■ Stopped** pill with a **Stop / Resume** button (optimistic update + refetch), and the member's **Referral Network** page shows a "Referral Commissions Paused" banner.

---

## 7. API Reference (by area)

> Base path in dev: `/api/…` (proxied to `http://localhost/Vamanan1/api`).

**auth/** `register, login, verify_login_otp, resend_login_otp, forgot_password, reset_password, verify_otp, update_password, update_profile, submit_kyc, seed`

**customer/** `dashboard, profile, get_profile, update_profile, upload_avatar, change_password, wallet, orders, cashback_plan, cashback_application, product_request, cancel_request, request_withdrawal, referrals, get_genealogy, agreement, sign_agreement, kyc, get_notifications, mark_notification_read, delete_notification, submit_feedback, get_feedback`

**shop/** `purchase` — **offers/** `active`

**admin/** `stats, all_users, update_user, delete_user, update_profile, add_staff, create_staff, update_permissions, adjust_wallet, wallets, investments, investment_history, approve_investment, delete_investment, cashback_applications, run_daily_payout, get_user_daily_payout, payout_history, payout_reports, reconcile_payouts, export_payouts, product_requests, products, update_product, delete_product, bulk_upload_products, bulk_delete_products, bulk_add_users, categories, normalize_categories, inventory, seed_catalog, gst_filing, withdrawals, process_withdrawal, update_withdrawal, reports, settings, sync_market_rate, broadcast, send_notification, edit_notification, delete_notification, get_all_notifications, tickets, get_genealogy, activity_logs, update_transaction, feedback, offers, toggle_referral`

**public/** `stats` — live landing metrics (partners / assets / weekly payout = real counts + marketing offsets)

**admin/tally/** `_bootstrap, data, vouchers, export, sync`

**manager/** `stats, actions` — **advocate/** `stats, actions, update_purchase`

**cron/** `daily_yield_engine, cashback_processor, process_cashback`

> `check_*`, `debug_*`, `fix_*`, `inspect_*` at the api root are **maintenance/diagnostic scripts**, not part of the app runtime.

---

## 8. Frontend Map

**Pages** (`frontend/src/pages/`)
Landing, Login, Register, Recovery · Dashboard, Shop, Referrals, Wallet, WalletOverview, TransactionHistory, WithdrawHistory, Withdrawals, Rules, KYC, Agreement, Profile, CashbackPlan, CashbackApplication, ProductRequest · AdminDashboard, AdminReports, ManagerDashboard, StaffDashboard, AdvocateDashboard, AdvocateProfile · Inventory, WalletListAdmin, CashbackPayouts, ExportPayoutExcel, PayoutReconciliation, PayoutReports, TallyExport, TallyIntegration.

**Components** `Sidebar, Header, CustomerHeader, MobileHeader, BottomNav, Loader, GenealogyTree, RecencyGenealogyTree, FeedbackWidget, AdminFeedback, AdminOffers, CashbackApplicationModal`.

**Utils** `accessControl.js` (permissions/routing), `humanLabels.js` (label formatting), `invoice.js` (`generateInvoice()`, `invoiceFromOrder()` — CGST/SGST tax invoice HTML).

**Routing** `App.jsx` — `ProtectedRoute` guards by role + optional permission; staff route to `/admin` (permission-filtered).

---

## 9. Design System / Theme

Reference palette (white base + navy + gold + vivid blue):

| Element | Color |
|---|---|
| Background | white / `slate-50` |
| Headings & dark surfaces | navy `blue-900` |
| Primary CTA buttons | vivid `blue-600` (hover `blue-700`) |
| Accent (badges, highlights, charts) | gold `amber-500 / 600` |

- Brand text: **Vamanan Enterprises V** across sidebar, headers, invoices, agreements, landing.
- Sidebar is role-aware; dark surfaces render navy app-wide; the Logout action uses a distinct **red** treatment.
- **Mobile-responsive** across all admin consoles (credential modal, Settings, Tally Integration/Export, Wallet List) and the public Landing page (tightened spacing, stacked rows, table horizontal-scroll min-widths, scrollable mobile menu).

---

## 10. Setup & Run

**Prerequisites:** XAMPP (Apache + MySQL), Node.js.

1. Place the project at `d:/xampp/htdocs/Vamanan1`.
2. Start **Apache** and **MySQL** in XAMPP. The DB `makkal_gold` and all tables are **auto-created** on the first API request (via `api/config.php`). DB credentials are set at the top of `config.php` (`root` / local password).
3. Backend is served by Apache at `http://localhost/Vamanan1/api/…`.
4. Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev      # dev server at http://localhost:5173
   npm run build    # production build → frontend/dist
   ```
5. Seeded logins: admin `admin@makkalgold.com / admin123`, manager `manager@makkalgold.com / manager123`.

> If Vite HMR websocket fails, the app still loads — do a hard refresh (`Ctrl+Shift+R`) after code changes.

---

## 11. Business Rules (quick reference)

- **GST is never part of any incentive.** Cashback, referral, and commission all use `cashback_eligible_amount` (ex-GST).
- **Category GST:** gold/silver → `gold_gst` (3% default); everything else → `general_gst`.
- **CGST = SGST = GST / 2** (intra-state).
- **Combined earnings cap:** cashback **+** referral together cap at **100% of the principal** (`cashback_eligible_amount`); payouts stop the moment the combined total is reached — even before day 100.
- **Incentive deductions:** `tds_rate` + `service_charge_rate` (default 5% + 5%) are withheld from every cashback/referral credit; the cycle accrues **gross**, the wallet receives **net**.
- **Direct referral (L1) = 1%** by default (`referral_commission_l1`); L2–L5 configurable.
- **Referral stop:** `users.referral_active = 0` pauses a member's referral commissions (own cashback continues).
- **VEV IDs** are assigned sequentially and backfilled idempotently on every request.
- A cashback cycle is tied to its ledger transaction via `ledger_txn_id` for exact approve/reject/delete and correct revenue accounting.

---

## 12. Build History (phases)

1. **Foundation** — auth, roles, wallet, products, basic cashback cycles, KYC, agreements.
2. **Referrals & genealogy** — multi-level tree, referral commissions.
3. **Payout tooling** — cashback payouts, Excel export, reconciliation, reports.
4. **Inventory & product requests** — catalog CRUD, bulk upload, customer requests.
5. **Tally export** — ledger/voucher XML.
6. **VEV ID system** — customer_id / product_code / VEV referral codes.
7. **Notifications, tickets, market rates, admin reports.**
8. **GST & compliance overhaul:**
   - Category-based GST + **GST-exclusive cashback** (product/gst/total/eligible split).
   - CGST/SGST **tax invoice** on order + dashboard view.
   - Auto-create cashback application on order.
   - **GST Filing** admin console (rate-wise + invoice-wise + CSV).
   - **GST-aware Tally** (ex-GST sales + Output CGST/SGST + GST Payable + offline XML fallback).
   - **Bulk Add Users** (CSV/JSON + template).
   - Staff recruitment + **manual permission assignment** (Access Control); staff see granted tabs.
   - Delete on Purchase History with real-time dashboard/revenue update.
   - Delivery messaging (7 working days / payout 48 hours).
   - **Rebrand** → “Vamanan Enterprises V”.
9. **Engagement suite, blue-navy rebrand & mobile hardening (current):**
   - **Two-way Feedback & Remarks** (`feedbacks` table; customer widget + admin console; 20 s polling).
   - **Festival Offers** (`offers` table; admin console; post-login popup + login banner).
   - **VEV member IDs surfaced** across Profile, Users (+ Referred-By upline), Advocate directory, Referral tree.
   - **Profile / Login / Register redesign** (name-on-white hero, referral code + join date + cashback earned, bigger logo/wordmark, offers banner).
   - **Advocate purchase totals** (live summary + grand-total footer).
   - **Blue-navy + gold theme** (white base, `blue-900` surfaces, `blue-600` primary, amber accents, red Logout).
   - **Full mobile-responsiveness pass** across admin consoles + landing page.
10. **Yield economics: deductions, principal cap, referral controls (current):**
    - **Live landing metrics** (`api/public/stats.php`): partners / assets / weekly payout = real counts + admin marketing offsets.
    - **Configurable TDS + service charges** on every cashback/referral credit (`tds_rate`, `service_charge_rate`); ledger stores `gross_amount / tds_amount / charges_amount / deduction`; net hits the wallet. Breakdown surfaced in customer (Transaction History, Referral, Dashboard) and admin (Reports, Wallet Adjustment) panels.
    - **Cashback Application popup** after checkout (`CashbackApplicationModal.jsx`) — prefilled with live profile/bank + purchase data, submitted manually.
    - **Daily-payout correctness**: cycles now store `daily_payout = 1% of the ex-GST base` (fixed a stale `= 0`), (re)computed on activation and always computed live in `get_user_daily_payout.php`; the admin Wallet Adjustment shows the **final net amount to the customer**.
    - **Direct referral (L1) set to 1%.**
    - **Referral stop/resume** admin control (`users.referral_active`, `admin/toggle_referral.php`) — engine skips paused members; member banner + notification.
    - **Combined earnings cap (principal lock)**: cashback + referral together stop at 100% of principal, even before day 100 — fixed a stale-read that could over-pay past the cap; added the customer Dashboard **Earnings Cap** panel.

---

*Last updated: 2026-07-13.*
