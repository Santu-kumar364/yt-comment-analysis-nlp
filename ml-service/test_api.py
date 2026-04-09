import requests

API_KEY = "AIzaSyBwwLnHXKmL5VQhkKzumCS5r1Cbi3HdUro"
video_id = "dQw4w9WgXcQ"  # Rick Astley - has many comments

print("="*50)
print("Testing YouTube API Key")
print("="*50)
print(f"API Key: {API_KEY[:10]}...{API_KEY[-10:]}")
print(f"Video ID: {video_id}")
print()

# Test video info endpoint
url = f"https://www.googleapis.com/youtube/v3/videos?part=statistics&id={video_id}&key={API_KEY}"
response = requests.get(url)
data = response.json()

if "error" in data:
    print("[ERROR] API Error:")
    print(f"  Message: {data['error']['message']}")
    print(f"  Code: {data['error']['code']}")
    print(f"  Reason: {data['error']['errors'][0]['reason']}")
    print()
    print("Possible solutions:")
    print("1. Enable YouTube Data API v3 in Google Cloud Console")
    print("2. Check if API key is correct")
    print("3. Make sure billing is enabled (even for free tier)")
else:
    print("[SUCCESS] API Key is valid!")
    if 'items' in data and len(data['items']) > 0:
        print(f"  Video found!")
        comment_count = data['items'][0]['statistics'].get('commentCount', 0)
        print(f"  Comment count: {comment_count}")
        
        # Test fetching comments
        print()
        print("Testing comment fetch...")
        comments_url = f"https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId={video_id}&maxResults=5&key={API_KEY}"
        comments_response = requests.get(comments_url)
        comments_data = comments_response.json()
        
        if "items" in comments_data:
            print(f"[SUCCESS] Successfully fetched {len(comments_data['items'])} comments!")
            if len(comments_data['items']) > 0:
                first_comment = comments_data['items'][0]['snippet']['topLevelComment']['snippet']['textDisplay']
                print(f"  First comment: {first_comment[:100]}...")
        else:
            print("[WARNING] Could not fetch comments:")
            if "error" in comments_data:
                print(f"  {comments_data['error'].get('message', 'Unknown error')}")
    else:
        print("[ERROR] Video not found")

print("="*50)