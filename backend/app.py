# ================================================================
#  app.py  —  Main Flask Application Entry Point
# ================================================================
#
#  WHAT IS THIS FILE?
#  This is the "heart" of your backend. It creates the Flask app,
#  registers all routes (API endpoints), and starts the server.
#
#  HOW FLASK WORKS (quick mental model):
#  Browser/Frontend  →  HTTP Request  →  Flask Route  →  Your Code
#                                                             ↓
#  Browser/Frontend  ←  JSON Response  ←  Flask Route  ←  Result
#
# ================================================================

from flask import Flask
from flask_cors import CORS          # Allows frontend to talk to backend
from dotenv import load_dotenv       # Loads .env file into environment
import os
from db import get_db, close_db, init_db
from routes.auth import auth_bp

# ── Load environment variables from .env file ─────────────────
# This reads ANTHROPIC_API_KEY etc. from your .env file
load_dotenv()

# ── Import our route blueprints ───────────────────────────────
# Blueprints are like "mini-apps" — they group related routes
from routes.analyze import analyze_bp
from routes.news import news_bp
from routes.health import health_bp

# ── Create the Flask application ──────────────────────────────
app = Flask(__name__)

# ── Enable CORS (Cross-Origin Resource Sharing) ───────────────
# Without this, your frontend (localhost:5500) CANNOT talk to
# your backend (localhost:5001) — browser blocks it for security
CORS(app)
app.teardown_appcontext(close_db)

# ── Register Blueprints (route groups) ────────────────────────
# All API routes start with /api/ — this is a REST API convention
app.register_blueprint(auth_bp,     url_prefix='/api')
app.register_blueprint(analyze_bp,  url_prefix="/api")
app.register_blueprint(news_bp,     url_prefix="/api")
app.register_blueprint(health_bp,   url_prefix="/api")

# ── Root route (just for browser testing) ─────────────────────
@app.route("/")
def index():
    return {
        "message": "VeritAI Backend is running!",
        "version": "1.0.0",
        "endpoints": {
            "health":         "GET  /api/health",
            "analyze_text":   "POST /api/analyze/text",
            "analyze_image":  "POST /api/analyze/image",
            "news":           "GET  /api/news",
            "live_headlines": "GET  /api/live-headlines",
        }
    }

# ── Health check (root level, matches what frontend hits) ─────
@app.route('/health')
def health():
    return {'status': 'ok'}, 200

# ── Also expose health under /api/health ──────────────────────
# (health_bp should already cover this, but added as fallback)

# ── Live Headlines — now under /api prefix ────────────────────
# FIX 1: Moved to /api/live-headlines so frontend fetch works
# FIX 2: Added fallback if feedparser is missing
@app.route('/api/live-headlines')
def live_headlines():
    try:
        import feedparser
    except ImportError:
        return {'headlines': [], 'error': 'feedparser not installed. Run: pip install feedparser'}, 200

    try:
        feeds = [
            ('Reuters',        'https://feeds.reuters.com/reuters/topNews'),
            ('Times of India', 'https://timesofindia.indiatimes.com/rssfeedstopstories.cms'),
        ]
        headlines = []
        for source, url in feeds:
            feed = feedparser.parse(url)
            for entry in feed.entries[:4]:
                headlines.append({
                    'title':  entry.get('title', 'No title'),
                    'source': source,
                    'link':   entry.get('link', ''),
                })

        if not headlines:
            return {'headlines': [], 'error': 'Feeds returned no entries (they may be down)'}, 200

        return {'headlines': headlines}, 200

    except Exception as e:
        return {'headlines': [], 'error': str(e)}, 200


# ── Start the server ──────────────────────────────────────────
if __name__ == "__main__":
    # FIX 3: Default port changed to 5001 to match what the frontend expects
    port = int(os.getenv("FLASK_PORT", 5001))
    debug = os.getenv("FLASK_ENV") == "development"

    print(f"""
    ╔══════════════════════════════════════╗
    ║   VeritAI Backend Starting...        ║
    ║   URL:   http://localhost:{port}        ║
    ║   Mode:  {'Development' if debug else 'Production'}                  ║
    ╚══════════════════════════════════════╝
    """)
    init_db(app)
    app.run(host="0.0.0.0", port=port, debug=debug)
