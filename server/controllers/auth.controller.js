import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const checkSetup = async (req, res) => {
  const count = await User.countDocuments();
  return res.json({ needsSetup: count === 0 });
};

export const register = async (req, res) => {
  const count = await User.countDocuments();
  if (count > 0) {
    return res.status(403).json({ message: "המערכת כבר מוגדרת." });
  }
  const { username, password, lockCode } = req.body;
  if (!username?.trim() || !password?.trim() || !lockCode?.trim()) {
    return res.status(400).json({ message: "יש למלא את כל השדות." });
  }
  if (password.trim().length < 6) {
    return res.status(400).json({ message: "הסיסמה חייבת להכיל לפחות 6 תווים." });
  }
  if (lockCode.trim().length < 4) {
    return res.status(400).json({ message: "קוד הנעילה חייב להכיל לפחות 4 ספרות." });
  }
  const user = await User.create({
    username: username.trim(),
    password: password.trim(),
    lockCode: lockCode.trim(),
  });
  const token = generateToken(user._id);
  res.cookie("token", token, cookieOptions);
  return res.status(201).json({
    message: "המשתמש נוצר בהצלחה.",
    user: { _id: user._id, username: user.username },
  });
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username?.trim() || !password?.trim()) {
    return res.status(400).json({ message: "יש להזין שם משתמש וסיסמה." });
  }

  const user = await User.findOne({ username: username.trim(), isActive: true });

  if (!user) {
    return res.status(401).json({ message: "שם משתמש או סיסמה שגויים." });
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({ message: "שם משתמש או סיסמה שגויים." });
  }

  const token = generateToken(user._id);
  res.cookie("token", token, cookieOptions);

  return res.status(200).json({
    message: "התחברת בהצלחה.",
    user: { _id: user._id, username: user.username, role: user.role },
  });
};

export const logout = async (req, res) => {
  res.cookie("token", "", { ...cookieOptions, maxAge: 0 });
  return res.status(200).json({ message: "התנתקת בהצלחה." });
};

export const getMe = async (req, res) => {
  return res.status(200).json({ user: req.user });
};

export const verifyLockCode = async (req, res) => {
  const { lockCode } = req.body;

  if (!lockCode?.trim()) {
    return res.status(400).json({ success: false, message: "יש להזין קוד נעילה." });
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ success: false, message: "המשתמש לא נמצא." });
  }

  const isMatch = await user.compareLockCode(lockCode);

  if (!isMatch) {
    // ✅ 400 בדל 401 — כדי שה-axios interceptor לא יעשה redirect
    return res.status(400).json({ success: false, message: "קוד הנעילה שגוי." });
  }

  // ✅ חייב לכלול success: true — LockScreen מחפש את זה
  return res.status(200).json({ success: true, message: "הנעילה הוסרה בהצלחה." });
};
