# 🏦 Microfinance Core Banking & ERP System v2.0
## Technical Architecture & Software Engineering Portfolio Report

---

## 👤 1. Developer Profile & Project Overview

* **Developer Name**: Gayan Chanuka
* **Academic Profile**: 3rd-Year Software Engineering Undergraduate at SLIIT (Sri Lanka Institute of Information Technology)
* **Project Name**: MERN Stack Microfinance Core Banking & Enterprise Resource Planning (ERP) System
* **GitHub Repository**: [micro-finance-0.2](https://github.com/GayanGC/micro-finance-0.2)
* **Target Application**: 6-Month Full-Stack Software Engineering Internship Portfolio Piece

### 🎯 Project Objective
Designed and engineered a production-grade, multi-tenant capable **Microfinance Core Banking Application**. Built to solve real-world operational challenges in financial institutions, the system features a strict **Double-Entry General Ledger**, **MongoDB ACID Transactions** for financial safety, **Event-Driven Accounting Automation**, **Shift Cash Register Auditing**, **PDF Voucher Generation**, and **Automated E2E Integration Testing**.

---

## 🛠️ 2. Technology Stack

| Layer | Technology | Key Responsibilities |
|---|---|---|
| **Frontend UI** | **React (Vite)** | Responsive single-page application with modular component architecture |
| **Styling** | **Tailwind CSS & Glassmorphism** | Modern dark/light fintech theme with dynamic micro-animations |
| **Data Visualization** | **Recharts** | Real-time analytics area charts, pie charts, and monthly disbursement bar graphs |
| **Document Generation** | **jsPDF & jsPDF-AutoTable** | On-the-fly client payment receipt vouchers (A5 format) and report PDF exports |
| **Backend API** | **Node.js & Express.js** | Modular RESTful architecture with role-based middleware & audit logs |
| **Database** | **MongoDB Atlas & Mongoose** | Document-oriented storage with ACID session transactions & aggregation pipelines |
| **Security & Auth** | **JWT & Bcrypt.js** | Multi-role RBAC authentication (Email/Phone login) with bearer tokens |
| **Testing** | **Jest & Supertest** | Automated end-to-end API integration test suite covering full financial flow |

---

## 📦 3. Core System Modules & Technical Depth

### 3.1 👥 Customer & Hierarchy Management
* **3-Tier Organizational Structure**: Classifies borrowers under **Branch $\rightarrow$ Center $\rightarrow$ Group** for structured field officer collection routes.
* **KYC & Risk Profiling**: Tracks verification states (`Verified`, `Pending`, `Rejected`), calculates internal Credit Scores (0–100), tags risk categories (`Low`, `Medium`, `High`, `Very High`), and assigns CRIB tiers (`A`, `B`, `C`, `D`).
* **Blacklist Protection**: Built-in safeguards to flag defaulting borrowers and prevent unauthorized loan issuance.

### 3.2 💳 Loan Engine & Amortization
* **Dynamic Loan Product Rules**: Configurable interest rates, loan terms, grace periods, and interest calculation formulas (**Flat Rate** vs. **Reducing Balance**).
* **Multi-Stage Approval Workflow**: Enterprise approval workflow (`Agent Review` $\rightarrow$ `Credit Officer Review` $\rightarrow$ `Branch Manager Disbursement`).

### 3.3 📘 Core Accounting & Double-Entry General Ledger
* **Custom Chart of Accounts**: Supports 5 standard ledger account types: **Assets**, **Liabilities**, **Equity**, **Income**, and **Expenses**.
* **Strict Double-Entry Bookkeeping**: Every transaction requires equal Debit ($+$) and Credit ($-$) movements.
* **Atomic MongoDB Session Transactions**: Uses `mongoose.startSession()` and `session.withTransaction()` to ensure ledger account balances and journal entries update atomically or roll back completely on failure.

### 3.4 ⚡ Event-Driven Accounting Automation
* **Disbursement Trigger**: Automatically posts a journal entry upon loan disbursement:
  $$\text{Debit: Loans Principal Receivable (Asset +)} \quad \text{and} \quad \text{Credit: Cash Vault / Bank (Asset -)}$$
* **Repayment Trigger**: Automatically posts a journal entry upon EMI repayment:
  $$\text{Debit: Cash Vault (Asset +)} \quad \text{and} \quad \text{Credit: Loans Receivable (Asset -)} \quad + \quad \text{Credit: Penalty Revenue (Income +)}$$

### 3.5 💵 Cashier Desk & Shift Session Management
* **Daily Cash Float Auditing**: Cashiers open shifts with a starting cash float ($) and close shifts with a physical cash count.
* **Real-Time Expected Cash Calculation**: Dynamically aggregates all payments collected during the open shift window:
  $$\text{Expected Cash} = \text{Starting Float} + \text{Live Collections}$$
* **Variance & Discrepancy Tracking**: Automatically flags cash overages (surplus) or shortages during drawer closure.

### 3.6 📊 Analytics & Reporting Engine
* **MongoDB Aggregation Pipelines**: Multi-stage aggregation pipelines (`$match`, `$group`, `$sum`, `$year`, `$month`) powering live analytics dashboards.
* **Multi-Format Export**: One-click generation of **PDFs**, **Excel (.xlsx)**, and **CSV** spreadsheets for Portfolio, Collection, Outstanding PAR, and P&L statements.

### 3.7 🧪 Automated End-to-End Testing
* **Full-Cycle API Test Suite**: Automated 6-step integration test script (`backend/tests/e2eFlow.test.js`) validating the entire financial pipeline from Shift Open $\rightarrow$ Customer Registration $\rightarrow$ Loan Disbursement $\rightarrow$ Payment Collection $\rightarrow$ Ledger Verification $\rightarrow$ Shift Close.

---

## 🗄️ 4. Database Architecture & Schema Relationships

```
 ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
 │     User     │◄───────┤ CashRegister │         │   Customer   │
 │ (Staff/RBAC) │         └──────────────┘         └──────┬───────┘
 └──────┬───────┘                                         │
        │                                                 ▼
        │                 ┌──────────────┐         ┌──────────────┐
        ├────────────────►│  Repayment   │◄───────┤     Loan     │
        │                 └──────────────┘         └──────────────┘
        │
        ▼
 ┌──────────────┐         ┌──────────────┐
 │ JournalEntry │────────►│   Account    │
 └──────────────┘         └──────────────┘
```

### Entity Summary
1. **User**: Staff credentials, roles (`Admin`, `Agent`, `credit_officer`, `auditor`, `Customer`), and JWT auth.
2. **Customer**: Borrower profile, identity (NIC, Phone), credit score, risk tag, and hierarchy (`branch`, `center`, `group`).
3. **Policy**: Loan product rules, interest rates, calculation type, and repayment duration.
4. **Loan**: Active/historical loan records referencing `Customer` & `Policy`, tracking `principalAmount`, `totalPayable`, and `remainingBalance`.
5. **Repayment**: Individual collection records referencing `Loan` & `Customer` with receipt vouchers (`REC-XXXXX`).
6. **Account**: Ledger accounts in Chart of Accounts (`1010 Vault Cash`, `1100 Loan Receivables`, `4010 Interest Revenue`, etc.).
7. **JournalEntry**: Balanced double-entry transactions referencing `debitAccount` & `creditAccount`.
8. **CashRegister**: Shift drawer sessions tracking `startingBalance`, `closingBalance`, `expectedBalance`, and `status`.

---

## 💡 5. Technical Achievements & Highlights

1. **ACID Financial Integrity**: Implemented MongoDB Session Transactions (`session.withTransaction`) to guarantee zero balance mismatch errors across multi-document ledger operations.
2. **Zero-Touch Accounting Automation**: Shifted ledger accounting from manual entry to event-driven execution, automatically creating balanced journal entries upon loan disbursements and payment receipts.
3. **Advanced Database Queries**: Constructed multi-stage MongoDB aggregation pipelines for real-time risk bucket metrics (`PAR30`, `PAR60`, `PAR90+`), financial statements, and monthly trend analytics.
4. **Shift Cash Security**: Built a complete cashier session drawer management module to track float cash and detect drawer discrepancies during shift closure.
5. **Production-Ready Test Coverage**: Authored an automated E2E API integration test suite using **Jest** and **Supertest** to continuously verify the full financial lifecycle.

---

## 🚀 6. How to Run the System Locally

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Run End-to-End Integration Tests
```bash
cd backend
npm run test:e2e
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

*Report Generated for internship evaluation — Microfinance Core Banking & ERP System v2.0*
