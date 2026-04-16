# 🚀 AI YouTube Comment Analyzer

A production-ready NLP system for analyzing YouTube comments at scale using FastAPI and Transformer-based models.

[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![Hugging Face](https://img.shields.io/badge/Hugging%20Face-Spaces-yellow.svg)](https://huggingface.co/spaces)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

---

## 🔥 Key Highlights

| Metric | Performance |
|--------|-------------|
| Comments Processed | **100,000+** |
| Speed | **1,000 comments < 2 minutes** |
| Analysis Types | Sentiment, Sarcasm, Emotion, Keywords |
| Frontend | Chrome Extension with real-time charts |
| Deployment | Hugging Face Spaces (16GB RAM) |
| Container | Docker ready |

---

## 🧠 System Architecture
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Chrome │────▶│ FastAPI │────▶│ Hugging Face │
│ Extension │◀────│ Backend │◀────│ Transformer │
└─────────────────┘ └─────────────────┘ └─────────────────┘
│
▼
┌─────────────────┐
│ JSON Results │
│ + CSV Export │
└─────────────────┘

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI, Python 3.10+ |
| ML Models | Hugging Face Transformers, PyTorch |
| Frontend | Chrome Extension (Vanilla JS) |
| Deployment | Hugging Face Spaces |
| Container | Docker |
| APIs | REST (5 endpoints) |

---

## 📸 Demo

![Application Screenshot](https://github.com/user-attachments/assets/e01ba6cc-c395-4ade-9a77-0d4069787b6e)

---

## ⚡ Features

### Core Analysis
- ✅ **Sentiment Analysis** - Positive / Neutral / Negative
- 😏 **Sarcasm Detection** - Identifies sarcastic comments
- 😊 **Emotion Recognition** - Joy, Anger, Sadness, Fear, Love, Surprise
- 🔑 **Keyword Extraction** - Top trending topics

### Visualization
- 📊 **Pie Chart** - Sentiment distribution
- ☁️ **Word Cloud** - Clickable keyword visualization
- 📈 **Timeline View** - Sentiment trends

### Export & Integration
- 📥 **CSV Export** - Download analysis results
- 🔍 **Search & Filter** - Filter by keyword or sentiment
- 🔄 **Auto Refresh** - Real-time updates every 2 minutes

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Santu-kumar364/yt-comment-analysis-nlp
cd yt-comment-analysis-nlp

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
