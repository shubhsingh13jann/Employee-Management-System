# ⚙️ Employee Management System — Backend API Server

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white&style=flat-square)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white&style=flat-square)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?logo=mysql&logoColor=white&style=flat-square)](https://www.mysql.com/)
[![JWT](https://img.shields.io/badge/JWT-Protected-000000?logo=jsonwebtokens&logoColor=white&style=flat-square)](https://jwt.io/)

This directory houses the RESTful API microservice powering the **Enterprise Employee Management System (EMS)**. Built with Node.js and Express 5, it handles stateless JWT session authentication, role-based access control (RBAC), multi-level leave approvals, sprint task delegation, and MySQL relational queries with connection pooling.

---

## 🚀 Key Modules & Capabilities

- **4-Tier Role-Based Access Control**:
  - Middleware guards (`verifyToken`, `authorizeRoles`) restricting routes to `admin`, `manager`, `supervisor`, and `employee`.
- **Relational Data Integrity**:
  - Parameterized SQL execution via `mysql2` preventing SQL injection vulnerabilities.
  - Foreign key constraints linking departments, managers, supervisors, and employees.
- **Dynamic Task & Sprint Delegation**:
  - Multi-tier task decomposition (Projects ➔ Tasks ➔ Comments).
  - Contextual two-way discussion message threads attached directly to tasks.
- **Two-Step Leave Hierarchy**:
  - Routine leave processing by Supervisors; escalated leave processing by Department Managers and Admins.

---

## 🛠️ Scripts & Local Development

### Prerequisites
- Node.js >= 18.0.0
- MySQL Server >= 8.0

### Installation
```bash
# Install backend dependencies
npm install
```

### Database Initialization
```bash
# Import relational schema and tables
mysql -u root -p < schema.sql
```

### Environment Configuration
Copy the provided `.env.example` to `.env` and fill in your local credentials:
```bash
cp .env.example .env
```

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Listening port for Express | `3000` |
| `DB_HOST` | MySQL host address | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | Database username | `root` |
| `DB_PASSWORD` | Database password | `your_mysql_password` |
| `DB_NAME` | Schema database name | `employeems` |
| `JWT_SECRET` | Secret key for JWT signing | `your_strong_secret` |
| `CLIENT_URL` | Frontend origin for CORS | `http://localhost:5173` |

### Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs backend in development mode with `nodemon` hot reloading |
| `npm start` | Starts production server with auto-seeding |
| `npm run seed` | Explicitly triggers database seeding utility |

---

## 📁 Source Layout

```plaintext
Server/
├── config/         # Database connection pool setup (db.js)
├── controllers/    # Route handler logic (admin, manager, supervisor, employee, auth, task)
├── middleware/     # JWT authentication and authorization gate middleware
├── routes/         # Modular route declarations
├── utils/          # Database seeding scripts and password helpers
├── schema.sql      # DDL database schema definitions
├── .env.example    # Environment variable template
├── index.js        # Server bootstrap entrypoint
└── package.json
```

For the complete project blueprint and client documentation, refer to the [Root README](../README.md).

