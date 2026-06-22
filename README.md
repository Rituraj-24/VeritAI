# VeritAI — Multimodal Fake News Detector
### Flask Backend + React Frontend + Claude API

---

## Project Structure

```
veritai/
│
├── backend/                    ← Flask Python Backend
│   ├── app.py                  ← Main server (entry point)
│   ├── requirements.txt        ← Python dependencies
│   ├── .env.example            ← Copy this to .env
│   │
│   ├── routes/                 ← API endpoints (URLs)
│   │   ├── __init__.py
│   │   ├── health.py           ← GET  /api/health
│   │   ├── analyze.py          ← POST /api/analyze/text  +  /api/analyze/image
│   │   └── news.py             ← GET  /api/news
│   │
│   └── services/               ← Business logic (AI processing)
│       ├── __init__.py
│       └── claude_service.py   ← Calls Claude API, parses response
│
└── frontend/                   ← React Frontend
    ├── index.html              ← Main HTML page
    ├── css/
    │   └── style.css           ← All styling
    └── js/
        └── app.js              ← React components + API calls
```

---

## Setup (Step by Step)

### Step 1 — Clone / Download the project
Open the `veritai/` folder in VS Code.

### Step 2 — Set up the Backend

Open VS Code terminal (`Ctrl + backtick`) and run:

```bash
# Go into backend folder
cd backend

# Create a virtual environment (keeps dependencies isolated)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy language model (for NER)
python -m spacy download en_core_web_sm
```

### Step 3 — Add your API Key

```bash
# Copy the example file
cp .env.example .env
```

Now open `.env` in VS Code and replace the placeholder:
```
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

Get your key from: https://console.anthropic.com

### Step 4 — Run the Backend

```bash
python app.py
```

You should see:
```
╔══════════════════════════════════════╗
║   VeritAI Backend Starting...        ║
║   URL:   http://localhost:5000        ║
╚══════════════════════════════════════╝
```

Test it in browser: http://localhost:5000/api/health

### Step 5 — Run the Frontend

1. Open VS Code
2. Install "Live Server" extension (if not already)
3. Open `frontend/index.html`
4. Right-click → **Open with Live Server**
5. Browser opens at `http://127.0.0.1:5500`

---

## How It All Works Together

```
[You type text]
      ↓
[React frontend — app.js]
      ↓  fetch("http://localhost:5000/api/analyze/text", { method: "POST", body: text })
[Flask Backend — routes/analyze.py]
      ↓  calls analyze_text_with_claude(text)
[Service — services/claude_service.py]
      ↓  client.messages.create(model="claude-sonnet...", messages=[...])
[Claude API (Anthropic)]
      ↓  returns JSON analysis
[Back up the chain to React]
      ↓
[UI updates with verdict, confidence, entities, etc.]
```

---

## API Endpoints Reference

| Method | URL                    | What it does                        |
|--------|------------------------|-------------------------------------|
| GET    | /api/health            | Check if backend is running         |
| POST   | /api/analyze/text      | Analyze text for fake news          |
| POST   | /api/analyze/image     | Analyze image (OCR + analysis)      |
| GET    | /api/news              | Fetch live news headlines            |
| GET    | /api/news?category=technology | Filter by category          |

---

## Common Issues

**"Cannot connect to backend"**
→ Make sure `python app.py` is running in a terminal

**"Invalid API key"**
→ Check your `.env` file has the correct key (no spaces around `=`)

**"CORS error" in browser console**
→ Make sure you're opening frontend via Live Server (port 5500), not by double-clicking the file

**Port already in use**
→ Change `FLASK_PORT=5001` in `.env`
