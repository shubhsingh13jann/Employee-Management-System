import express from "express";
import {
  getStats,
  getDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
  decommissionDepartment,
  getDecommissionPreview,
  getEligibleHeads,
  getDepartmentRoster,
  getDepartmentTransfers,
  getGlobalTransfers,
  transferMember,
  batchTransferMembers,
  getUsers,
  getAvailableSupervisors,
  getUserDetails,
  addUser,
  updateUser,
  deleteUser,
  broadcastAnnouncement,
  getUserDocuments,
  uploadUserDocument,
  updateUserDocumentStatus,
  deleteUserDocument,
  getHierarchy,
  assignHierarchy,
  reassignHierarchy,
  unlinkHierarchy,
  getAdminProjects,
  createAdminProject,
  updateAdminProjectStatus,
  updateAdminProject,
  deleteAdminProject,
  getAdminSupervisorsCapacity,
} from "../controllers/adminController.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all admin routes for role 'admin'
router.use(verifyToken, authorizeRoles("admin"));

router.get("/stats", getStats);

// Department & Leadership Management Routes
router.get("/departments", getDepartments);
router.get("/departments/eligible-heads", getEligibleHeads);
router.get("/departments/transfers/global", getGlobalTransfers);
router.get("/departments/:id/decommission-preview", getDecommissionPreview);
router.post("/departments", addDepartment);
router.post("/departments/:id/decommission", decommissionDepartment);
router.post("/departments/transfer-member", transferMember);
router.post("/departments/batch-transfer", batchTransferMembers);
router.get("/departments/:id/roster", getDepartmentRoster);
router.get("/departments/:id/transfers", getDepartmentTransfers);
router.put("/departments/:id", updateDepartment);
router.delete("/departments/:id", deleteDepartment);

// Workforce Management Routes
router.get("/users", getUsers);
router.get("/users/supervisors", getAvailableSupervisors);
router.get("/users/:id", getUserDetails);
router.post("/users", addUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.post("/broadcast", broadcastAnnouncement);

// Employee Document & Contract Vault Routes
router.get("/users/:id/documents", getUserDocuments);
router.post("/users/:id/documents", uploadUserDocument);
router.put("/users/:id/documents/:docId/status", updateUserDocumentStatus);
router.delete("/users/:id/documents/:docId", deleteUserDocument);

router.get("/hierarchy", getHierarchy);
router.post("/hierarchy", assignHierarchy);
router.put("/hierarchy/reassign", reassignHierarchy);
router.delete("/hierarchy/:employeeId", unlinkHierarchy);

// Enterprise Projects & Strategic Milestones Routes (Section 5)
router.get("/projects", getAdminProjects);
router.post("/projects", createAdminProject);
router.put("/projects/:id/status", updateAdminProjectStatus);
router.put("/projects/:id", updateAdminProject);
router.delete("/projects/:id", deleteAdminProject);
router.get("/projects/supervisors-capacity", getAdminSupervisorsCapacity);

export { router as adminRouter };
