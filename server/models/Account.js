import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "archived"],
      default: "open",
    },
    openedAt: {
      type: Date,
      default: Date.now,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    archiveNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    zeroedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Account = mongoose.model("Account", accountSchema);

export default Account;