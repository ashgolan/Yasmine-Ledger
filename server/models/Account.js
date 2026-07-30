import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    number: {
      type: String,
      trim: true,
      required: true,
      maxlength: 60,
    },
    amount: {
      type: Number,
      min: 0,
      default: 0,
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

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
    invoices: {
      type: [invoiceSchema],
      default: [],
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