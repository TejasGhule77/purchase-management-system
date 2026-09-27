# Simple Purchase Management System — Mini Project

A **small, simple, functional Purchase Management System** built with the **MERN Stack** (MongoDB, Express.js, React.js, Node.js) as a college mini project.

---

## 📌 Project Objective

To provide an end-to-end purchasing lifecycle management tool that allows an organization to create purchase requests, collect manager approvals, gather supplier quotations, generate purchase orders, log physical goods receipts, and record vendor payment settlements.

---

## 🔄 Main Workflow

```text
Purchase Request (Employee)
       ↓
Manager Approval (Manager)
       ↓
Supplier Quotations (Purchase Officer)
       ↓
Select Supplier Quotation (Purchase Officer)
       ↓
Purchase Order Generation (Purchase Officer)
       ↓
Goods Receipt Recording (Purchase Officer)
       ↓
Payment Recording (Purchase Officer)
       ↓
Completed
```

---

## 🚀 Key Requirements & Modules

1. **Purchase Requests Module**: Employees create purchase requests (`PR-001...`) with item name, description, quantity, estimated price, reason, and required date. Status starts as `PENDING`.
2. **Approvals Module**: Managers review pending requisitions and can **Approve** (`PENDING → APPROVED`) or **Reject** (`PENDING → REJECTED`) with an optional rejection reason.
3. **Supplier Module**: Purchase Officers manage the supplier directory with name, contact person, phone, email, and address.
4. **Supplier Quotation Module**: Purchase Officers add vendor bids (`QT-001...`) for approved purchase requests, compare pricing, and select the winning quotation (`SELECTED` vs `NOT SELECTED`).
5. **Purchase Order Module**: Purchase Officers generate Purchase Orders (`PO-001...`) with unit price and total amount (`Quantity × Unit Price`). Status transitions: `CREATED → RECEIVED → COMPLETED`.
6. **Goods Receipt Module**: Purchase Officers record physical shipments (`GR-001...`) against a PO with received quantity, tracking remaining pending quantities.
7. **Payment Module**: Purchase Officers record payment disbursements (`PAY-001...`) via Bank Transfer, Cheque, or Cash. Once payment is recorded as `PAID`, PO status becomes `COMPLETED`.
8. **Simple Dashboard**: Summary metric cards for Purchase Requests, Pending Approvals, Purchase Orders, Goods Receipts, and Payments, along with a recent purchase requests list.

---

## 👥 User Roles & Access Control

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Employee** | `employee@test.com` | `password123` | Create & view own purchase requests, track status |
| **Manager** | `manager@test.com` | `password123` | Review pending purchase requests, Approve or Reject |
| **Purchase Officer** | `purchase@test.com` | `password123` | Manage suppliers, quotations, POs, goods receipts, and payments |

---

## 🛠️ Technology Stack

* **Frontend**: React.js (Vite), Tailwind CSS, React Router, Axios, Lucide Icons
* **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT (JSON Web Tokens), bcryptjs

---

## 🗄️ Database Collections

* `users`: `name`, `email`, `password`, `role` (`EMPLOYEE`, `MANAGER`, `PURCHASE_OFFICER`)
* `purchaseRequests`: `requestNumber`, `employee`, `itemName`, `description`, `quantity`, `estimatedPrice`, `reason`, `requiredDate`, `status` (`PENDING`, `APPROVED`, `REJECTED`), `rejectionReason`, `createdAt`
* `suppliers`: `name`, `contactPerson`, `phone`, `email`, `address`
* `quotations`: `quotationNumber`, `purchaseRequest`, `supplier`, `itemName`, `quantity`, `quotedPrice`, `deliveryDate`, `remarks`, `status` (`PENDING`, `SELECTED`, `NOT SELECTED`)
* `purchaseOrders`: `poNumber`, `purchaseRequest`, `quotation`, `supplier`, `itemName`, `quantity`, `unitPrice`, `totalAmount`, `orderDate`, `expectedDeliveryDate`, `status` (`CREATED`, `RECEIVED`, `COMPLETED`)
* `goodsReceipts`: `receiptNumber`, `purchaseOrder`, `receivedQuantity`, `receiptDate`, `remarks`
* `payments`: `paymentNumber`, `purchaseOrder`, `supplier`, `amount`, `paymentDate`, `paymentMethod`, `status` (`PENDING`, `PAID`), `remarks`

---

## 💻 How to Install & Run Locally

### 1. Prerequisites
* Node.js (v18+)
* MongoDB (Running locally on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI)

### 2. Backend Setup
```bash
cd server
npm install
node src/seeds/seed.js   # Seed sample demo users, suppliers, and requests
npm run dev              # Starts backend server on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev              # Starts frontend Vite dev server on http://localhost:5173
```

---

## 🎯 Demonstration Walkthrough (Placement / Viva Demo)

1. **Step 1 — Employee**:
   * Login as `employee@test.com` / `password123`.
   * Create a purchase request for **Office Chairs** (Quantity: 10, Estimated Price: ₹50,000, Reason: "New computer lab setup").
   * Request status is set to `PENDING`.
2. **Step 2 — Manager**:
   * Switch role to `manager@test.com` / `password123`.
   * Open **Approvals** queue, view request details, and click **Approve** (`PENDING → APPROVED`).
3. **Step 3 — Purchase Officer**:
   * Switch role to `purchase@test.com` / `password123`.
   * Open **Suppliers** to review verified vendors (**ABC Office Solutions**, **XYZ Furniture**).
   * Open **Quotations** to add vendor bids (ABC: ₹46,000, XYZ: ₹48,000).
   * Click **Select Bid** for ABC Office Solutions (`SELECTED`).
4. **Step 4 — Create Purchase Order**:
   * Open **Purchase Orders**, click **Create Purchase Order**, select the winning quotation, and enter Unit Price (₹4,600).
   * Generates `PO-001` (Total Amount: ₹46,000, Status: `CREATED`).
5. **Step 5 — Goods Receipt**:
   * Open **Goods Receipts**, record delivery of 10 chairs from ABC Office Solutions.
   * PO status becomes `RECEIVED`.
6. **Step 6 — Record Payment**:
   * Open **Payments**, record settlement of ₹46,000 via **Bank Transfer**.
   * PO status transitions to `COMPLETED`.
