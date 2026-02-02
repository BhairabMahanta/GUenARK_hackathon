import { Request, Response } from "express";
import User from "../models/User";
import tokenService from "../services/token.service";
import emailService from "../services/email.service";
import { asyncHandler } from "../middleware/asyncHandler";
import { AppError } from "../middleware/errorHandler";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

class AuthController {
  // Register new user
  register = asyncHandler(async (req: Request, res: Response) => {
    const { username, email, password, role = "user" } = req.body;

    // Validation
    if (!username || !email || !password) {
      throw new AppError("All fields are required", 400);
    }

    // Check existing user
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      throw new AppError(
        "User with this email or username already exists",
        400,
      );
    }

    // Validate role
    if (role === "gmc" || role === "admin") {
      // For hackathon, allow but could add admin key check
      // if (req.body.adminKey !== process.env.ADMIN_KEY) {
      //   throw new AppError('Invalid admin key', 403);
      // }
    }

    // Generate verification token
    const verificationToken = tokenService.generateVerificationToken();

    // Create user
    const newUser = new User({
      username,
      email,
      password,
      role,
      verificationToken,
      isVerified: process.env.NODE_ENV === "development", // Auto-verify in dev
    });

    await newUser.save();

    // Send verification email
    await emailService.sendVerificationEmail(
      email,
      username,
      verificationToken,
    );

    res.status(201).json({
      success: true,
      message:
        "User registered successfully. Please check your email to verify your account.",
      userId: newUser._id,
      ...(process.env.NODE_ENV === "development" && { otp: verificationToken }),
    });
  });

  // Verify email with OTP
  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ email, verificationToken: otp });
    if (!user) {
      throw new AppError("Invalid verification code", 400);
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    const tokens = tokenService.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await tokenService.saveToken(user._id.toString(), tokens.refreshToken);

    res.json({
      success: true,
      message: "Email verified successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        settings: user.settings,
      },
      ...tokens,
    });
  });

  // Resend verification
  resendVerification = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await User.findOne({ email, isVerified: false });
    if (!user) {
      throw new AppError("User not found or already verified", 400);
    }

    const verificationToken = tokenService.generateVerificationToken();
    user.verificationToken = verificationToken;
    await user.save();

    await emailService.sendVerificationEmail(
      email,
      user.username,
      verificationToken,
    );

    res.json({
      success: true,
      message: "Verification email resent successfully",
      ...(process.env.NODE_ENV === "development" && { otp: verificationToken }),
    });
  });

  // Login
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    if (!user.isVerified) {
      throw new AppError(
        "Email not verified. Please verify your email first.",
        403,
      );
    }

    const tokens = tokenService.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await tokenService.saveToken(user._id.toString(), tokens.refreshToken);

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        settings: user.settings,
      },
      ...tokens,
    });
  });

  // Refresh token
  refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError("Refresh token is required", 401);
    }

    const userData = tokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await tokenService.findToken(refreshToken);

    if (!userData || !tokenFromDb) {
      throw new AppError("Invalid refresh token", 401);
    }

    const user = await User.findById(userData.userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const tokens = tokenService.generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await tokenService.saveToken(user._id.toString(), tokens.refreshToken);

    res.json({
      success: true,
      ...tokens,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        settings: user.settings,
      },
    });
  });

  // Logout
  logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Get userId from authenticated request (via middleware)
    const userId = req.user?.userId;

    if (userId) {
      // Remove all tokens for this user
      await tokenService.removeToken(userId);
    }

    const { refreshToken } = req.body;
    if (refreshToken) {
      try {
        const userData = tokenService.validateRefreshToken(refreshToken);
        if (userData && userData.userId !== userId) {
          await tokenService.removeToken(userData.userId);
        }
      } catch (error) {
        // Ignore validation errors during logout
      }
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  });

  // Request password reset
  requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Security: Don't reveal if email exists
      res.json({
        success: true,
        message:
          "If this email exists, you will receive a password reset code.",
      });
      return;
    }

    const resetToken = tokenService.generateVerificationToken();

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    await emailService.sendPasswordResetEmail(email, user.username, resetToken);

    res.json({
      success: true,
      message: "Password reset code sent to your email",
      ...(process.env.NODE_ENV === "development" && { otp: resetToken }),
    });
  });

  // Verify password reset OTP
  verifyPasswordResetOTP = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
      passwordResetToken: otp,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError("Invalid or expired reset code", 400);
    }

    res.json({
      success: true,
      message: "Reset code verified. You can now reset your password.",
      email: user.email,
    });
  });

  // Reset password
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp, newPassword } = req.body;

    if (newPassword.length < 6) {
      throw new AppError("Password must be at least 6 characters long", 400);
    }

    const user = await User.findOne({
      email,
      passwordResetToken: otp,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError("Invalid or expired reset code", 400);
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message:
        "Password reset successfully. You can now login with your new password.",
    });
  });

  // Get user profile
  getUserProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const user = await User.findById(userId).select(
      "-password -refreshToken -verificationToken -passwordResetToken",
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        settings: user.settings,
        deviceTokens: user.deviceTokens,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  });

  // Update user settings
  updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { notificationsEnabled, alertRadius } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const updates: any = {};
    if (notificationsEnabled !== undefined) {
      updates["settings.notificationsEnabled"] = notificationsEnabled;
    }
    if (alertRadius !== undefined) {
      if (alertRadius < 1000 || alertRadius > 20000) {
        throw new AppError("Alert radius must be between 1km and 20km", 400);
      }
      updates["settings.alertRadius"] = alertRadius;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      settings: user.settings,
    });
  });

  // Register device token for push notifications
  registerDeviceToken = asyncHandler(
    async (req: AuthRequest, res: Response) => {
      const { deviceToken } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      if (!deviceToken) {
        throw new AppError("Device token is required", 400);
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Add token if not already exists
      if (!user.deviceTokens.includes(deviceToken)) {
        user.deviceTokens.push(deviceToken);
        await user.save();
      }

      res.json({
        success: true,
        message: "Device token registered successfully",
      });
    },
  );

  // Remove device token
  removeDeviceToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { deviceToken } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    user.deviceTokens = user.deviceTokens.filter(
      (token) => token !== deviceToken,
    );
    await user.save();

    res.json({
      success: true,
      message: "Device token removed successfully",
    });
  });
}

export default new AuthController();
