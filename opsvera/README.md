# Opsvera - Advanced Inventory & ERP System

Opsvera is a comprehensive, multi-tenant Enterprise Resource Planning (ERP) and Inventory Management System designed to streamline operations for modern businesses. It provides an end-to-end suite covering everything from granular inventory tracking to financial accounting, backed by a modern web stack and a real-time notification engine.

---

## 🌟 Core Features & Modules

### 1. Multi-Tenant Architecture & Global Settings
* **Company Isolation**: Secure, separate environments for multiple organizations.
* **Onboarding Wizard**: Guided setup for company details, preferences, and initial team invitations.
* **Global Configuration**: Set global defaults such as currency, timezone, and fiscal year start. The UI dynamically adjusts to your chosen currency.
* **Custom Fields**: Define dynamic, custom metadata fields for Customers, Suppliers, Products, and other entities to suit specific business needs.

### 2. Advanced Role-Based Access Control (RBAC)
* **Granular Permissions**: Restrict or grant access to `read`, `write`, `delete`, and `manage` actions per module.
* **Predefined Roles**: Supports tailored access roles including `Admin`, `Manager`, `User`, `Accountant`, and `Viewer`.
* **Dynamic UI**: Action buttons, forms, and pages automatically hide or disable themselves based on the active user's permissions.

### 3. Comprehensive Inventory & Catalog
* **Product Catalog**: Manage products, variants, categories, and distinct units of measure.
* **Multi-Warehouse Support**: Track inventory accurately across multiple physical locations.
* **Batch & Serial Tracking**: Complete lifecycle tracking for specific batches (expiration dates) and individual serial-numbered items.
* **Stock Operations**: Handle Goods Receipts, Issues, and Stock Adjustments. Automatically calculate and update moving Average Costs.
* **Threshold Alerts**: Set minimum stock levels and receive warnings when stock falls below thresholds.

### 4. Sales & Fulfillment Lifecycle
* **Sales Workflow**: Draft, review, and confirm Quotations and Sales Orders.
* **Dynamic Pricing Lists**: Apply different pricing tiers (e.g., Wholesale, Retail, VIP) seamlessly during order creation.
* **Shipment & Delivery**: Create picking lists, fulfill orders via shipments, and track delivery statuses.
* **Invoicing & Payments**: Generate PDF invoices, apply custom tax rates/discounts, and log partial or full payments.

### 5. Procurement & Supplier Management
* **Purchase Orders**: Manage procurement workflows from request to received goods.
* **Supplier Profiles**: Store detailed profiles including payment terms, bank details, and performance ratings.
* **Goods Receipt Notes (GRN)**: Seamlessly update warehouse stock immediately upon supplier delivery.
* **Purchase Invoices**: Track supplier bills, manage payable accounts, and log outbound payments.

### 6. Manufacturing & Production
* **Bill of Materials (BOM)**: Create detailed recipes and sub-assemblies for finished goods.
* **Production Orders**: Track manufacturing runs from `Planned` to `In Progress` to `Completed`.
* **Automated Stock Adjustments**: Automatically deduct raw material stock and increment finished goods stock upon production completion.

### 7. Core Accounting & Finance
* **Chart of Accounts (COA)**: Manage structured accounts across Assets, Liabilities, Equity, Revenue, and Expenses.
* **Double-Entry Journal**: Create manual journal entries ensuring debits and credits always balance.
* **Automated Ledger Posting**: Key business activities (like confirming an invoice or receiving stock) can automatically post corresponding journal entries.
* **Financial Reporting**: Track real-time business health, receivables, and payables.

### 8. Audit & Activity Tracking
* **Comprehensive Logs**: Every major action (Creations, Updates, Deletions, State Changes) is recorded.
* **Audit Trail**: Admins can review the complete history of system changes, providing full accountability and transparency for compliance.

### 9. Real-Time Engine (opsvera-socket)
* **WebSocket Integration**: Pushes live notifications to clients for critical events (e.g., stock running low, high-value orders placed).
* **Room-Based Updates**: Ensures real-time events are strictly isolated to the specific company's active users.

---

## 💻 Technologies Used

* **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS, shadcn/ui, Lucide Icons.
* **Backend**: Next.js Server Actions, Node.js, Express.
* **Database**: PostgreSQL with Prisma ORM.
* **Real-time**: Socket.IO.
* **Validation & Types**: TypeScript, Zod.
* **PDF Generation**: @react-pdf/renderer.

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher)
* PostgreSQL Database

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env` and configure your Database URL and NextAuth secret.

3. **Database Setup**:
   Generate the Prisma client, push the schema, and seed the initial data:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run seed
   ```

4. **Start the Next.js Client & API**:
   ```bash
   npm run dev
   ```

5. **Start the WebSocket Server**:
   In a separate terminal window, navigate to `opsvera-socket` and run:
   ```bash
   npm run dev
   ```

The web application will be accessible at `http://localhost:3000`.

---

## 📄 License
Proprietary. All rights reserved.
