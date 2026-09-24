import express from "express";
import "dotenv/config";
import cors from "cors";


import authRoutes from "./routes/auth.route.js";
import bookRoutes from "./routes/book.route.js";
import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use(cors());

// Health check / keep-alive endpoint
app.get("/ping", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is awake" });
});

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();

  // Self-ping to keep Render free tier instance awake (pings every 10 minutes)
  const appUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;
  if (appUrl) {
    const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
    setInterval(async () => {
      try {
        const pingUrl = `${appUrl.replace(/\/+$/, "")}/ping`;
        const res = await fetch(pingUrl);
        console.log(`[Keep-Alive] Pinged ${pingUrl} - Status: ${res.status}`);
      } catch (err) {
        console.error("[Keep-Alive] Ping error:", err.message);
      }
    }, PING_INTERVAL_MS);
    console.log(`[Keep-Alive] Initialized self-ping service for URL: ${appUrl}`);
  }
});