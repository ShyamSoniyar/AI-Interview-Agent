import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const message = (msg) => ({ message: msg });

// Broad safety net for the whole API
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: message("Too many requests. Please try again later."),
});

// Sign-in creates accounts — keep it tight
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: message("Too many sign-in attempts. Please try again in a few minutes."),
});

// Every one of these costs money at OpenRouter. Keyed per user when authenticated
// so one account cannot drain the balance, falling back to IP.
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  // ipKeyGenerator normalises IPv6 to a /64 subnet so it can't be trivially bypassed
  keyGenerator: (req, res) => req.userId?.toString() || ipKeyGenerator(req, res),
  message: message("Hourly AI usage limit reached. Please try again later."),
});
