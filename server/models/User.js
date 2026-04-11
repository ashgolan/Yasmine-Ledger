import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "יש להזין שם משתמש"],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    password: {
      type: String,
      required: [true, "יש להזין סיסמה"],
      minlength: 6,
    },
    lockCode: {
      type: String,
      required: [true, "יש להזין קוד נעילה"],
      minlength: 4,
    },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 10);
    }

    if (this.isModified("lockCode")) {
      this.lockCode = await bcrypt.hash(this.lockCode, 10);
    }

    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = function (value) {
  return bcrypt.compare(value, this.password);
};

userSchema.methods.compareLockCode = function (value) {
  return bcrypt.compare(value, this.lockCode);
};

const User = mongoose.model("User", userSchema);

export default User;