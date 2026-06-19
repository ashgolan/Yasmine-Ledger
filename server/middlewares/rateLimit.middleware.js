import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: { message: "יותר מדי בקשות, נסה שוב מאוחר יותר." },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  keyGenerator: (req) => {
    const ip = req.ip;
    const username = String(req.body?.username || "unknown").trim().toLowerCase();
    return `${ip}_${username}`;
  },
  message: { message: "יותר מדי ניסיונות התחברות. נסה שוב בעוד 15 דקות." },
});

// ✅ 20 محاولة كل 10 دقائق — كافي للاستخدام الطبيعي وآمن ضد brute-force
export const lockCodeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  keyGenerator: (req) => req.ip,
  message: { message: "יותר מדי ניסיונות קוד נעילה. נסה שוב בעוד 10 דקות." },
});