import express from "express";
import {
  login,
  verify2FA,
  resend2FA,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  logout,
  getCurrentUser,
  register,
  getPublicDepartments
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { uploadAvatar } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/departments", getPublicDepartments);
router.post("/register", uploadAvatar.single("image"), register);
router.post("/login", login);
router.post("/verify-2fa", verify2FA);
router.post("/resend-2fa", resend2FA);
router.post("/forgot-password", forgotPassword);
router.get("/verify-reset-token/:token", verifyResetToken);
router.post("/reset-password", resetPassword);
router.post("/logout", logout);
router.get("/me", verifyToken, getCurrentUser);

export { router as authRouter };
