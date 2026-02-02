import { Router } from "express";
import authController from "../controllers/auth.controller";
import {
  authenticateToken,
  requireAdmin,
  requireGMC,
} from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.post("/register", authController.register);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

// Password reset routes
router.post("/forgot-password", authController.requestPasswordReset);
router.post("/verify-reset-otp", authController.verifyPasswordResetOTP);
router.post("/reset-password", authController.resetPassword);

// Protected routes
router.get("/profile", authenticateToken, authController.getUserProfile);
router.patch("/settings", authenticateToken, authController.updateSettings);

// Device token management
router.post(
  "/device-token",
  authenticateToken,
  authController.registerDeviceToken,
);
router.delete(
  "/device-token",
  authenticateToken,
  authController.removeDeviceToken,
);

// Test protected route
router.get("/test-protected", authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: "Protected route accessed successfully",
    user: req.user,
  });
});

export default router;
