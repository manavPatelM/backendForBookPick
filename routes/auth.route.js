import express from "express";
import User from "../models/User.js";
import "dotenv/config";
import jwt from "jsonwebtoken";

const router = express.Router();


const generateToken = (userId) => {
  return jwt.sign({
    userId: userId,
  }, process.env.JWT_SECRET, { expiresIn: "15d" })
}

router.post("/register", async (req, res) => {
  try {
    const { email, userName, password } = req.body;

    console.log("req received:", email, userName);

    if (!email || !userName || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password should be at least 8 characters long"
      });
    }

    if (userName.length < 3) {
      return res.status(400).json({
        message: "userName should be at least 3 characters long"
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existUser = await User.findOne({
      $or: [{ email }, { userName }]
    });

    if (existUser) {
      return res.status(409).json({
        message: "User with this email or userName already exists"
      });
    }

    const profileImage = `https://ui-avatars.com/api/?name=${userName}&background=random&length=1`;

    const user = new User({
      email,
      userName,
      password,
      profileImage
    });

    const savedUser = await user.save();
    const token = generateToken(savedUser._id);

    res.status(201).json({
      token,
      user: {
        _id: savedUser._id,   // was: id: savedUser._id
        username: savedUser.userName,
        email: savedUser.email,
        profileImage: savedUser.profileImage
      },
      message: "Account created successfully"
    });

  } catch (error) {
    console.error("Error while registering:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existUser = await User.findOne({ email });
    
    if (!existUser) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordMatch = await existUser.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(existUser._id);

    res.status(200).json({
      token,
      user: {
        id: existUser._id,
        username: existUser.userName,
        email: existUser.email,
        profileImage: existUser.profileImage
      },
      message: "Login successful"
    });
  } catch (error) {
    console.error("Error while logging in:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;