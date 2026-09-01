import express from "express";
import { getTaskDetails, getTaskComments, addTaskComment } from "../controllers/taskController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/:id", getTaskDetails);
router.get("/:id/comments", getTaskComments);
router.post("/:id/comments", addTaskComment);

export { router as taskRouter };
