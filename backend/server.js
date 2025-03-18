const express = require("express");
const { execFile } = require("child_process");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

// Add timestamp to logs for better tracking
const logWithTimestamp = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json());

const ytDlpPath = path.join(__dirname, "bin", "yt-dlp");
const cookiesPath = path.join(__dirname, "cookies.txt");

app.post("/download", async (req, res) => {
  logWithTimestamp("Received request to /download endpoint");
  const { url } = req.body;

  logWithTimestamp(`Checking if URL is provided: ${url || "undefined"}`);
  if (!url) {
    logWithTimestamp("URL not provided, returning 400 error");
    return res.status(400).json({ error: "YouTube URL is required" });
  }

  // Check if yt-dlp binary exists
  logWithTimestamp(`Checking if yt-dlp exists at: ${ytDlpPath}`);
  if (!fs.existsSync(ytDlpPath)) {
    logWithTimestamp("yt-dlp binary not found");
    console.error(`yt-dlp binary not found at ${ytDlpPath}`);
    return res.status(500).json({ error: "yt-dlp binary not found" });
  }
  logWithTimestamp("yt-dlp binary found");

  // Check if cookies file exists
  logWithTimestamp(`Checking if cookies file exists at: ${cookiesPath}`);
  if (!fs.existsSync(cookiesPath)) {
    logWithTimestamp("Cookies file not found");
    console.error(`Cookies file not found at ${cookiesPath}`);
    return res.status(500).json({ error: "Cookies file not found" });
  }
  logWithTimestamp("Cookies file found");

  try {
    logWithTimestamp(`Executing yt-dlp to fetch video URL for: ${url}`);
    const { stdout, stderr } = await new Promise((resolve, reject) => {
      const args = [
        "--proxy", "http://130.36.36.29:443",
        "-f", "best",
        "--get-url",
        url
      ];
      logWithTimestamp(`Running yt-dlp with args: ${args.join(" ")}`);
      execFile(ytDlpPath, args, (err, stdout, stderr) => {
        if (err) {
          logWithTimestamp("yt-dlp execution failed");
          reject({ err, stderr });
        } else {
          logWithTimestamp("yt-dlp executed successfully");
          resolve({ stdout, stderr });
        }
      });
    });

    logWithTimestamp(`yt-dlp stdout: ${stdout}`);
    if (stderr) logWithTimestamp(`yt-dlp stderr: ${stderr}`);

    const videoUrl = stdout.trim();
    logWithTimestamp(`Parsed video URL: ${videoUrl}`);
    if (!videoUrl) {
      logWithTimestamp("No video URL returned by yt-dlp");
      throw new Error("No video URL returned by yt-dlp");
    }

    logWithTimestamp(`Fetching video from: ${videoUrl}`);
    // const response = await axios.get(videoUrl, { responseType: "arraybuffer" });
    // logWithTimestamp(`Video fetched, response size: ${response.data.length} bytes`);

    // logWithTimestamp("Setting response headers");
    // res.setHeader("Content-Disposition", "attachment; filename=\"video.mp4\"");
    // res.setHeader("Content-Type", "video/mp4");

    logWithTimestamp("Sending video url to client");
    res.send(videoUrl);
    logWithTimestamp("Video data sent successfully");
  } catch (error) {
    logWithTimestamp("Caught an error in the download process");
    console.error("Error in download process:", error.err || error);
    const details = error.stderr || error.message || "Unknown error";
    logWithTimestamp(`Error details: ${details}`);
    res.status(500).json({ error: "Failed to process video", details });
  }
});

app.listen(3000, () => {
  logWithTimestamp("Server started on port 3000");
});
