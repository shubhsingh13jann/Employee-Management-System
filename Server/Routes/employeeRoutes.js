import express from "express";
import {
  getEmployeeDashboard,
  getMyTasks,
  updateTaskStatus,
  getMyLeaves,
  applyLeave,
  getEmployeeProfile
} from "../controllers/employeeController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/dashboard", getEmployeeDashboard);
router.get("/tasks", getMyTasks);
router.put("/tasks/:id/status", updateTaskStatus);
router.get("/leaves", getMyLeaves);
router.post("/leaves", applyLeave);
router.get("/profile", getEmployeeProfile);

export { router as employeeRouter };
