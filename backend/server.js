const express = require("express");
const { exec } = require("child_process");
const axios = require("axios");
const cors = require("cors");
const path= require('path')

const app = express();
app.use(cors());
app.use(express.json());

const ytDlpPath = path.join(__dirname, "bin", "yt-dlp");

app.post("/download", (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "YouTube URL is required" });
  }

  // Check if the binary exists
  if (!fs.existsSync(ytDlpPath)) {
    console.error("yt-dlp binary not found at", ytDlpPath);
    return res.status(500).json({ error: "yt-dlp binary not found" });
  }

  // Execute yt-dlp to get the video URL
  execFile(ytDlpPath, ["-f", "best", "--get-url", url], (err, stdout, stderr) => {
    if (err) {
      console.error("Error executing yt-dlp:", err);
      if (stderr) {
        console.error("yt-dlp stderr:", stderr);
        return res.status(500).json({
          error: "Failed to get video URL",
          details: stderr
        });
      }
      return res.status(500).json({
        error: "Failed to get video URL",
        details: err.message
      });
    }

    const videoUrl = stdout.trim();
    axios.get(videoUrl, { responseType: "arraybuffer" })
    .then((response) => {
        res.setHeader("Content-Type", "video/mp4");
        res.send(Buffer.from(response.data));
    })
    .catch((error) => {
        res.status(500).json({err:error, error: "Error downloading video" });
    });
    res.json({ videoUrl });
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));
