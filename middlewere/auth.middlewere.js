import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {

try {
  const token = req.headers("Authorization").replace("Bearer ", "");
  if(!token) {
    return res.status(401).json({ message: "No token provided, access denied" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId).select("-password");
  if(!user) {
    return res.status(401).json({ message: "Invalid token, user not found" });
  }

  req.user = user;
  next();
} catch (error) {
  return res.status(401).json({ message: "Authentication failed" });
}};

export default authMiddleware;