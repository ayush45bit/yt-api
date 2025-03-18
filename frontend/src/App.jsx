// import React, { useState } from "react";

// function App() {
//   const [url, setUrl] = useState("");

//   const handleDownload = async () => {
//     try {
//       // Step 1: Fetch the video URL from the backend
//       const response = await fetch("https://yt-api-4ez2.onrender.com/download", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ url }),
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to get video URL: ${response.statusText}`);
//       }

//       const { videoUrl } = await response.json();
//       console.log("Video URL received:", videoUrl);

//       // Step 2: Fetch the video content from the videoUrl
//       const videoResponse = await fetch(videoUrl, {
//         headers: {
//           "Referer": "https://www.youtube.com/", // Optional: mimic browser context
//         },
//       });

//       if (!videoResponse.ok) {
//         throw new Error(`Failed to fetch video content: ${videoResponse.statusText}`);
//       }

//       const blob = await videoResponse.blob();
//       const downloadUrl = URL.createObjectURL(blob);

//       // Trigger download without redirecting
//       const a = document.createElement("a");
//       a.href = downloadUrl;
//       a.download = "video.mp4"; // Sets the filename
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);

//       // Clean up the object URL
//       URL.revokeObjectURL(downloadUrl);
//     } catch (error) {
//       console.error("Error downloading video:", error.message);
//       alert("Failed to download video: " + error.message); // User feedback
//     }
//   };

//   return (
//     <div>
//       <h1>YouTube Video Downloader</h1>
//       <input
//         type="text"
//         placeholder="Enter YouTube URL"
//         value={url}
//         onChange={(e) => setUrl(e.target.value)}
//       />
//       <button onClick={handleDownload}>Download Video</button>
//     </div>
//   );
// }

// export default App;




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
        throw new Error(`Failed to download video: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "video.mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading video:", error.message);
      alert("Failed to download video: " + error.message);
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
