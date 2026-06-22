from flask import Blueprint
import os

health_bp = Blueprint("health", __name__)

@health_bp.route("/health", methods=["GET"])
def health_check():
    # Check for either Groq or Anthropic key
    api_key = os.getenv("GROQ_API_KEY") or os.getenv("ANTHROPIC_API_KEY", "")
    
    return {
        "status": "ok",
        "message": "VeritAI backend is running",
        "api_key_configured": bool(api_key and len(api_key) > 10),
    }