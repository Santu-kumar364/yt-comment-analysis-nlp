import requests
import re
import time
import sqlite3
import os
from datetime import datetime

# Your YouTube API key
API_KEY = "AIzaSyBwwLnHXKmL5VQhkKzumCS5r1Cbi3HdUro"

def extract_video_id(url):
    """Extract video ID from YouTube URL"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=)([\w-]+)',
        r'(?:youtu\.be\/)([\w-]+)',
        r'(?:youtube\.com\/embed\/)([\w-]+)',
        r'(?:youtube\.com\/v\/)([\w-]+)',
        r'(?:youtube\.com\/watch\?.*v=)([\w-]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

# Database setup for caching large comment batches
DB_PATH = "youtube_cache.db"

def init_cache_db():
    """Initialize SQLite cache database for storing fetched comments"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cached_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_id TEXT,
            comment_text TEXT,
            fetched_at TIMESTAMP,
            processed INTEGER DEFAULT 0,
            sentiment TEXT,
            sarcasm TEXT,
            emotion TEXT
        )
    ''')
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_video_id ON cached_comments(video_id)
    ''')
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_processed ON cached_comments(processed)
    ''')
    conn.commit()
    conn.close()

def save_comments_to_cache(video_id, comments):
    """Save fetched comments to local cache"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Clear old cache for this video first (optional - for fresh analysis)
    # cursor.execute("DELETE FROM cached_comments WHERE video_id = ?", (video_id,))
    
    for comment in comments:
        cursor.execute('''
            INSERT INTO cached_comments (video_id, comment_text, fetched_at, processed)
            VALUES (?, ?, ?, 0)
        ''', (video_id, comment, datetime.now()))
    
    conn.commit()
    conn.close()
    print(f"💾 Saved {len(comments)} comments to cache")

def load_comments_from_cache(video_id, limit=None):
    """Load comments from local cache"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    if limit:
        cursor.execute('''
            SELECT comment_text FROM cached_comments 
            WHERE video_id = ? AND processed = 0
            LIMIT ?
        ''', (video_id, limit))
    else:
        cursor.execute('''
            SELECT comment_text FROM cached_comments 
            WHERE video_id = ? AND processed = 0
        ''', (video_id,))
    
    comments = [row[0] for row in cursor.fetchall()]
    conn.close()
    return comments

def get_cached_comment_count(video_id):
    """Get count of cached comments for a video"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT COUNT(*) FROM cached_comments 
        WHERE video_id = ? AND processed = 0
    ''', (video_id,))
    count = cursor.fetchone()[0]
    conn.close()
    return count

def get_comments_from_url(video_url, max_results=500):
    """
    Fetch YouTube comments with pagination support
    Can fetch up to 10000+ comments with caching
    """
    try:
        video_id = extract_video_id(video_url)
        
        if not video_id:
            print(f"Could not extract video ID from URL: {video_url}")
            return []
        
        print(f"Video ID: {video_id}")
        print(f"Requested comments: {max_results}")
        
        # Check cache first
        init_cache_db()
        cached_count = get_cached_comment_count(video_id)
        
        if cached_count >= max_results:
            print(f"✅ Using {cached_count} cached comments (no API call needed)")
            return load_comments_from_cache(video_id, max_results)
        
        print(f"📡 Fetching from YouTube API (cached: {cached_count}, need: {max_results})")
        
        all_comments = []
        next_page_token = None
        comments_fetched = 0
        
        # YouTube API max per request is 100
        per_page = min(100, max_results)
        page = 1
        
        while comments_fetched < max_results:
            # Build URL with pagination
            url = f"https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId={video_id}&maxResults={per_page}&key={API_KEY}"
            if next_page_token:
                url += f"&pageToken={next_page_token}"
            
            print(f"Fetching page {page}...", end=" ")
            response = requests.get(url, timeout=30)
            data = response.json()
            
            if "error" in data:
                error_msg = data['error'].get('message', 'Unknown error')
                print(f"\n❌ API Error: {error_msg}")
                
                if "quotaExceeded" in error_msg:
                    print("⚠️ API quota exceeded. Using cached comments if available.")
                    if all_comments:
                        save_comments_to_cache(video_id, all_comments)
                    return load_comments_from_cache(video_id, max_results)
                elif "commentsDisabled" in error_msg:
                    print("Comments are disabled for this video.")
                break
            
            if "items" not in data or not data["items"]:
                print("No more comments found")
                break
            
            # Extract comments from this batch
            for item in data["items"]:
                comment = item["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
                # Clean HTML entities
                comment = re.sub(r'<.*?>', '', comment)
                comment = comment.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
                comment = comment.replace('&#39;', "'").replace('&quot;', '"')
                all_comments.append(comment)
                comments_fetched += 1
                
                if comments_fetched >= max_results:
                    break
            
            print(f"✅ Got {len(all_comments)} comments so far")
            
            # Check if there are more pages
            next_page_token = data.get("nextPageToken")
            if not next_page_token:
                print("No more pages available")
                break
            
            page += 1
            
            # Small delay to avoid rate limiting
            time.sleep(0.2)
        
        # Save to cache for future use
        if all_comments:
            save_comments_to_cache(video_id, all_comments)
        
        print(f"✅ Successfully fetched {len(all_comments)} comments from YouTube!")
        return all_comments
        
    except requests.exceptions.Timeout:
        print("Request timeout. Try again with fewer comments.")
        return []
    except Exception as e:
        print(f"Error fetching comments: {e}")
        return []

# New function for lakhs of comments with resume support
def get_comments_batch(video_url, batch_size=500, offset=0):
    """
    Fetch comments in batches for lakhs of comments
    Returns (comments, has_more, total_fetched)
    """
    try:
        video_id = extract_video_id(video_url)
        if not video_id:
            return [], False, 0
        
        init_cache_db()
        
        # Try to get from cache first
        cached = load_comments_from_cache(video_id, batch_size)
        if len(cached) >= batch_size:
            return cached[:batch_size], True, len(cached)
        
        # Need to fetch more
        all_comments = []
        next_page_token = None
        fetched = 0
        
        url = f"https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId={video_id}&maxResults=100&key={API_KEY}"
        
        # Skip to offset by paginating
        pages_to_skip = offset // 100
        for _ in range(pages_to_skip):
            response = requests.get(url, timeout=30)
            data = response.json()
            next_page_token = data.get("nextPageToken")
            if not next_page_token:
                break
            url = f"https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId={video_id}&maxResults=100&pageToken={next_page_token}&key={API_KEY}"
        
        while fetched < batch_size:
            response = requests.get(url, timeout=30)
            data = response.json()
            
            if "error" in data or "items" not in data:
                break
            
            for item in data["items"]:
                comment = item["snippet"]["topLevelComment"]["snippet"]["textDisplay"]
                comment = re.sub(r'<.*?>', '', comment)
                all_comments.append(comment)
                fetched += 1
                if fetched >= batch_size:
                    break
            
            next_page_token = data.get("nextPageToken")
            if not next_page_token:
                break
            
            url = f"https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId={video_id}&maxResults=100&pageToken={next_page_token}&key={API_KEY}"
            time.sleep(0.2)
        
        if all_comments:
            save_comments_to_cache(video_id, all_comments)
        
        has_more = next_page_token is not None
        return all_comments, has_more, len(all_comments)
        
    except Exception as e:
        print(f"Error in batch fetch: {e}")
        return [], False, 0