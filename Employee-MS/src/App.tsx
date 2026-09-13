import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
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

// 👑 Lazy-Loaded Admin Pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Departments = lazy(() => import("./pages/admin/Departments"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const HierarchyMapping = lazy(() => import("./pages/admin/HierarchyMapping"));

// 👔 Lazy-Loaded Manager Pages
const ManagerDashboard = lazy(() => import("./pages/manager/ManagerDashboard"));
const ProjectsManager = lazy(() => import("./pages/manager/ProjectsManager"));
const DepartmentSupervisors = lazy(() => import("./pages/manager/DepartmentSupervisors"));
const ManagerLeaves = lazy(() => import("./pages/manager/ManagerLeaves"));

// 👷 Lazy-Loaded Supervisor Pages
const SupervisorDashboard = lazy(() => import("./pages/supervisor/SupervisorDashboard"));
const SupervisorTeam = lazy(() => import("./pages/supervisor/SupervisorTeam"));
const SupervisorTasks = lazy(() => import("./pages/supervisor/SupervisorTasks"));
const SupervisorLeaves = lazy(() => import("./pages/supervisor/SupervisorLeaves"));

// 💼 Lazy-Loaded Employee Pages
const EmployeeDashboard = lazy(() => import("./pages/employee/EmployeeDashboard"));
const EmployeeTasks = lazy(() => import("./pages/employee/EmployeeTasks"));
const EmployeeLeaves = lazy(() => import("./pages/employee/EmployeeLeaves"));
const EmployeeProfile = lazy(() => import("./pages/employee/EmployeeProfile"));

const AnimatedAppContent = () => {
  const location = useLocation();

  return (
    <>
      <TopLaserBar />
      <AnimatePresence mode="wait">
        <PageTransition key={location.pathname}>
          <Routes location={location}>
            {/* Public Landing & Auth Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login initialMode="login" />} />
            <Route path="/signup" element={<Login initialMode="signup" />} />
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
