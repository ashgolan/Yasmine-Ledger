import mongoose from "mongoose";

const settingSchema = new mongoose.Schema(
  {
    storeName:    { type: String, trim: true, default: "" },
    storePhone:   { type: String, trim: true, default: "" },
    storeAddress: { type: String, trim: true, default: "" },
    footerText:   { type: String, trim: true, default: "" },
    // הגבלה ל-2MB Base64 (קירוב: 1.5MB תמונה מקורית)
    logoBase64:   { type: String, default: "", maxlength: 2_000_000 },
    // אחוז מע"מ — ברירת מחדל 18%
    vatRate: {
      type: Number,
      default: 18,
      min: [0, "מע\"מ לא יכול להיות שלילי"],
      max: [100, "מע\"מ לא יכול לעלות על 100%"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const Setting = mongoose.model("Setting", settingSchema);
export default Setting;
