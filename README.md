# Finance Manager

Finance Manager is a  **full‑stack financial management system** designed to demonstrate **real‑world backend architecture patterns**, including **JWT authentication**, **role‑based access control (RBAC)**, **PostgreSQL Row Level Security (RLS)**, **soft deletes**, and **layered security enforcement**.

This project showcases how enterprise-grade access control can be implemented **at both the application and database layers**, ensuring security even if one layer is compromised.

**Live Demo:**  
https://finance-data-processing-and-access-six.vercel.app  

**API Base URL:**  
https://finance-data-processing-and-access-ldri.onrender.com  

---

## Project Overview

Organizations handling financial data require strict access control — not every user should be able to view, modify, or delete sensitive records.

This system provides a **secure, role-aware financial platform** where:

- **Admins** fully manage users and financial records  
- **Analysts** analyze data and view trends  
- **Viewers** access read-only dashboards and summaries  

Access rules are enforced **twice**:
1. **Application layer (Express middleware)**
2. **Database layer (PostgreSQL Row Level Security)**

---

## Key Features

### Authentication & Authorization
- Stateless **JWT-based authentication**
- Role-based authorization: `viewer`, `analyst`, `admin`
- Token expiry with configurable lifespan

### User Management (Admin Only)
- Create, update, deactivate, and delete users
- Secure password hashing with bcrypt
- Email uniqueness enforced at the database level

### Financial Records Management
- Track income and expenses
- Categorization and notes support
- **Soft deletes** using `deleted_at` (no data loss)
- Pagination and filtering by type, category, and date range

### Financial Dashboard
- Total income, expenses, and net balance
- Category-wise aggregation
- Monthly and weekly financial trends
- Recent activity feed

### Defense-in-Depth Security
- Express middleware blocks unauthorized access early
- PostgreSQL RLS **re-validates permissions at query time**
- Unauthorized queries are rejected even if API logic is bypassed

---

## Tech Stack

### Backend
- **Node.js + Express** — REST API
- **PostgreSQL (Supabase)** — relational database
- **pg (node-postgres)** — connection pooling
- **jsonwebtoken** — JWT authentication
- **bcryptjs** — password hashing
- **express-validator** — request validation
- **dotenv** — environment configuration

### Frontend
- **React 19 + TypeScript**
- **Vite** — build tool
- **React Router v7**
- Axios-based API client with auth headers

### Infrastructure
- **Render** — backend hosting
- **Vercel** — frontend hosting
- **Supabase** — PostgreSQL with RLS

---

## 🧠 Architecture Overview

```
React Frontend (Vercel)
│
│  HTTPS + Bearer JWT
▼
Express REST API (Render)
│
│  authenticate → authorize → validate
▼
PostgreSQL (Supabase)
│
│  Row Level Security Policies
▼
Secure Financial Data
```

### Request Lifecycle
1. Client sends request with `Authorization: Bearer <JWT>`
2. JWT is verified and user info is loaded
3. User role and ID are set as PostgreSQL session variables
4. Express middleware validates role access
5. PostgreSQL RLS policies enforce permissions at query time
6. Response is returned to the client

---

## Project Structure

```
finance-api/
├── migrations/        # Schema, RLS policies, login bypass
├── src/
│   ├── middleware/   # Auth & validation
│   ├── modules/      # Auth, users, records, dashboard
│   └── config/       # Database setup
├── seed.js            # Demo data seeding
└── .env.example

finance-frontend/
├── src/
│   ├── pages/        # Login, Dashboard, Records, Users
│   ├── components/
│   └── AuthContext
└── .env.example
```

---

## Data Model

### users
| Column | Type | Notes |
|------|------|------|
| id | SERIAL | Primary Key |
| email | VARCHAR | Unique |
| role | VARCHAR | viewer / analyst / admin |
| is_active | BOOLEAN | Soft disable |
| created_at | TIMESTAMPTZ | |

### financial_records
| Column | Type | Notes |
|------|------|------|
| amount | NUMERIC(15,2) | > 0 |
| type | VARCHAR | income / expense |
| deleted_at | TIMESTAMPTZ | Soft delete |
| created_by | INTEGER | FK → users(id) |

---

## Role-Based Access Control

| Action | Viewer | Analyst | Admin |
|------|------|------|------|
| View dashboard | ✅ | ✅ | ✅ |
| View records | ✅ | ✅ | ✅ |
| Modify records | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

---

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL (Supabase recommended)

### Backend
```bash
cd finance-api
npm install
npm run migrate
node seed.js
npm run dev
```

### Frontend
```bash
cd finance-frontend
npm install
npm run dev
```

---

## Demo Accounts

| Role | Email | Password |
|----|----|----|
| Admin | admin@example.com | Admin@123 |
| Analyst | analyst@example.com | Analyst@123 |
| Viewer | viewer@example.com | Viewer@123 |

---

##  Key Design Decisions

- **Dual-layer authorization** ensures maximum security
- **RLS-first mindset** — the database never trusts the application blindly
- **SECURITY DEFINER login function** bypasses RLS only where absolutely required
- **Session pooler** used to preserve RLS session variables
- **Stateless JWT authentication** for scalability
- **Soft deletes** preserve auditability

---

## Ideal Use Cases

- Backend portfolio project
- RBAC & RLS learning reference
- Secure SaaS API architecture blueprint
- Interview-ready system design example
