import express from "express";
import {
  getStats,
  getDepartments,
  addDepartment,
  deleteDepartment,
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
router.get("/departments", getDepartments);
router.post("/departments", addDepartment);
router.delete("/departments/:id", deleteDepartment);

router.get("/users", getUsers);
router.post("/users", addUser);
router.delete("/users/:id", deleteUser);

router.get("/hierarchy", getHierarchy);
router.post("/hierarchy", assignHierarchy);

export { router as adminRouter };
