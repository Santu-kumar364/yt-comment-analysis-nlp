import React, { useEffect, useState } from "react";
import {
  analyzeComment as analyzeCommentAPI,
  analyzeYouTube as analyzeYouTubeAPI,
  getComments,
  deleteComments as deleteCommentsAPI,
} from "./api";
import SentimentChart from "./components/SentimentChart";

function App() {
  const [videoUrl, setVideoUrl] = useState("");
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [error, setError] = useState("");

  // Load comments from backend or localStorage on mount
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await getComments();
        if (response.data && response.data.length > 0) {
          setComments(response.data);
          localStorage.setItem("comments", JSON.stringify(response.data));
        } else {
          const saved = localStorage.getItem("comments");
          if (saved) setComments(JSON.parse(saved));
        }
      } catch (err) {
        console.error("Error fetching comments:", err);
        const saved = localStorage.getItem("comments");
        if (saved) setComments(JSON.parse(saved));
      }
    };
    fetchComments();
  }, []);

  // Save comments to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("comments", JSON.stringify(comments));
  }, [comments]);

  // Handle analyzing a single typed comment
  const handleAnalyzeComment = async () => {
    if (!comment.trim()) return; // ignore empty

    try {
      const response = await analyzeCommentAPI(comment);

      // If backend returns the saved comment (with ID, timestamp), use it
      const savedComment = response.data; // assuming backend sends { id, text, sentiment, createdAt }

      // Add to state so it appears immediately
      setComments((prev) => [savedComment, ...prev]);

      setComment(""); // clear input
    } catch (err) {
      console.error(err);
    }
  };

  // Handle analyzing YouTube comments by URL
  const handleAnalyzeYouTube = async () => {
    if (!videoUrl.trim()) {
      setError("Please enter a YouTube video URL");
      return;
    }

    try {
      setError("");
      const response = await analyzeYouTubeAPI(videoUrl, 150);

      // ✅ FIX: backend returns array directly
      if (response.data && Array.isArray(response.data)) {
        setComments(response.data);
      } else {
        setComments([]);
        setError("No comments found or invalid response");
      }
    } catch (err) {
      console.error("Error fetching YouTube comments:", err);
      setComments([]);
      setError("Failed to fetch comments. Check backend.");
    }
  };

  // Handle clearing all comments (both backend and localStorage)
  const handleClearAll = async () => {
    try {
      await deleteCommentsAPI();
      setComments([]);
      localStorage.removeItem("comments");
    } catch (err) {
      console.error("Error clearing comments:", err);
      setError("Failed to clear comments");
    }
  };

  return (
    <div className="container mx-auto mt-10">
      <h1 className="text-3xl font-bold text-center mb-5">
        Sentiment Analyzer 🚀
      </h1>

      {error && <p className="text-red-500 text-center mb-3">{error}</p>}

      {/* Single comment input */}
      <div className="mb-4">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Enter your comment..."
          className="border rounded w-full p-2"
        />
        <button
          onClick={() => handleAnalyzeComment(comment)}
          className="bg-blue-500 text-white px-4 py-2 mt-2 rounded"
        >
          Analyze Comment
        </button>
      </div>

      {/* YouTube URL input */}
      <div className="mb-4">
        <input
          type="text"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="Enter YouTube video URL..."
          className="border rounded w-full p-2 mb-2"
        />
        <button
          onClick={handleAnalyzeYouTube}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Analyze YouTube Comments
        </button>
      </div>

      {/* Clear all button */}
      {comments.length > 0 && (
        <div className="mb-4">
          <button
            onClick={handleClearAll}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Clear All Comments
          </button>
        </div>
      )}

      {/* Sentiment chart */}
      {comments.length > 0 && <SentimentChart comments={comments} />}

      {/* Comments list */}
      <div>
        {comments.length > 0 ? (
          <ul>
            {comments.map((c, idx) => (
              <li key={idx} className="border-b py-2">
                <strong>{c.sentiment}:</strong>{" "}
                <span dangerouslySetInnerHTML={{ __html: c.text }} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No comments to display.</p>
        )}
      </div>
    </div>
  );
}

export default App;
