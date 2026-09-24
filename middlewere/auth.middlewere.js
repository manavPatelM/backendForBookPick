import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token provided, access denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Invalid token, user not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({ message: "Authentication failed" });
  }
};


export default authMiddleware;