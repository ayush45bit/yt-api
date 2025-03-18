const express = require("express");
const { exec } = require("child_process");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/download", (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: "YouTube URL is required" });
    }

    exec("./bin/yt-dlp", ["-f", "best", "--get-url", url], (err, stdout) => {
        if (err) {
            return res.status(500).json({err:err, error: "Failed to get video URL" });
        }

        const videoUrl = stdout.trim();
        axios.get(videoUrl, { responseType: "arraybuffer" })
            .then((response) => {
                res.setHeader("Content-Type", "video/mp4");
                res.send(Buffer.from(response.data));
            })
            .catch((error) => {
                res.status(500).json({ error: "Error downloading video" });
            });
    });
});

app.listen(3000, () => console.log("Server running on port 3000"));
