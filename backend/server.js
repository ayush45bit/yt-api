const express = require("express");
const { execFile } = require("child_process");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors({
  origin: "https://yt-api-1.onrender.com", // Allow only your frontend
  methods: ["GET", "POST", "OPTIONS"],     // Allow these methods
  allowedHeaders: ["Content-Type"],        // Allow this header
}));
app.use(express.json());

const ytDlpPath = path.join(__dirname, "bin", "yt-dlp");
const cookiesPath = path.join(__dirname, "cookies.txt");


app.post("/download", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "YouTube URL is required" });
  }

  // Check if yt-dlp binary exists
  if (!fs.existsSync(ytDlpPath)) {
    console.error("yt-dlp binary not found at", ytDlpPath);
    return res.status(500).json({ error: "yt-dlp binary not found" });
  }

  if (!fs.existsSync(cookiesPath)) {
    console.error("Cookies file not found at", cookiesPath);
    return res.status(500).json({ error: "Cookies file not found" });
  }

   try {
    const { stdout, stderr } = await new Promise((resolve, reject) => {
      execFile(ytDlpPath, [
        "--cookies", cookiesPath,
        "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124",// Pass cookies file
        "-f", "best",             // Keep this for now
        "--get-url",              // Get the direct URL
        url
      ], (err, stdout, stderr) => {
        if (err) reject({ err, stderr });
        else resolve({ stdout, stderr });
      });
    });

    const videoUrl = stdout.trim();
    if (!videoUrl) {
      throw new Error("No video URL returned by yt-dlp");
    }

    const response = await axios.get(videoUrl, { responseType: "arraybuffer" });
    res.setHeader("Content-Disposition", "attachment; filename=\"video.mp4\"");
    res.setHeader("Content-Type", "video/mp4");
   res.send(Buffer.from(response.data));

  
  
  } catch (error) {
    console.error("Error in download process:", error.err || error);
    const details = error.stderr || error.message || "Unknown error";
    res.status(500).json({ error: "Failed to process video", details });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
