# 🚀 AI YouTube Comment Analyzer

A production-ready NLP system for analyzing YouTube comments at scale using FastAPI and Transformer-based models.  
**Live Demo:** [Hugging Face Space](https://santu578-yt-comment-analyzer.hf.space) | **API Docs:** [Swagger UI](https://santu578-yt-comment-analyzer.hf.space/docs)

[![Python 3.10+](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![Hugging Face](https://img.shields.io/badge/Hugging%20Face-Spaces-yellow.svg)](https://huggingface.co/spaces)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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
| API Endpoints | 5 REST endpoints with Swagger docs |

---

## 🧠 System Architecture

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
