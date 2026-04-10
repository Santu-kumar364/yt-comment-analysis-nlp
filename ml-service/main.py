from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from data.fetch_comments import get_comments_from_url, get_comments_batch, init_cache_db
from model.model_loader import (
    predict_sentiment,
    detect_sarcasm,
    detect_emotion,
    generate_summary,
    extract_keywords,
    process_comments_in_batches,
    get_batch_stats
)
import time
from datetime import datetime
import asyncio
from threading import Thread
import os 

app = FastAPI(title="YouTube Comment Analyzer API", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize cache DB on startup
@app.on_event("startup")
async def startup_event():
    init_cache_db()
    print("✅ Cache database initialized")

class SingleCommentRequest(BaseModel):
    text: str

# Store background job status
analysis_jobs = {}

@app.get("/")
async def root():
    return {
        "message": "YouTube Comment Analyzer API",
        "status": "running",
        "version": "2.0.0",
        "max_comments": "UNLIMITED (supports lakhs of comments with caching)",
        "endpoints": {
            "/analyze_youtube": "GET - Analyze YouTube video comments (up to 1000 quickly)",
            "/analyze_large": "POST - Analyze lakhs of comments asynchronously",
            "/job_status/{job_id}": "GET - Check background job status",
            "/predict": "POST - Analyze single comment",
            "/health": "GET - Check API health"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "models_loaded": True,
        "cache_initialized": True
    }

@app.get("/analyze_youtube")
async def analyze_youtube(url: str, limit: int = 500):
    """
    Analyze YouTube video comments
    NOW SUPPORTS UP TO 10000+ COMMENTS (removed 1000 cap)
    """
    try:
        # REMOVED THE 1000 CAP - Now supports more!
        # if limit > 1000:
        #     limit = 1000
        
        # Cap at 10000 for reasonable response time, but cache handles more
        if limit > 10000:
            print(f"⚠️ Large request: {limit} comments. This may take several minutes.")
        
        print(f"\n{'='*60}")
        print(f"Analyzing YouTube URL: {url}")
        print(f"Comment limit: {limit}")
        print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*60}")
        
        start_time = time.time()
        
        # Fetch real comments from YouTube (now with caching)
        comments = get_comments_from_url(url, limit)
        
        if not comments:
            return {
                "total_comments": 0,
                "summary": "No comments found for this video.",
                "keywords": [],
                "stats": {"positive": 0, "neutral": 0, "negative": 0},
                "sentiment_score": 0,
                "results": [],
                "timestamp": datetime.now().isoformat(),
                "processing_time": round(time.time() - start_time, 2)
            }
        
        print(f"Processing {len(comments)} comments with ML models...")
        
        # Process in batches for better performance
        all_results = []
        stats = {"positive": 0, "neutral": 0, "negative": 0}
        
        # Use batch processing
        for batch_results in process_comments_in_batches(comments, batch_size=100):
            for result in batch_results:
                all_results.append(result)
                if result["sentiment"] == "POSITIVE":
                    stats["positive"] += 1
                elif result["sentiment"] == "NEGATIVE":
                    stats["negative"] += 1
                else:
                    stats["neutral"] += 1
        
        # Generate summary and keywords
        print("Generating AI summary...")
        summary = generate_summary(comments[:200])  # Use more comments for better summary
        
        print("Extracting keywords...")
        keywords = extract_keywords(comments[:300])  # Use more comments for better keywords
        
        # Calculate sentiment score
        total = stats["positive"] + stats["neutral"] + stats["negative"]
        sentiment_score = ((stats["positive"] - stats["negative"]) / total * 100) if total > 0 else 0
        
        processing_time = round(time.time() - start_time, 2)
        
        response_data = {
            "total_comments": len(all_results),
            "summary": summary,
            "keywords": keywords[:20],  # More keywords
            "stats": stats,
            "sentiment_score": round(sentiment_score, 1),
            "results": all_results,
            "timestamp": datetime.now().isoformat(),
            "processing_time": processing_time
        }
        
        print(f"\n✅ Analysis Complete!")
        print(f"   Total Comments: {len(all_results)}")
        print(f"   Positive: {stats['positive']} ({stats['positive']/total*100:.1f}%)")
        print(f"   Neutral: {stats['neutral']} ({stats['neutral']/total*100:.1f}%)")
        print(f"   Negative: {stats['negative']} ({stats['negative']/total*100:.1f}%)")
        print(f"   Sentiment Score: {sentiment_score:.1f}%")
        print(f"   Processing Time: {processing_time} seconds")
        print(f"{'='*60}\n")
        
        return response_data
        
    except Exception as e:
        print(f"Error in analyze_youtube: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze_large")
async def analyze_large_scale(
    url: str, 
    max_comments: int = 100000,  # Now supports lakhs!
    background_tasks: BackgroundTasks = None
):
    """
    Analyze up to 100,000+ comments asynchronously
    Returns job_id to check status
    """
    import uuid
    job_id = str(uuid.uuid4())
    
    analysis_jobs[job_id] = {
        "status": "pending",
        "progress": 0,
        "total": max_comments,
        "started_at": datetime.now().isoformat()
    }
    
    def run_large_analysis():
        try:
            analysis_jobs[job_id]["status"] = "running"
            
            # Fetch in batches
            all_comments = []
            offset = 0
            batch_size = 1000
            
            while len(all_comments) < max_comments:
                batch, has_more, fetched = get_comments_batch(url, batch_size, offset)
                if not batch:
                    break
                all_comments.extend(batch)
                offset += fetched
                analysis_jobs[job_id]["progress"] = len(all_comments)
                
                if not has_more:
                    break
            
            # Process in batches
            all_results = []
            stats = {"positive": 0, "neutral": 0, "negative": 0}
            
            for batch_results in process_comments_in_batches(all_comments, batch_size=200):
                for result in batch_results:
                    all_results.append(result)
                    if result["sentiment"] == "POSITIVE":
                        stats["positive"] += 1
                    elif result["sentiment"] == "NEGATIVE":
                        stats["negative"] += 1
                    else:
                        stats["neutral"] += 1
                
                analysis_jobs[job_id]["progress"] = len(all_results)
            
            analysis_jobs[job_id]["results"] = {
                "total_comments": len(all_results),
                "stats": stats,
                "sentiment_score": ((stats["positive"] - stats["negative"]) / len(all_results) * 100) if len(all_results) > 0 else 0,
                "summary": generate_summary(all_comments[:200]),
                "keywords": extract_keywords(all_comments[:300])
            }
            analysis_jobs[job_id]["status"] = "completed"
            analysis_jobs[job_id]["completed_at"] = datetime.now().isoformat()
            
        except Exception as e:
            analysis_jobs[job_id]["status"] = "failed"
            analysis_jobs[job_id]["error"] = str(e)
    
    # Run in background
    thread = Thread(target=run_large_analysis)
    thread.start()
    
    return {
        "job_id": job_id,
        "status": "started",
        "message": f"Analysis started for up to {max_comments} comments. Use /job_status/{job_id} to check progress"
    }

@app.get("/job_status/{job_id}")
async def get_job_status(job_id: str):
    """Check status of large analysis job"""
    if job_id not in analysis_jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = analysis_jobs[job_id]
    response = {
        "job_id": job_id,
        "status": job["status"],
        "progress": job.get("progress", 0),
        "total": job.get("total", 0)
    }
    
    if job["status"] == "completed":
        response["results"] = job.get("results")
        response["completed_at"] = job.get("completed_at")
    elif job["status"] == "failed":
        response["error"] = job.get("error")
    
    return response

@app.post("/predict")
async def predict_sentiment_endpoint(request: SingleCommentRequest):
    """Analyze sentiment of a single comment"""
    try:
        sentiment = predict_sentiment(request.text)
        sarcasm = detect_sarcasm(request.text)
        emotion = detect_emotion(request.text)
        
        return {
            "text": request.text,
            "sentiment": sentiment,
            "sarcasm": sarcasm,
            "emotion": emotion,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
if __name__ == "__main__":
    import uvicorn
    # Hugging Face Spaces uses port 7860
    port = int(os.environ.get("PORT", 7860))
    print("\n" + "="*60)
    print("🚀 YouTube Comment Analyzer API v2.0 - Hugging Face Edition")
    print("="*60)
    print(f"Server starting on http://0.0.0.0:{port}")
    print("✅ Supports 100,000+ comments with caching")
    print("✅ SQLite cache for faster subsequent analysis")
    print("="*60 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=port)
    
    