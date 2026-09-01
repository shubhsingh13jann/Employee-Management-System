import express from "express";
import {
  getSupervisorDashboard,
  getTeamMembers,
  getSupervisorTasks,
  createTask,
  getRoutineLeaves,
  reviewRoutineLeave
} from "../controllers/supervisorController.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken, authorizeRoles("supervisor", "manager", "admin"));

router.get("/dashboard", getSupervisorDashboard);
router.get("/team", getTeamMembers);
router.get("/tasks", getSupervisorTasks);
router.post("/tasks", createTask);
router.get("/leaves", getRoutineLeaves);
router.put("/leaves/:id/review", reviewRoutineLeave);

export { router as supervisorRouter };
