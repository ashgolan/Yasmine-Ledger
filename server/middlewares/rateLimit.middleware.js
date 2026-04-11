import rateLimit from "express-rate-limit";
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: {
    message: "יותר מדי בקשות, נסה שוב מאוחר יותר.",
  },
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
  message: {
    message: "יותר מדי ניסיונות התחברות. נסה שוב בעוד 15 דקות.",
  },
});