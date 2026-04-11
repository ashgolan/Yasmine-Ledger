import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "אין הרשאה. יש להתחבר למערכת.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password -lockCode");

    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "המשתמש לא קיים או לא פעיל.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "התחברות לא תקינה. יש להתחבר מחדש.",
    });
  }
};