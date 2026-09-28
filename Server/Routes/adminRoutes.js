import express from "express";
import {
  getStats,
  getDepartments,
  addDepartment,
  updateDepartment,
  deleteDepartment,
  getEligibleHeads,
  getDepartmentRoster,
  getDepartmentTransfers,
  getGlobalTransfers,
  transferMember,
  batchTransferMembers,
  getUsers,
  addUser,
  deleteUser,
  getHierarchy,
  assignHierarchy
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
router.post("/departments", addDepartment);
router.post("/departments/transfer-member", transferMember);
router.post("/departments/batch-transfer", batchTransferMembers);
router.get("/departments/:id/roster", getDepartmentRoster);
router.get("/departments/:id/transfers", getDepartmentTransfers);
router.put("/departments/:id", updateDepartment);
router.delete("/departments/:id", deleteDepartment);

router.get("/users", getUsers);
router.post("/users", addUser);
router.delete("/users/:id", deleteUser);

router.get("/hierarchy", getHierarchy);
router.post("/hierarchy", assignHierarchy);

export { router as adminRouter };
