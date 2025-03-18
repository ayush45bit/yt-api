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

  // Execute yt-dlp to get the direct video URL
  execFile(ytDlpPath, ["-f", "best", "--get-url", url], async (err, stdout, stderr) => {
    if (err) {
      console.error("Error executing yt-dlp:", err);
      return res.status(500).json({ error: "Failed to get video URL", details: stderr || err.message });
    }

    const videoUrl = stdout.trim();

    try {
      // Fetch video as arraybuffer
      const response = await axios.get(videoUrl, { responseType: "arraybuffer" });

      // Set headers to trigger download
      res.setHeader("Content-Disposition", `attachment; filename="video.mp4"`);
      res.setHeader("Content-Type", "video/mp4");

      // Send the downloaded video as response
      res.send(Buffer.from(response.data));
    } catch (error) {
      console.error("Error downloading video:", error.message);
      res.status(500).json({ error: "Error downloading video", details: error.message });
    }
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));
