import express from "express";
import {
  getManagerDashboard,
  getProjects,
  createProject,
  getSupervisors,
  getEscalatedLeaves,
  reviewEscalatedLeave
} from "../controllers/managerController.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken, authorizeRoles("manager", "admin"));

router.get("/dashboard", getManagerDashboard);
router.get("/projects", getProjects);
router.post("/projects", createProject);
router.get("/supervisors", getSupervisors);
router.get("/leaves", getEscalatedLeaves);
router.put("/leaves/:id/review", reviewEscalatedLeave);

export { router as managerRouter };
