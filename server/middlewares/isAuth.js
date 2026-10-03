import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
  try {
    let { token } = req.cookies;

    if (!token) {
      return res.status(401).json({ message: "User does not have a token" });
    }

    // verify() throws on expired/tampered tokens — it never returns falsy
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = payload.userId;
    next();
  } catch (error) {
    // Expired or invalid token is a 401, not a 500, so the client can redirect to login
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({ message: "Session expired. Please sign in again." });
    }
    console.error("isAuth error:", error);
    return res.status(500).json({ message: "Authentication check failed" });
  }
};

export default isAuth;
