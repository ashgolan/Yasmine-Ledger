import Setting from "../models/Setting.js";
import User from "../models/User.js";

export const getMySettings = async (req, res) => {
  let settings = await Setting.findOne({ createdBy: req.user._id });

  if (!settings) {
    settings = await Setting.create({
      createdBy: req.user._id,
      storeName: "",
      storePhone: "",
      storeAddress: "",
      footerText: "",
    });
  }

  return res.status(200).json(settings);
};

export const updateMySettings = async (req, res) => {
  const { storeName, storePhone, storeAddress, footerText } = req.body;

  let settings = await Setting.findOne({ createdBy: req.user._id });

  if (!settings) {
    settings = await Setting.create({
      createdBy: req.user._id,
      storeName: storeName?.trim() || "",
      storePhone: storePhone?.trim() || "",
      storeAddress: storeAddress?.trim() || "",
      footerText: footerText?.trim() || "",
    });
  } else {
    settings.storeName = storeName?.trim() || "";
    settings.storePhone = storePhone?.trim() || "";
    settings.storeAddress = storeAddress?.trim() || "";
    settings.footerText = footerText?.trim() || "";

    await settings.save();
  }

  return res.status(200).json({
    message: "ההגדרות נשמרו בהצלחה.",
    settings,
  });
};

export const updateSecuritySettings = async (req, res) => {
  const { currentPassword, newPassword, newLockCode } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      message: "המשתמש לא נמצא.",
    });
  }

  if (!currentPassword?.trim()) {
    return res.status(400).json({
      message: "יש להזין את הסיסמה הנוכחית.",
    });
  }

  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return res.status(401).json({
      message: "הסיסמה הנוכחית שגויה.",
    });
  }

  if (!newPassword?.trim() && !newLockCode?.trim()) {
    return res.status(400).json({
      message: "יש להזין סיסמה חדשה או קוד נעילה חדש.",
    });
  }

  if (newPassword?.trim()) {
    if (newPassword.trim().length < 6) {
      return res.status(400).json({
        message: "הסיסמה החדשה חייבת להכיל לפחות 6 תווים.",
      });
    }

    user.password = newPassword.trim();
  }

  if (newLockCode?.trim()) {
    if (newLockCode.trim().length < 4) {
      return res.status(400).json({
        message: "קוד הנעילה חייב להכיל לפחות 4 תווים.",
      });
    }

    user.lockCode = newLockCode.trim();
  }

  await user.save();

  return res.status(200).json({
    message: "הגדרות האבטחה עודכנו בהצלחה.",
  });
};