# Vamanan Enterprises V (Institutional Gold Vault)

Vamanan Enterprises V is a high-fidelity, sovereign financial suite designed for multi-tier gold asset management, automated diurnal yield protocols, and secure institutional fiscal auditing. 

The platform features a **Cinematic Landing Interface**, a **Command-Grade Admin Audit Suite**, and a **Robust PHP-REST Backend** with a self-healing database architecture.

---

## 🏛️ Institutional Features

- **Live Market Synchronization**: Real-time integration with global gold exchanges (XAU/INR) featuring automated 10-minute synchronization and direct TradingView chart validation.
- **Cinematic Landing Portal**: High-end landing page with real-time market tickers, military-grade security matrices, and dynamic institutional performance metrics.
- **Automated Yield Protocol**: Proprietary "1% Diurnal Yield" engine that processes daily cashback and 5-tier referral commissions with real-time transaction telemetry.
- **Digital Ratification Workflow**: Secure, multi-party agreement protocol requiring Advocate Ratification and Partner Verification for all institutional gold contracts.
- **Advanced Audit Command Center**:
  - **Cashback Reports**: Premium gold-black dashboard with monthly/daily yield tracking and automated liability forecasting.
  - **Withdrawal Registry**: Secure liquidity bridge with status monitoring (Pending/Approved/Failed) and real-time alert nodes.
  - **Payout Analytics**: Institutional disbursement ledger with bank-grade artifact tracking (IFSC, A/C No) and daily velocity charts.
- **Staff Permission Matrix**: Granular role-based access control (RBAC) allowing administrators to toggle module access for specific support personnel.
- **Self-Healing Database Matrix**: Zero-config database initialization that automatically constructs schemas and relationships on first request, including automated migrations for new fiscal parameters.

---

## 🛠️ Technology Stack

### Frontend (Institutional Interface)
- **React.js (Vite)**: Core framework for high-throughput UI performance.
- **TailwindCSS**: Utility-first styling for a premium, custom-branded gold-black design system.
- **Framer Motion**: Cinematic micro-animations, de-blur transitions, and smooth state transitions.
- **Lucide React**: Vector-based institutional icon set.
- **Axios**: High-frequency real-time data polling (30s intervals) with automated retry logic.

### Backend (Sovereign Core)
- **PHP 8.0+ (REST API)**: High-performance backend nodes for transactional logic and market synchronization.
- **MySQL (InnoDB)**: Relational data persistence with ACID compliance and wallet-centric join logic.
- **PDO**: Secure, prepared-statement driven database layer.
- **Market Sync Engine**: Automated background fetcher for international gold spot prices.

---

## 🚀 Deployment & Initialization

### 1. Prerequisites
- **XAMPP / WAMP** (PHP 8.0+, MySQL 8.0+)
- **Node.js** (v18.0+) & **npm**

### 2. Implementation Steps
1.  **Repository Setup**:
    ```bash
    git clone https://github.com/anantha-ctrl/Vamanan-Enterprises-2.0.git
    cd Vamanan-Enterprises-2.0
    ```
2.  **Server Configuration**:
    - Move the root folder to your local server directory (e.g., `C:\xampp\htdocs\Makkal_Gold`).
    - Start **Apache** and **MySQL** via XAMPP.
3.  **Database Provisioning**:
    - The system utilizes a **Self-Healing Matrix**. 
    - Simply visit `http://localhost/Makkal_Gold/api/config.php` in your browser. The system will automatically build the `makkal_gold` database and all required tables.
4.  **Frontend Activation**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
    - The portal will be live at `http://localhost:5173`.

---

## 📂 Institutional Node Structure

```
Makkal_Gold/
│
├── api/                    # Sovereign Core Backend
│   ├── admin/              # Administrative Audit & Sync Endpoints
│   ├── auth/               # Secure Authentication Nodes
│   ├── cron/               # Automated Yield Engines (Daily Protocol)
│   ├── customer/           # Investor-Facing Data & Ratification Nodes
│   ├── models/             # Fiscal Business Logic (Wallet, Cycle)
│   ├── config.php          # Self-Healing DB Config
│   └── config/             # DB and Mail Protocols
│
├── frontend/               # Institutional React Portal
│   ├── src/                
│   │   ├── components/     # Reusable UI Frameworks (Header, Sidebar)
│   │   ├── pages/          # High-Fidelity Views (Dashboard, Reports, etc.)
│   │   └── assets/         # Local Institutional Branding Artifacts
│   └── vite.config.js      
│
└── README.md               # Institutional Documentation
```

---

## 📡 Operational Maintenance

- **Market Sync**: The system background-syncs with global gold rates every 10 minutes. Manual sync can be triggered via the **SYNC MARKET** protocol in the Admin dashboard.
- **Daily Protocol**: Manually trigger the yield engine via the Admin Dashboard or call `/api/cron/process_cashback.php`.
- **High-Frequency Polling**: Dashboards are synchronized every 30 seconds to ensure zero-latency data viewing.
- **Export Protocols**: All fiscal registries support high-fidelity CSV and Ledger exports for external auditing.

---

## ⚖️ Legal & Governance

© 2026 Vamanan Enterprises V. Developed by [CloudHawk](https://cloudhawk.in/). 
Institutional Assets protected by AES-256 Encryption. Distributed under the MIT License.
