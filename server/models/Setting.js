import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      trim: true,
      default: "",
    },
    storePhone: {
      type: String,
      trim: true,
      default: "",
    },
    storeAddress: {
      type: String,
      trim: true,
      default: "",
    },
    footerText: {
      type: String,
      trim: true,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model("Setting", settingSchema);

export default Setting;