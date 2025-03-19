

// const express = require("express");
// const { execFile } = require("child_process");
// const axios = require("axios");
// const cors = require("cors");
// const path = require("path");
// const fs = require("fs");
// const {HttpsProxyAgent} =require('https-proxy-agent')

// const app = express();

// const logWithTimestamp = (message) => {
//   console.log(message);
// };

// app.use(cors({
//   origin: "*",
//   methods: ["GET", "POST"],
//   allowedHeaders: ["Content-Type"],
// }));
// app.use(express.json());

// const ytDlpPath = path.join(__dirname, "bin", "yt-dlp");
// const proxyUrl = "http://130.36.36.29:443";

// app.post("/download", async (req, res) => {
//   logWithTimestamp("Received request to /download endpoint");
//   const { url } = req.body;

//   logWithTimestamp(`Checking if URL is provided: ${url || "undefined"}`);
//   if (!url) {
//     logWithTimestamp("URL not provided, returning 400 error");
//     return res.status(400).json({ error: "YouTube URL is required" });
//   }

//   logWithTimestamp(`Checking if yt-dlp exists at: ${ytDlpPath}`);
//   if (!fs.existsSync(ytDlpPath)) {
//     logWithTimestamp("yt-dlp binary not found");
//     console.error(`yt-dlp binary not found at ${ytDlpPath}`);
//     return res.status(500).json({ error: "yt-dlp binary not found" });
//   }
//   logWithTimestamp("yt-dlp binary found");


//   try {
//     logWithTimestamp(`Executing yt-dlp to fetch video URL for: ${url}`);
//     const { stdout, stderr } = await new Promise((resolve, reject) => {
//       const args = [
//         "--proxy", proxyUrl,
//         "-f", "best",
//         "--get-url",
//         url
//       ];
//       logWithTimestamp(`Running yt-dlp with args: ${args.join(" ")}`);
//       execFile(ytDlpPath, args, (err, stdout, stderr) => {
//         if (err) {
//           logWithTimestamp("yt-dlp execution failed");
//           reject({ err, stderr });
//         } else {
//           logWithTimestamp("yt-dlp executed successfully");
//           resolve({ stdout, stderr });
//         }
//       });
//     });

//     logWithTimestamp(`yt-dlp stdout: ${stdout}`);
//     if (stderr) logWithTimestamp(`yt-dlp stderr: ${stderr}`);

//     const videoUrl = stdout.trim();
//     logWithTimestamp(`Parsed video URL: ${videoUrl}`);
//     if (!videoUrl) {
//       logWithTimestamp("No video URL returned by yt-dlp");
//       throw new Error("No video URL returned by yt-dlp");
//     }

//     logWithTimestamp(`Fetching video from: ${videoUrl}`);
//     const proxyAgent = new HttpsProxyAgent(proxyUrl); // Use the dynamically resolved function
//     const response = await axios.get(videoUrl, {
//       responseType: "arraybuffer",
//       httpsAgent: proxyAgent,
//       headers: {
//         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124",
//         "Referer": "https://www.youtube.com/",
//       },
//     });

//     logWithTimestamp("Setting response headers for download");
//     res.setHeader("Content-Disposition", "attachment; filename=\"video.mp4\"");
//     res.setHeader("Content-Type", "video/mp4");

//     // logWithTimestamp("Streaming video to client");
//     // response.data.pipe(res);
//     // response.data.on("end", () => {
//     //   logWithTimestamp("Video stream completed successfully");
//     // });
//     // response.data.on("error", (err) => {
//     //   logWithTimestamp(`Stream error: ${err.message}`);
//     //   res.status(500).json({ error: "Stream failed", details: err.message });
//     // });
//     res.send(Buffer.from(response.data));
//   } catch (error) {
//     logWithTimestamp("Caught an error in the download process");
//     console.error("Error in download process:", error.err || error);
//     const details = error.stderr || error.message || "Unknown error";
//     logWithTimestamp(`Error details: ${details}`);
//     res.status(500).json({ error: "Failed to process video", details });
//   }
// });

// app.listen(3000, () => {
//   logWithTimestamp("Server started on port 3000");
// });



const express = require("express");
const { execFile } = require("child_process");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { HttpsProxyAgent } = require("https-proxy-agent");

const app = express();

// Logging function
const logWithTimestamp = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json());

// Constants
const ytDlpPath = path.join(__dirname, "bin", "yt-dlp");
const proxyUrl = "http://45.140.143.77:18080";

// Helper: Validate URL
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Helper: Execute yt-dlp with timeout
const execYtDlp = (args) => {
  return new Promise((resolve, reject) => {
    const process = execFile(ytDlpPath, args, (err, stdout, stderr) => {
      if (err) reject({ err, stderr });
      else resolve({ stdout, stderr });
    });
    // Timeout after 30 seconds
    setTimeout(() => reject(new Error("yt-dlp timed out after 30s")), 30000).unref();
    process.on("error", (err) => reject({ err, stderr: "Process error" }));
  });
};

app.post("/download", async (req, res) => {
  logWithTimestamp("Received request to /download endpoint");
  const { url } = req.body;

  // Validate input
  logWithTimestamp(`Checking if URL is provided: ${url || "undefined"}`);
  if (!url || typeof url !== "string" || !isValidUrl(url)) {
    logWithTimestamp("Invalid or missing URL, returning 400 error");
    return res.status(400).json({ error: "Valid YouTube URL is required" });
  }

  // Check yt-dlp binary
  logWithTimestamp(`Checking if yt-dlp exists at: ${ytDlpPath}`);
  if (!fs.existsSync(ytDlpPath)) {
    logWithTimestamp("yt-dlp binary not found");
    return res.status(500).json({ error: "Server misconfigured: yt-dlp binary missing" });
  }
  logWithTimestamp("yt-dlp binary found");

  try {
    // Fetch video URL with yt-dlp
    logWithTimestamp(`Executing yt-dlp to fetch video URL for: ${url}`);
    let stdout, stderr;
    try {
      const result = await execYtDlp([
        "--proxy", proxyUrl,
        "-f", "best",
        "--get-url",
        url,
      ]);
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (error) {
      logWithTimestamp("yt-dlp execution failed");
      throw new Error(`yt-dlp failed: ${error.stderr || error.message}`);
    }

    logWithTimestamp(`yt-dlp stdout: ${stdout}`);
    if (stderr) logWithTimestamp(`yt-dlp stderr: ${stderr}`);

    const videoUrl = stdout.trim();
    logWithTimestamp(`Parsed video URL: ${videoUrl}`);
    if (!videoUrl || !isValidUrl(videoUrl)) {
      logWithTimestamp("No valid video URL returned by yt-dlp");
      throw new Error("No valid video URL returned by yt-dlp");
    }

    // Fetch video data
    logWithTimestamp(`Fetching video from: ${videoUrl}`);
    const proxyAgent = new HttpsProxyAgent(proxyUrl);
    let response;
    try {
      response = await axios.get(videoUrl, {
        responseType: "arraybuffer",
        httpsAgent: proxyAgent,
        timeout: 60000, // 60s timeout for large files
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124",
          "Referer": "https://www.youtube.com/",
        },
      });
    } catch (error) {
      logWithTimestamp(`Axios fetch failed: ${error.message}`);
      throw new Error(`Failed to fetch video: ${error.response?.statusText || error.message}`);
    }

    // Validate response data
    if (!response.data || response.data.length === 0) {
      logWithTimestamp("Empty video data received");
      throw new Error("No video data received from URL");
    }

    // Send video data
    logWithTimestamp("Setting response headers for download");
    res.setHeader("Content-Disposition", "attachment; filename=\"video.mp4\"");
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Length", response.data.length); // Optional: Helps client track progress

    logWithTimestamp("Sending video data to client");
    res.send(Buffer.from(response.data));
    logWithTimestamp("Video data sent successfully");

  } catch (error) {
    logWithTimestamp("Caught an error in the download process");
    const details = error.stderr || error.message || "Unknown error";
    logWithTimestamp(`Error details: ${details}`);

    // Return a consistent error response
    res.status(500).json({
      error: "Failed to process video",
      details: details,
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  logWithTimestamp(`Unhandled error: ${err.message}`);
  res.status(500).json({ error: "Unexpected server error", details: err.message });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logWithTimestamp(`Server started on port ${PORT}`);
});

// Handle uncaught exceptions and rejections
process.on("uncaughtException", (err) => {
  logWithTimestamp(`Uncaught Exception: ${err.message}`);
});
process.on("unhandledRejection", (reason) => {
  logWithTimestamp(`Unhandled Rejection: ${reason}`);
});
