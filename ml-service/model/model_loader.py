from transformers import pipeline
from keybert import KeyBERT
import torch
import re
from collections import Counter
import numpy as np

# Check if GPU is available
device = 0 if torch.cuda.is_available() else -1
print(f"Using device: {'GPU' if torch.cuda.is_available() else 'CPU'}")

# Load sentiment analysis model
print("Loading sentiment analysis model...")
sentiment_model = pipeline(
    "sentiment-analysis",
    model="cardiffnlp/twitter-roberta-base-sentiment-latest",
    device=device,
    truncation=True,
    max_length=512
)

# Load sarcasm detection model
print("Loading sarcasm detection model...")
sarcasm_model = pipeline(
    "text-classification",
    model="cardiffnlp/twitter-roberta-base-irony",
    device=device,
    truncation=True,
    max_length=512
)

# Load emotion detection model
print("Loading emotion detection model...")
emotion_model = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    device=device,
    truncation=True,
    max_length=512
)

# Load summarizer
print("Loading summarizer model...")
summarizer = pipeline(
    "summarization",
    model="facebook/bart-large-cnn",
    device=device,
    truncation=True,
    max_length=1024
)

# Load keyword extractor
print("Loading keyword extractor...")
kw_model = KeyBERT()

print("All models loaded successfully!")

# Positive and negative word lists for fallback
POSITIVE_WORDS = {
    'love', '❤️', '💕', '💓', '💗', '💖', '💘', '💝',
    'great', 'amazing', 'awesome', 'fantastic', 'wonderful',
    'beautiful', 'perfect', 'excellent', 'brilliant',
    'fan', 'favorite', 'favourite', 'best', 'good', 'nice',
    'like', 'enjoy', 'appreciate', 'thank', 'thanks', 'legend'
}

NEGATIVE_WORDS = {
    'hate', 'bad', 'terrible', 'awful', 'horrible', 'sucks',
    'dislike', 'worst', 'poor', 'disappointing', 'waste',
    'boring', 'useless', 'trash', 'garbage', 'cringe',
    'overrated', 'hated', 'annoying', 'stupid', 'dumb'
}

def safe_truncate(text, max_length=512):
    """Safely truncate text to max_length characters"""
    if not text:
        return ""
    if len(text) > max_length:
        return text[:max_length]
    return text

def clean_text(text: str) -> tuple:
    """Clean and normalize text"""
    if not text:
        return "", ""
    text = ' '.join(text.split())
    text_lower = text.lower()
    return text, text_lower

def predict_sentiment(text: str) -> str:
    """
    FIXED: Unbiased sentiment prediction
    Let the model decide without forcing positive/neutral
    """
    try:
        if not text or len(text.strip()) < 2:
            return "NEUTRAL"
        
        # Clean and truncate
        text = safe_truncate(text, 512)
        original_text = text
        text, text_lower = clean_text(text)
        
        # Get model prediction (primary source)
        try:
            result = sentiment_model(text)[0]
            model_label = result['label']
            model_score = result['score']
            
            # Map model labels to our categories
            # LABEL_0 = Negative, LABEL_1 = Neutral, LABEL_2 = Positive
            if model_label == "LABEL_0":
                return "NEGATIVE"
            elif model_label == "LABEL_2":
                return "POSITIVE"
            elif model_label == "LABEL_1":
                # Only return neutral if confidence is high
                if model_score > 0.8:
                    return "NEUTRAL"
                # Otherwise, check keywords to decide
                pass
                
        except Exception as model_err:
            print(f"Model error: {model_err}")
            # Fall through to keyword analysis
        
        # Keyword-based analysis (fallback only)
        pos_count = sum(1 for word in POSITIVE_WORDS if word in text_lower)
        neg_count = sum(1 for word in NEGATIVE_WORDS if word in text_lower)
        
        # Simple majority rule for keywords
        if pos_count > neg_count and pos_count > 0:
            return "POSITIVE"
        elif neg_count > pos_count and neg_count > 0:
            return "NEGATIVE"
        
        # Default to neutral only if absolutely no signal
        return "NEUTRAL"
        
    except Exception as e:
        print(f"Error in sentiment analysis: {e}")
        return "NEUTRAL"

def detect_sarcasm(text: str) -> str:
    """Detect sarcasm in comment"""
    try:
        if not text:
            return "NO"
        
        text = safe_truncate(text, 512)
        if len(text.strip()) < 3:
            return "NO"
        
        result = sarcasm_model(text)[0]
        # LABEL_1 = sarcastic
        return "YES" if result['label'] == "LABEL_1" and result['score'] > 0.55 else "NO"
    except Exception as e:
        return "NO"

def detect_emotion(text: str) -> str:
    """Detect emotion in comment"""
    try:
        if not text:
            return "neutral"
        
        # Emoji-based fast detection
        if '😭' in text or '😢' in text:
            return "sadness"
        elif '😊' in text or '😍' in text or '🥰' in text:
            return "joy"
        elif '😂' in text or '🤣' in text:
            return "amusement"
        elif '❤️' in text or '💕' in text:
            return "love"
        elif '🎉' in text or '🎊' in text:
            return "excitement"
        elif '😠' in text or '🤬' in text:
            return "anger"
        elif '😨' in text or '😱' in text:
            return "fear"
        
        # Model-based detection
        text = safe_truncate(text, 512)
        if len(text.strip()) < 3:
            return "neutral"
        
        result = emotion_model(text)[0]
        return result['label']
    except Exception as e:
        return "neutral"

def generate_summary(texts: list) -> str:
    """Generate summary of all comments"""
    try:
        if not texts:
            return "No comments to summarize"
        
        sample_size = min(100, len(texts))
        combined = " ".join(texts[:sample_size])
        combined = safe_truncate(combined, 1024)
        
        if len(combined) < 50:
            return "Not enough comments to generate summary"
        
        summary = summarizer(combined, max_length=150, min_length=40, do_sample=False)
        return summary[0]['summary_text']
    except Exception as e:
        print(f"Error in summary generation: {e}")
        return "Summary generation failed"

def extract_keywords(texts: list, top_n=15):
    """Extract keywords from comments"""
    try:
        if not texts:
            return []
        
        sample_size = min(200, len(texts))
        combined = " ".join(texts[:sample_size])
        combined = safe_truncate(combined, 2000)
        
        if len(combined) < 20:
            return []
        
        keywords = kw_model.extract_keywords(
            combined, 
            keyphrase_ngram_range=(1, 2), 
            stop_words='english', 
            top_n=top_n
        )
        return [kw[0] for kw in keywords if kw and kw[0]]
    except Exception as e:
        print(f"Error in keyword extraction: {e}")
        # Fallback: simple word frequency
        words = combined.lower().split()
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
                     'to', 'for', 'of', 'in', 'on', 'at', 'by', 'with', 'without', 'i', 
                     'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'these', 'those'}
        word_freq = {}
        for word in words:
            word = word.strip('.,!?;:()[]{}"\'')
            if len(word) > 2 and word not in stop_words and not word.isdigit():
                word_freq[word] = word_freq.get(word, 0) + 1
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:top_n]
        return [word for word, count in sorted_words]

def process_comments_in_batches(comments, batch_size=100):
    """Process comments in batches"""
    total = len(comments)
    
    if total == 0:
        return
    
    print(f"Processing {total} comments in batches of {batch_size}...")
    
    for i in range(0, total, batch_size):
        batch = comments[i:i+batch_size]
        batch_results = []
        
        for comment in batch:
            try:
                if not comment or len(comment.strip()) < 2:
                    batch_results.append({
                        "text": comment if comment else "",
                        "sentiment": "NEUTRAL",
                        "sarcasm": "NO",
                        "emotion": "neutral"
                    })
                    continue
                
                sentiment = predict_sentiment(comment)
                sarcasm = detect_sarcasm(comment)
                emotion = detect_emotion(comment)
                
                batch_results.append({
                    "text": comment,
                    "sentiment": sentiment,
                    "sarcasm": sarcasm,
                    "emotion": emotion
                })
            except Exception as e:
                batch_results.append({
                    "text": comment if comment else "",
                    "sentiment": "NEUTRAL",
                    "sarcasm": "NO",
                    "emotion": "unknown"
                })
        
        yield batch_results
        
        if (i // batch_size + 1) % 10 == 0 or (i + batch_size) >= total:
            processed = min(i + batch_size, total)
            print(f"  Processed batch {i//batch_size + 1}/{(total + batch_size - 1)//batch_size} ({processed}/{total} comments)")

def get_batch_stats(results_batches):
    """Aggregate statistics from batch results"""
    stats = {"positive": 0, "neutral": 0, "negative": 0}
    all_results = []
    
    for batch in results_batches:
        for item in batch:
            all_results.append(item)
            if item["sentiment"] == "POSITIVE":
                stats["positive"] += 1
            elif item["sentiment"] == "NEGATIVE":
                stats["negative"] += 1
            else:
                stats["neutral"] += 1
    
    return stats, all_results

def get_sentiment_score(stats):
    """Calculate overall sentiment score"""
    total = stats["positive"] + stats["neutral"] + stats["negative"]
    if total == 0:
        return 0
    return ((stats["positive"] - stats["negative"]) / total) * 100