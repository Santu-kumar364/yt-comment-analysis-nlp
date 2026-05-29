
---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API information and version |
| GET | `/health` | Health check for monitoring |
| GET | `/analyze_youtube` | Analyze YouTube video comments |
| POST | `/analyze_large` | Asynchronous analysis for large datasets |
| GET | `/job_status/{job_id}` | Check background job status |
| POST | `/predict` | Analyze a single comment |

**Live API Documentation:** https://santu578-yt-comment-analyzer.hf.space/docs

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI, Python 3.10+ |
| ML Models | Hugging Face Transformers, PyTorch (CPU-optimized) |
| Frontend | Chrome Extension (Vanilla JS) |
| Deployment | Hugging Face Spaces |
| Container | Docker |
| APIs | REST (5 endpoints with OpenAPI spec) |

---

## 📸 Demo

![Application Demo](https://github.com/user-attachments/assets/ebe6b194-2450-4069-bad1-a3d95b9fe9d8)

---

## ⚡ Features

### Core Analysis
- ✅ **Sentiment Analysis** - Positive / Neutral / Negative with confidence scores
- 😏 **Sarcasm Detection** - Identifies sarcastic comments using specialized models
- 😊 **Emotion Recognition** - Joy, Anger, Sadness, Fear, Love, Surprise, Amusement, Excitement
- 🔑 **Keyword Extraction** - Top trending topics using KeyBERT

### Visualization (Chrome Extension)
- 📊 **Pie Chart** - Interactive sentiment distribution
- ☁️ **Word Cloud** - Clickable keyword visualization
- 📈 **Timeline View** - Sentiment trends over comments
- 📊 **Progress Bar** - Real-time analysis progress

### Export & Integration
- 📥 **CSV Export** - Download full analysis results
- 🔍 **Search & Filter** - Filter by keyword or sentiment type
- 🔄 **Auto Refresh** - Real-time updates every 2 minutes
- 📱 **Draggable Panel** - Move the analyzer anywhere on screen

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Santu-kumar364/yt-comment-analysis-nlp
cd yt-comment-analysis-nlp
