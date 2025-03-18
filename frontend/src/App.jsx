import React, { useState } from "react";

function App() {
  const [url, setUrl] = useState("");

  const handleDownload = async () => {
    try {
      const response = await fetch("https://yt-api-4ez2.onrender.com/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get video URL: ${response.statusText}`);
      }

      const { videoUrl } = await response.json();
      console.log("Video URL received:", videoUrl);

      const blob = await videoResponse.blob();
      const downloadUrl = URL.createObjectURL(blob);

      // Trigger download directly with the URL
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "video.mp4"; // Suggests a filename (may not always work)
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading video:", error.message);
    }
  };

  return (
    <div>
      <h1>YouTube Video Downloader</h1>
      <input
        type="text"
        placeholder="Enter YouTube URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button onClick={handleDownload}>Download Video</button>
    </div>
  );
}

export default App;
