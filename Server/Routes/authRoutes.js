import express from "express";
import { login, logout, getCurrentUser } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/me", verifyToken, getCurrentUser);

export { router as authRouter };
