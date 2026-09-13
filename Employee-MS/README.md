# 🎨 Employee Management System — Frontend Client

[![React 19](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react&logoColor=black&style=flat-square)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white&style=flat-square)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white&style=flat-square)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-3D%20Spatial-000000?logo=threedotjs&logoColor=white&style=flat-square)](https://threejs.org/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?logo=bootstrap&logoColor=white&style=flat-square)](https://getbootstrap.com/)

This directory houses the modern, high-performance web client for the **Enterprise Employee Management System (EMS)**. Built with React 19, TypeScript, and Vite, the frontend features an interactive 3D spatial companion bot, liquid SVG portal transitions, and role-tailored dashboards across all four organizational tiers.

---

## 🚀 Key Modules & Capabilities

- **Interactive 3D Spatial Authentication**:
  - Three.js companion bot with real-time eye and head kinematics following user cursor coordinates.
  - Volumetric lighting atmosphere that dynamically reacts to selected employee roles.
  - Button-originated liquid geometry SVG portal reveal transitions (`RadialRevealTransition.tsx`).
- **4-Tier Dedicated Dashboards**:
  - `admin/`: Executive KPI telemetry, Department CRUD, User Onboarding, and Hierarchy Mapping.
  - `manager/`: Department performance, project milestone allocation, supervisor squad oversight, escalated leave approvals.
  - `supervisor/`: Sprint progress, granular task delegation, blocker resolution threads, routine leave reviews.
  - `employee/`: Personal sprint queue, interactive ticket status updates, self-service leave submission, profile management.
- **Route Authorization Guard**:
  - Role-guarded route protection (`ProtectedRoute.tsx`) blocking unauthorized navigation based on JWT claims.

---

## 🛠️ Scripts & Local Development

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
```bash
# Install client dependencies
npm install
```

### Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Launches the Vite development server with HMR at `http://localhost:5173` |
| `npm run build` | Runs TypeScript type checking and produces optimized production bundles in `dist/` |
| `npm run preview` | Locally serves the production build for testing |
| `npm run lint` | Executes ESLint across all TypeScript and React source files |

---

## ⚙️ Environment Configuration

By default, the client communicates with the backend on `http://localhost:3000`. To customize the backend endpoint, create a `.env` file in this directory:

```ini
VITE_API_BASE_URL=http://localhost:3000
```

---

## 📁 Source Layout

```plaintext
src/
├── api/            # Axios instance and API call abstractions
├── assets/         # Static visual assets, brand icons, and textures
├── Components/
│   ├── auth/       # 3D Companion Bot, Kinematics, Volumetric Atmosphere
│   └── common/     # Modals, Sidebar, Navigation, and Portal Transitions
├── context/        # Authentication context and role state management
├── pages/
│   ├── admin/      # Super Admin views
│   ├── manager/    # Department Manager views
│   ├── supervisor/ # Operational Supervisor views
│   ├── employee/   # Contributor views
│   ├── LandingPage.tsx # Interactive Product Showcase
│   └── Login.tsx   # Unified Multi-Role Auth Hub
├── App.tsx         # Route router and overlay portals
└── main.tsx        # React 19 entrypoint
```

For the complete project blueprint and backend service documentation, refer to the [Root README](../README.md).
