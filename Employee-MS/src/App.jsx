import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Layout from "./components/common/Layout";

import Login from "./pages/Login";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import Departments from "./pages/admin/Departments";
import UserManagement from "./pages/admin/UserManagement";
import HierarchyMapping from "./pages/admin/HierarchyMapping";

// Manager Pages
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ProjectsManager from "./pages/manager/ProjectsManager";
import DepartmentSupervisors from "./pages/manager/DepartmentSupervisors";
import ManagerLeaves from "./pages/manager/ManagerLeaves";

// Supervisor Pages
import SupervisorDashboard from "./pages/supervisor/SupervisorDashboard";
import SupervisorTeam from "./pages/supervisor/SupervisorTeam";
import SupervisorTasks from "./pages/supervisor/SupervisorTasks";
import SupervisorLeaves from "./pages/supervisor/SupervisorLeaves";

// Employee Pages
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeTasks from "./pages/employee/EmployeeTasks";
import EmployeeLeaves from "./pages/employee/EmployeeLeaves";
import EmployeeProfile from "./pages/employee/EmployeeProfile";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Route */}
          <Route path="/login" element={<Login />} />
          <Route path="/adminlogin" element={<Navigate to="/login" replace />} />
          <Route path="/dashboard" element={<Navigate to="/login" replace />} />

          {/* 👑 HR Admin Portal */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<Layout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="departments" element={<Departments />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="hierarchy" element={<HierarchyMapping />} />
            </Route>
          </Route>

          {/* 👔 Manager Portal */}
          <Route element={<ProtectedRoute allowedRoles={["manager", "admin"]} />}>
            <Route path="/manager" element={<Layout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ManagerDashboard />} />
              <Route path="projects" element={<ProjectsManager />} />
              <Route path="supervisors" element={<DepartmentSupervisors />} />
              <Route path="leaves" element={<ManagerLeaves />} />
            </Route>
          </Route>

          {/* 👷 Supervisor Portal */}
          <Route element={<ProtectedRoute allowedRoles={["supervisor", "manager", "admin"]} />}>
            <Route path="/supervisor" element={<Layout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<SupervisorDashboard />} />
              <Route path="team" element={<SupervisorTeam />} />
              <Route path="tasks" element={<SupervisorTasks />} />
              <Route path="leaves" element={<SupervisorLeaves />} />
            </Route>
          </Route>

          {/* 💼 Employee Portal */}
          <Route element={<ProtectedRoute allowedRoles={["employee", "supervisor", "manager", "admin"]} />}>
            <Route path="/employee" element={<Layout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<EmployeeDashboard />} />
              <Route path="tasks" element={<EmployeeTasks />} />
              <Route path="leaves" element={<EmployeeLeaves />} />
              <Route path="profile" element={<EmployeeProfile />} />
            </Route>
          </Route>

          {/* Default fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
