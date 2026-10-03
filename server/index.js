// Must be first — modules below read process.env at import time
import "dotenv/config";
import validateEnv from "./config/validateEnv.js";
import express from "express";
import connectDb from "./config/connectDb.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import interviewRouter from "./routes/interview.route.js";
import { globalLimiter } from "./middlewares/rateLimit.js";

// Exits with a clear message rather than booting into a broken state
validateEnv();

const app = express();

// Required for correct client IPs (and rate limiting) behind a proxy/load balancer
app.set("trust proxy", 1);

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(globalLimiter);

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/interview", interviewRouter);

// Unknown API route
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Catches anything thrown outside a controller's try/catch, incl. multer errors
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  if (err?.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File is too large. Maximum size is 5MB."
        : "Please upload a single PDF file.";
    return res.status(400).json({ message });
  }

  res.status(500).json({ message: "Something went wrong." });
});

const PORT = process.env.PORT || 8000;

// Connect before listening so we never serve requests against a dead DB
const start = async () => {
  await connectDb();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

start();

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});