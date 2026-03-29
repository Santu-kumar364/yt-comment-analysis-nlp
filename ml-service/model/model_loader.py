# model_loader.py
from transformers import pipeline

# ---------------- Pretrained sentiment model ----------------
# Using HuggingFace DistilBERT for sentiment analysis
classifier = pipeline("sentiment-analysis")

def predict_sentiment(text: str) -> str:
    """
    Predict the sentiment of a given text.
    Returns: 'POSITIVE', 'NEGATIVE', 'NEUTRAL', or 'INVALID'
    """
    text = text.strip()

    # ❌ Invalid input: too short or no alphabetic characters
    if len(text) < 3 or not any(c.isalpha() for c in text):
        return "INVALID"

    try:
        # HuggingFace prediction
        result = classifier(text)[0]  # {'label': 'POSITIVE', 'score': 0.9876}
        label = result['label']
        score = result['score']

        # ✅ Define NEUTRAL threshold
        if 0.4 < score < 0.7:
            return "NEUTRAL"

        return label

    except Exception as e:
        print(f"ML prediction error: {e}")
        return "ERROR"