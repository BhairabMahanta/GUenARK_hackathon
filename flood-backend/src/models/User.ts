import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcrypt";

interface UserSettings {
  notificationsEnabled: boolean;
  alertRadius: number; // in meters
}

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: "user" | "admin" | "gmc";
  isVerified: boolean;
  verificationToken?: string;
  refreshToken?: string;
  settings: UserSettings;
  deviceTokens: string[]; // For push notifications
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

// Separate schema for nested settings object
const UserSettingsSchema = new Schema(
  {
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    alertRadius: {
      type: Number,
      default: 5000,
      min: 1000,
      max: 20000,
    },
  },
  { _id: false },
);

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["user", "admin", "gmc"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    deviceTokens: [
      {
        type: String,
      },
    ],
    settings: {
      type: UserSettingsSchema,
      default: () => ({
        notificationsEnabled: true,
        alertRadius: 5000,
      }),
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving - FIXED: Use proper async function without next callback
UserSchema.pre("save", async function (this: IUser) {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>("HackathonUser", UserSchema);
