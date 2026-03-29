# fetch_comments.py
import requests

# 🔑 Add your YouTube API key here
API_KEY = "AIzaSyDpABxGnveedDIRVQcGTzMi5ObXmn3jK1I"

def get_comments_from_url(video_url, max_results=50):
    """
    Fetch top-level YouTube comments for a given video URL.
    """
    # Extract video ID from URL
    if "v=" not in video_url:
        raise ValueError("Invalid YouTube URL")
    
    video_id = video_url.split("v=")[1].split("&")[0]
    
    url = (
        f"https://www.googleapis.com/youtube/v3/commentThreads"
        f"?part=snippet&videoId={video_id}&maxResults={max_results}&key={API_KEY}"
    )
    
    response = requests.get(url)
    data = response.json()
    
    comments = []
    if "items" in data:
        for item in data["items"]:
            comment = item["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
            comments.append(comment)
    
    return comments