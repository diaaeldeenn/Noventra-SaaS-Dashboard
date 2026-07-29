# Noventra SaaS Dashboard

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white">
  <img src="https://img.shields.io/badge/Express.js-Framework-000000?style=for-the-badge&logo=express&logoColor=white">
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white">
  <img src="https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white">
</p>

A full-stack SaaS inventory and sales management dashboard built with React and Node.js. Designed for businesses to manage products, process sales, track employees, monitor performance, and receive real-time alerts - all from a single platform.

---

## API Documentation

[View Full Postman Documentation](https://documenter.getpostman.com/view/49715513/2sBY4SMyzX)

> Base URL: `https://noventra-backend-dashboard.vercel.app`

---

## Tech Stack

### Backend
- **Node.js** + **Express.js** - REST API
- **MongoDB** + **Mongoose** - database with full transaction support
- **Redis** - caching layer for dashboard stats and chart data
- **JWT** - stateless authentication
- **Zod** - request validation and schema enforcement
- **Cloudinary** - image upload and storage
- **Nodemailer** - transactional email (low stock alerts + daily reports)
- **node-cron** - scheduled background jobs
- **ExcelJS / PDFKit / docx** - multi-format export engine

### Frontend
> Repository: `<!-- FRONTEND REPO LINK -->`

- **React.js**
- Full details and setup instructions are available in the frontend repository linked above.

---

## Features

### Authentication & Authorization
- Role-based access control with three roles: `admin`, `manager`, `employee`
- JWT authentication on all protected routes
- Encrypted phone numbers at rest
- Admin-only employee registration and password reset
- Account activation / deactivation

### Product Management
- Full CRUD with auto-generated slugs
- Image upload per product via Cloudinary
- Category filtering, search by name or SKU, sorting, and pagination
- Manual stock adjustment (increment / decrement)
- Toggle product availability
- Low stock detection based on a configurable per-product threshold

### Sales
- Create sales invoices with multiple items in a single request
- Atomic stock deduction using **MongoDB transactions** - no race conditions
- Auto-generated invoice numbers with timestamps
- Cancel a sale and automatically restore stock via `bulkWrite` inside a transaction
- Filter sales by date range, payment method, employee, and cancellation status
- Full invoice detail view with populated product and employee data

### Audit Logs
- Every critical action is recorded automatically: product creation, updates, stock changes, sales, cancellations
- Filter logs by user, action type, target model, and date range
- Export audit logs to **Excel**, **PDF**, or **Word**

### Dashboard
- KPI summary: total revenue, profit, today's sales, month's sales, employee count, product count, low stock count
- Chart data by period: `daily`, `monthly`, `yearly`
- Redis caching with a 10-minute TTL - cache is invalidated automatically on every sale or cancellation

### Notifications
- In-app notifications sent to all admins and managers on every sale creation, cancellation, and low stock alert
- Mark a single notification as read or mark all as read
- Filter notifications by read status with pagination and unread count

### Email Alerts
- **Low stock email** sent to the admin automatically after any sale that drops a product below its threshold
- **Daily sales report email** sent every night at 23:55 via cron - includes total invoices, revenue, profit, and top-selling product

### Data Export
- Sales and audit logs exportable in three formats: **Excel (.xlsx)**, **PDF (.pdf)**, **Word (.docx)**
- Date range filtering on all exports
- Up to 5,000 records per export

---

## API Modules

| Module | Endpoints | Access |
|---|---|---|
| Auth | 5 | public / all roles |
| Users | 4 | admin, manager |
| Products | 7 | admin, manager, employee |
| Sales | 5 | admin, manager, employee |
| Audit Logs | 2 | admin, manager |
| Dashboard | 2 | admin, manager |
| Notifications | 3 | all roles |

Full API documentation available as a Postman collection in the repository.

---

## Security

- Rate limiting: 200 requests per 15 minutes per IP
- HTTP headers hardened with **Helmet**
- CORS configured
- Passwords hashed before storage
- Phone numbers encrypted at rest
- All inputs validated with **Zod** before reaching the controller

---

## Architecture Highlights

- **Service layer pattern** - controllers stay clean, all DB logic lives in `db.service.js`
- **MongoDB transactions** on all multi-document writes (sales creation, cancellation)
- **Redis cache invalidation** tied to business events, not time-based guessing
- **Audit log** created automatically inside every critical transaction
- **Cron jobs** initialized at server startup, isolated in their own service

---

## Project Structure

```
src/
├── common/
│   ├── enum/
│   ├── middleware/
│   │   └── schema/
│   └── utils/
│       ├── email/
│       ├── security/
│       └── cron.service.js
├── DB/
│   ├── models/
│   └── redis/
└── modules/
    ├── auth/
    ├── users/
    ├── products/
    ├── sales/
    ├── audit/
    ├── dashboard/
    └── notification/
```

---

## Environment Variables

```env
MONGO_URI=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
REDIS_URL=
GMAIL_USER=
GMAIL_PASS=
ADMIN_EMAIL=
DASHBOARD_CACHE_KEY=
```

---

## Getting Started

```bash
git clone https://github.com/your-username/noventra-backend.git
cd noventra-backend
npm install
cp .env.example .env
# fill in your environment variables
npm run dev
```

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the server in development mode with hot reload |
| `npm start` | Start the server in production mode |

---

## Author

**Eng. Diaa Eldeen**

<p align="left">
  <a href="https://linkedin.com/in/diaaelseady">
    <img src="https://img.shields.io/badge/LinkedIn-Diaa%20Elseady-0077B5?style=for-the-badge&logo=linkedin&logoColor=white">
  </a>
  <a href="https://github.com/diaaeldeenn">
    <img src="https://img.shields.io/badge/GitHub-diaaeldeenn-181717?style=for-the-badge&logo=github">
  </a>
  <a href="mailto:diaaelseady@gmail.com">
    <img src="https://img.shields.io/badge/Gmail-diaaelseady@gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white">
  </a>
</p>
