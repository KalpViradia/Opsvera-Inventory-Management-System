# Opsvera — Inventory & ERP Management System

A comprehensive, multi-tenant Enterprise Resource Planning (ERP) and Inventory Management System built with a modern web stack. Opsvera provides an end-to-end suite covering granular inventory tracking, sales & procurement lifecycle, manufacturing, core accounting, and a real-time notification engine.

---

## 📂 Project Structure

```
Opsvera-Inventory-Management-System/
├── opsvera/              # Main Next.js web application (frontend + API)
├── opsvera-socket/       # Socket.IO server for real-time notifications
```

| Directory | Description |
|-----------|-------------|
| **`opsvera/`** | Next.js 16 App Router application — handles the UI, server actions, Prisma ORM, and REST/auth APIs. |
| **`opsvera-socket/`** | Standalone Node.js + Express + Socket.IO server for pushing real-time, room-based notifications to connected clients. |

---

## 🌟 Key Features

- **Multi-Tenant Architecture** — Secure, isolated environments for multiple organizations with a guided onboarding wizard.
- **Role-Based Access Control (RBAC)** — Granular permissions across `Admin`, `Manager`, `User`, `Accountant`, and `Viewer` roles.
- **Inventory & Catalog** — Products, variants, categories, multi-warehouse support, batch/serial tracking, and threshold alerts.
- **Sales & Fulfillment** — Quotations → Sales Orders → Shipments → Invoicing → Payments.
- **Procurement** — Purchase Orders → Goods Receipt Notes → Purchase Invoices → Supplier Payments.
- **Manufacturing** — Bill of Materials, Production Orders, and automated stock adjustments.
- **Core Accounting** — Chart of Accounts, double-entry journal, automated ledger posting, and financial reporting.
- **Audit Trail** — Comprehensive activity logging for compliance and accountability.
- **Real-Time Engine** — WebSocket-powered live notifications isolated per company.

---

## 💻 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui, Lucide Icons, Framer Motion |
| **Backend** | Next.js Server Actions, Node.js, Express |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | Better Auth (email/password + Google OAuth) |
| **Real-time** | Socket.IO |
| **Validation** | TypeScript, Zod |
| **Testing** | Vitest (unit), Playwright (E2E) |
| **PDF** | @react-pdf/renderer |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** database
- **npm** (package manager)

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/Opsvera-Inventory-Management-System.git
cd Opsvera-Inventory-Management-System
```

### 2. Set Up the Main Application (`opsvera/`)

```bash
cd opsvera
npm install
```

Copy `.env.example` to `.env` and configure your database URL and auth secrets:

```bash
cp .env.example .env
```

Set up the database:

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

Start the development server:

```bash
npm run dev
```

The app will be available at **http://localhost:3000**.

### 3. Set Up the Socket Server (`opsvera-socket/`)

In a **separate terminal**:

```bash
cd opsvera-socket
npm install
cp .env.example .env
npm run dev
```

The socket server will run on **http://localhost:3001**.

---

## 🧪 Running Tests

```bash
cd opsvera

# Unit tests
npm run test:unit

# E2E tests
npm run test:e2e

# All tests
npm test
```

---

## 📄 License

Proprietary. All rights reserved.
