const express = require("express");
const { execFile } = require("child_process");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const ytDlpPath = path.join(__dirname, "bin", "yt-dlp");
const cookiesPath = path.join(__dirname, "cookies.txt");

try {
  fs.chmodSync(ytDlpPath, "755");
  console.log("Set executable permissions for yt-dlp");
} catch (err) {
  console.error("Failed to set permissions for yt-dlp:", err);
}

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

  // Execute yt-dlp to get the direct video URL
  execFile(ytDlpPath, ["-f", "best", "--get-url", url], async (err, stdout, stderr) => {
    if (err) {
      console.error("Error executing yt-dlp:", err);
      return res.status(500).json({ error: "Failed to get video URL", details: stderr || err.message });
    }

    const videoUrl = stdout.trim();

   try {
    const { stdout, stderr } = await new Promise((resolve, reject) => {
      execFile(ytDlpPath, [
        "--cookies", cookiesPath,  // Pass cookies file
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

  
    });
  } catch (error) {
    console.error("Error in download process:", error.err || error);
    const details = error.stderr || error.message || "Unknown error";
    res.status(500).json({ error: "Failed to process video", details });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
