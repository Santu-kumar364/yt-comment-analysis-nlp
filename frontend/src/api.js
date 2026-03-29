import axios from "axios";

// Set base URL to Spring Boot backend
const API = axios.create({
  baseURL: "http://localhost:8080/api",
  timeout: 10000, // 10 seconds
});

// Analyze a single typed comment
export const analyzeComment = async (text) => {
  try {
    // Make sure only the text string is sent
    if (typeof text !== "string") {
      text = String(text);
    }
    return await API.post("/analyze", { text });
  } catch (err) {
    console.error("Error calling /analyze:", err);
    return { data: { sentiment: "UNKNOWN" } }; // fallback
  }
};

// Get all saved comments
export const getComments = async () => {
  try {
    return await API.get("/comments");
  } catch (err) {
    console.error("Error calling /comments:", err);
    return { data: [] };
  }
};

// Delete all comments
export const deleteComments = async () => {
  try {
    return await API.delete("/comments");
  } catch (err) {
    console.error("Error deleting /comments:", err);
    return { data: { success: false } };
  }
};

// Analyze YouTube comments via video URL
export const analyzeYouTube = async (url, limit = 50) => {
  try {
    if (typeof url !== "string") {
      url = String(url);
    }
    return await API.get(
      `/analyze_youtube?url=${encodeURIComponent(url)}&limit=${limit}`
    );
  } catch (err) {
    console.error("Error calling /analyze_youtube:", err);
    return { data: { results: [] } };
  }
};