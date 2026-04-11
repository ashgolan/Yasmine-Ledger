import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    type: {
      type: String,
      enum: ["debt", "payment", "return"],
      required: true,
    },
    date: {
      type: Date,
      required: [true, "יש להזין תאריך"],
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      default: null,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    quantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    unitPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    amount: {
      type: Number,
      required: [true, "יש להזין סכום"],
    },
    note: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
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
transactionSchema.index({ createdBy: 1, customer: 1 });
transactionSchema.index({ account: 1 });
transactionSchema.index({ customer: 1, type: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;