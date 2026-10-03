import genToken from "../config/token.js";
import User from "../modal/user.model.js";
import { firebaseAuth, firebaseReady } from "../config/firebaseAdmin.js";

const isProd = process.env.NODE_ENV === "production";

// Cookie options must match exactly between set and clear, or the browser ignores the clear
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
};

export const googleAuth = async (req, res) => {
  try {
    if (!firebaseReady) {
      return res
        .status(503)
        .json({ message: "Authentication is not configured on the server" });
    }

    const { idToken } = req.body;

    if (typeof idToken !== "string" || !idToken.trim()) {
      return res.status(400).json({ message: "idToken is required" });
    }

    // The signature check is the actual authentication. Everything below
    // trusts only what came back inside the verified token.
    let decoded;
    try {
      decoded = await firebaseAuth().verifyIdToken(idToken);
    } catch {
      return res.status(401).json({ message: "Invalid or expired sign-in token" });
    }

    const email = decoded.email;
    const name = decoded.name || email?.split("@")[0] || "User";

    if (!email) {
      return res
        .status(401)
        .json({ message: "Google account has no email address" });
    }

    if (decoded.email_verified === false) {
      return res.status(401).json({ message: "Email is not verified" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email });
    }

    const token = await genToken(user._id);

    res.cookie("token", token, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    // Token goes in the httpOnly cookie only — never in the body, or JS can read it
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({ message: "Authentication failed" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", cookieOptions);
    return res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Logout failed" });
  }
};
