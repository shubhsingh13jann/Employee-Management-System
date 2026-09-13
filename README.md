# 🏢 Enterprise Employee Management System (EMS)

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Three.js](https://img.shields.io/badge/Three.js-3D%20Spatial-black?logo=threedotjs&logoColor=white)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A full-stack, role-based Employee & Resource Management System built on a **4-tier organizational hierarchy** with an interactive **3D spatial interface**, real-time task workflows, and multi-level leave approval pipelines.

---

## ⚡ Core Features

- **4-Tier Organizational Governance**:
  - **👑 Super Admin (HR)**: System-wide administration, user onboarding, department lifecycle, and global analytics.
  - **👔 Department Manager**: Project milestone creation, supervisor allocation, department KPIs, and escalated leave approvals.
  - **👷 Operational Supervisor**: Daily task assignment, sprint tracking, two-way task blocker discussions, and routine leave reviews.
  - **💼 Employee**: Task execution pipeline (`pending` ➔ `in_progress` ➔ `completed`), leave applications, and personal profile management.
- **Interactive 3D UI & Spatial Portal**:
  - Real-time 3D companion character with eye/head cursor tracking built with Three.js & React Three Fiber.
  - Fluid, button-originated SVG liquid portal transitions between the landing page and authentication hub.
  - Role-reactive volumetric atmosphere and dynamic styling.
- **Enterprise Security & RBAC**:
  - Role-based protected routes (`ProtectedRoute.tsx`).
  - Stateless JWT authentication with secure HTTP-only cookies and bcrypt password hashing.
  - Parameterized MySQL queries preventing SQL injection.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, React Router v7, Framer Motion, Bootstrap 5, Three.js, Axios |
| **Backend** | Node.js, Express 5, MySQL2 (Connection Pooling), JWT, Bcrypt, Multer, CORS |
| **Database** | MySQL 8.x (Relational Schema with Foreign Keys & Cascade Integrity) |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18+)
- **MySQL** (v8+)

### 2. Database Setup
Create the database and import the relational schema:
```bash
mysql -u root -p < Server/schema.sql
```

### 3. Backend Setup
```bash
cd Server
npm install
cp .env.example .env     # Configure your local database credentials
npm run dev              # Runs server on http://localhost:3000
```

### 4. Frontend Setup
```bash
cd Employee-MS
npm install
npm run dev              # Runs client on http://localhost:5173
```

---

## ⚙️ Environment Variables

Create a `Server/.env` file based on `.env.example`:

```ini
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=employeems
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:5173
```

---

## 🔌 API Endpoints Summary

| Route Group | Base Path | Description | Access |
| :--- | :--- | :--- | :--- |
| **Auth** | `/api/auth` | Login, registration, session validation (`/me`), and logout | Public / Authenticated |
| **Admin** | `/api/admin` | Global stats, department CRUD, user management, and hierarchy mapping | Super Admin |
| **Manager** | `/api/manager` | Department dashboard, projects, supervisors, and escalated leaves | Manager, Admin |
| **Supervisor** | `/api/supervisor` | Team roster, task delegation, and routine leave approvals | Supervisor, Manager, Admin |
| **Employee** | `/api/employee` | Personal tasks, task status updates, leave applications, and profile | Authenticated Employee |
| **Tasks** | `/api/tasks` | Task details and two-way discussion comments | Authenticated Team Members |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
