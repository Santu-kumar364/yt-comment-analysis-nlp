from fastapi import FastAPI
from pydantic import BaseModel
from model.model_loader import predict_sentiment
from data.fetch_comments import get_comments_from_url

app = FastAPI()

class Request(BaseModel):
    text: str

class YouTubeRequest(BaseModel):
    url: str
    limit: int = 50

@app.get("/")
def home():
    return {"message": "ML Service Running"}

@app.post("/predict")
def predict(req: Request):
    text = req.text.strip()
    if not text:
        return {"error": "Empty text not allowed"}
    
    sentiment = predict_sentiment(text)
    return {"sentiment": sentiment}

@app.get("/analyze_youtube")
def analyze_youtube(url: str, limit: int = 50):
    try:
        comments = get_comments_from_url(url, limit)
        results = [{"text": c, "sentiment": predict_sentiment(c)} for c in comments]
        return {"results": results}
    except Exception as e:
        return {"error": str(e)}