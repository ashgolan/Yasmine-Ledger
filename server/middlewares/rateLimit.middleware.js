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

// ── הגנה על verify-lock-code מפני Brute-force ──
// קוד 4 ספרות = 10,000 אפשרויות — חייב rate limit נפרד
export const lockCodeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 דקות
  max: 8,                    // 8 ניסיונות בלבד
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  keyGenerator: (req) => req.ip,
  message: {
    message: "יותר מדי ניסיונות קוד נעילה. נסה שוב בעוד 10 דקות.",
  },
});
