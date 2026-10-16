import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Layout from "./components/common/Layout";
import PageTransition from "./components/common/PageTransition";
import TopLaserBar from "./components/common/TopLaserBar";
import ErrorBoundary from "./Components/common/ErrorBoundary";
import SuspenseFallback from "./Components/common/SuspenseFallback";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import { useAuth } from "./context/AuthContext";
import { MandatoryPasswordChangeModal } from "./Components/auth/MandatoryPasswordChangeModal";

// Safe lazy-loader with auto-recovery for dynamic module import failures (e.g. HMR or chunk update)
const lazyWithRetry = <T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) => {
  return lazy(async () => {
    try {
      return await factory();
    } catch (error: any) {
      const isDynamicImportError =
        error?.message?.includes("Failed to fetch dynamically imported module") ||
        error?.message?.includes("Importing a module script failed") ||
        error?.name === "ChunkLoadError";

      if (isDynamicImportError) {
        const hasRefreshed = sessionStorage.getItem("chunk_retry_refreshed") === "true";
        if (!hasRefreshed) {
          sessionStorage.setItem("chunk_retry_refreshed", "true");
          window.location.reload();
          return new Promise<{ default: T }>(() => {});
        }
        sessionStorage.removeItem("chunk_retry_refreshed");
      }
      throw error;
    }
  });
};

// 💤 Lazy-Loaded Admin Pages
const AdminDashboard = lazyWithRetry(() => import("./pages/admin/AdminDashboard"));
const Departments = lazyWithRetry(() => import("./pages/admin/Departments"));
const UserManagement = lazyWithRetry(() => import("./pages/admin/UserManagement"));
const HierarchyMapping = lazyWithRetry(() => import("./pages/admin/HierarchyMapping"));
const AdminProjects = lazyWithRetry(() => import("./pages/admin/AdminProjects"));

// 💤 Lazy-Loaded Manager Pages
const ManagerDashboard = lazyWithRetry(() => import("./pages/manager/ManagerDashboard"));
const ProjectsManager = lazyWithRetry(() => import("./pages/manager/ProjectsManager"));
const DepartmentSupervisors = lazyWithRetry(() => import("./pages/manager/DepartmentSupervisors"));
const ManagerLeaves = lazyWithRetry(() => import("./pages/manager/ManagerLeaves"));

// 💤 Lazy-Loaded Supervisor Pages
const SupervisorDashboard = lazyWithRetry(() => import("./pages/supervisor/SupervisorDashboard"));
const SupervisorTeam = lazyWithRetry(() => import("./pages/supervisor/SupervisorTeam"));
const SupervisorTasks = lazyWithRetry(() => import("./pages/supervisor/SupervisorTasks"));
const SupervisorLeaves = lazyWithRetry(() => import("./pages/supervisor/SupervisorLeaves"));

// 💤 Lazy-Loaded Employee Pages
const EmployeeDashboard = lazyWithRetry(() => import("./pages/employee/EmployeeDashboard"));
const EmployeeTasks = lazyWithRetry(() => import("./pages/employee/EmployeeTasks"));
const EmployeeLeaves = lazyWithRetry(() => import("./pages/employee/EmployeeLeaves"));
const EmployeeProfile = lazyWithRetry(() => import("./pages/employee/EmployeeProfile"));

const AnimatedAppContent = () => {
  const location = useLocation();
  const { user, refreshUser } = useAuth();
  const mustChangePassword = Boolean(user?.must_change_password);

  const isAuthRoute =
    location.pathname === "/" ||
    location.pathname === "/login" ||
    location.pathname === "/signup" ||
    location.pathname === "/adminlogin" ||
    location.pathname === "/dashboard" ||
    location.pathname.startsWith("/reset-password");
  
  // FIX: Group all internal dashboard routes under a single transition key 
  // so the Layout, Sidebar, and Navbar do not unmount and refresh on sub-page clicks.
  const transitionKey = isAuthRoute ? "auth-root" : "dashboard-root";

  return (
    <>
      <TopLaserBar />
      {mustChangePassword && (
        <MandatoryPasswordChangeModal
          isOpen={mustChangePassword}
          onSuccess={refreshUser}
        />
      )}
      <AnimatePresence mode="wait">
        <PageTransition key={transitionKey} transitionKey={transitionKey}>
          <Routes location={location}>
            {/* Public Landing & Auth Routes (LandingPage persists underneath Auth overlay) */}
            <Route path="/" element={<LandingPage />}>
              <Route path="login" element={<Login initialMode="login" />} />
              <Route path="signup" element={<Login initialMode="signup" />} />
            </Route>
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/adminlogin" element={<Navigate to="/login" replace />} />
            <Route path="/dashboard" element={<Navigate to="/login" replace />} />

            {/* 👑 HR Admin Portal */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route
                path="/admin"
                element={
                  <ErrorBoundary fallbackTitle="Admin Portal Error">
                    <Suspense fallback={<SuspenseFallback label="Loading Admin Dashboard..." />}>
                      <Layout />
                    </Suspense>
                  </ErrorBoundary>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="departments" element={<Departments />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="hierarchy" element={<HierarchyMapping />} />
                <Route path="projects" element={<AdminProjects />} />
              </Route>
            </Route>

            {/* 👔 Manager Portal */}
            <Route element={<ProtectedRoute allowedRoles={["manager", "admin"]} />}>
              <Route
                path="/manager"
                element={
                  <ErrorBoundary fallbackTitle="Manager Portal Error">
                    <Suspense fallback={<SuspenseFallback label="Loading Manager Dashboard..." />}>
                      <Layout />
                    </Suspense>
                  </ErrorBoundary>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<ManagerDashboard />} />
                <Route path="projects" element={<ProjectsManager />} />
                <Route path="supervisors" element={<DepartmentSupervisors />} />
                <Route path="leaves" element={<ManagerLeaves />} />
              </Route>
            </Route>

            {/* 👷 Supervisor Portal */}
            <Route element={<ProtectedRoute allowedRoles={["supervisor", "admin"]} />}>
              <Route
                path="/supervisor"
                element={
                  <ErrorBoundary fallbackTitle="Supervisor Portal Error">
                    <Suspense fallback={<SuspenseFallback label="Loading Supervisor Dashboard..." />}>
                      <Layout />
                    </Suspense>
                  </ErrorBoundary>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<SupervisorDashboard />} />
                <Route path="team" element={<SupervisorTeam />} />
                <Route path="tasks" element={<SupervisorTasks />} />
                <Route path="leaves" element={<SupervisorLeaves />} />
              </Route>
            </Route>

            {/* 💼 Employee Portal */}
            <Route element={<ProtectedRoute allowedRoles={["employee", "admin"]} />}>
              <Route
                path="/employee"
                element={
                  <ErrorBoundary fallbackTitle="Employee Portal Error">
                    <Suspense fallback={<SuspenseFallback label="Loading Employee Portal..." />}>
                      <Layout />
                    </Suspense>
                  </ErrorBoundary>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<EmployeeDashboard />} />
                <Route path="tasks" element={<EmployeeTasks />} />
                <Route path="leaves" element={<EmployeeLeaves />} />
                <Route path="profile" element={<EmployeeProfile />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PageTransition>
      </AnimatePresence>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatedAppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
