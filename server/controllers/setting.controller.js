import Setting from "../models/Setting.js";
import User from "../models/User.js";

export const getMySettings = async (req, res) => {
  try {
    let settings = await Setting.findOne({ createdBy: req.user._id });

    if (!settings) {
      settings = await Setting.create({
        createdBy: req.user._id,
        storeName: "",
        storePhone: "",
        storeAddress: "",
        footerText: "",
        vatRate: 18,
      });
    }

    return res.status(200).json(settings);
  } catch (err) {
    console.error("getMySettings error:", err);
    return res.status(500).json({ message: "שגיאה בטעינת ההגדרות." });
  }
};

export const updateMySettings = async (req, res) => {
  try {
    const { storeName, storePhone, storeAddress, footerText, logoBase64, vatRate } = req.body;

    // בדיקת גודל לוגו לפני שמירה (מניעת Base64 ענקי)
    if (logoBase64 && logoBase64.length > 2_000_000) {
      return res.status(400).json({ message: "הלוגו גדול מדי. השתמש בתמונה קטנה יותר (עד 1.5MB)." });
    }

    let settings = await Setting.findOne({ createdBy: req.user._id });

    const vatNum = vatRate !== undefined ? Number(vatRate) : undefined;
    if (vatNum !== undefined && (isNaN(vatNum) || vatNum < 0 || vatNum > 100)) {
      return res.status(400).json({ message: "אחוז מע\"מ לא תקין." });
    }

    if (!settings) {
      settings = await Setting.create({
        createdBy: req.user._id,
        storeName:    storeName?.trim()    || "",
        storePhone:   storePhone?.trim()   || "",
        storeAddress: storeAddress?.trim() || "",
        footerText:   footerText?.trim()   || "",
        logoBase64:   logoBase64           || "",
        vatRate:      vatNum               ?? 18,
      });
    } else {
      settings.storeName    = storeName?.trim()    || "";
      settings.storePhone   = storePhone?.trim()   || "";
      settings.storeAddress = storeAddress?.trim() || "";
      settings.footerText   = footerText?.trim()   || "";
      if (logoBase64 !== undefined) settings.logoBase64 = logoBase64;
      if (vatNum !== undefined)     settings.vatRate    = vatNum;
      await settings.save();
    }

    return res.status(200).json({ message: "ההגדרות נשמרו בהצלחה.", settings });
  } catch (err) {
    console.error("updateMySettings error:", err);
    return res.status(500).json({ message: "שגיאה בשמירת ההגדרות." });
  }
};

export const updateSecuritySettings = async (req, res) => {
  try {
    const { currentPassword, newPassword, newLockCode } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "המשתמש לא נמצא." });
    }

    if (!currentPassword?.trim()) {
      return res.status(400).json({ message: "יש להזין את הסיסמה הנוכחית." });
    }

    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ message: "הסיסמה הנוכחית שגויה." });
    }

    if (!newPassword?.trim() && !newLockCode?.trim()) {
      return res.status(400).json({ message: "יש להזין סיסמה חדשה או קוד נעילה חדש." });
    }

    if (newPassword?.trim()) {
      if (newPassword.trim().length < 6) {
        return res.status(400).json({ message: "הסיסמה החדשה חייבת להכיל לפחות 6 תווים." });
      }
      user.password = newPassword.trim();
    }

    if (newLockCode?.trim()) {
      if (newLockCode.trim().length < 4) {
        return res.status(400).json({ message: "קוד הנעילה חייב להכיל לפחות 4 תווים." });
      }
      user.lockCode = newLockCode.trim();
    }

    await user.save();

    return res.status(200).json({ message: "הגדרות האבטחה עודכנו בהצלחה." });
  } catch (err) {
    console.error("updateSecuritySettings error:", err);
    return res.status(500).json({ message: "שגיאה בעדכון הגדרות האבטחה." });
  }
};
