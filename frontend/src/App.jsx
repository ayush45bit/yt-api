import React, { useState } from "react";

function App() {
    const [url, setUrl] = useState("");

    const handleDownload = async () => {
        try {
            // Send POST request to the server with the YouTube URL
            const response = await fetch("https://yt-api-4ez2.onrender.com/download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            // Check if the request was successful
            if (!response.ok) {
                throw new Error("Failed to download video");
            }

            // Convert the response to a Blob
            console.log(response)
            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);

            // Create a temporary link to trigger the download
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = "video.mp4"; // Set the filename
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Clean up the object URL
            URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error("Error downloading video:", error);
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
