# ================================================================
#  routes/analyze.py  —  Analysis API Endpoints
# ================================================================
#
#  WHAT ARE ROUTES?
#  Routes are URLs your frontend can call.
#  Example: frontend sends POST request to /api/analyze/text
#           with { "text": "some news article" } in the body
#           backend processes it and returns the analysis result
#
#  REST API conventions used here:
#  - POST = sending data to be processed
#  - GET  = fetching data
#  - Always return JSON
#  - Use proper HTTP status codes (200=OK, 400=Bad Request, 500=Error)
#
# ================================================================

from flask import Blueprint, request, jsonify
from services.claude_service import analyze_text_with_claude, analyze_image_with_claude
import base64

analyze_bp = Blueprint("analyze", __name__)


# ── TEXT ANALYSIS ENDPOINT ────────────────────────────────────
@analyze_bp.route("/analyze/text", methods=["POST"])
def analyze_text():
    """
    POST /api/analyze/text
    
    Request body (JSON):
        { "text": "The news article or headline to analyze" }
    
    Response (JSON):
        { "verdict": "FAKE", "confidence": 92, ... }
    """

    # Step 1: Get the JSON data sent from frontend
    data = request.get_json()

    # Step 2: Validate — make sure text was actually sent
    if not data or not data.get("text"):
        # 400 = Bad Request (client sent wrong/missing data)
        return jsonify({"error": "No text provided"}), 400

    text = data["text"].strip()

    if len(text) < 10:
        return jsonify({"error": "Text too short to analyze"}), 400

    if len(text) > 10000:
        return jsonify({"error": "Text too long (max 10,000 characters)"}), 400

    # Step 3: Call our service (which calls Claude API)
    # We separate "route logic" from "business logic" — this is good architecture
    result = analyze_text_with_claude(text)

    # Step 4: Check if service returned an error
    if "error" in result:
        # 500 = Internal Server Error (our code/API failed)
        return jsonify(result), 500

    # Step 5: Return result to frontend
    # 200 = OK (default, success)
    return jsonify(result), 200


# ── IMAGE ANALYSIS ENDPOINT ───────────────────────────────────
@analyze_bp.route("/analyze/image", methods=["POST"])
def analyze_image():
    """
    POST /api/analyze/image
    
    Request: multipart/form-data with an 'image' file field
    
    Response (JSON):
        { "verdict": "SUSPICIOUS", "confidence": 78, ... }
    """

    # Step 1: Check if an image file was included in the request
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    image_file = request.files["image"]

    # Step 2: Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if image_file.content_type not in allowed_types:
        return jsonify({"error": "Invalid file type. Use JPG, PNG, or WEBP"}), 400

    # Step 3: Read file and convert to base64
    # Claude API needs images as base64-encoded strings (not raw files)
    image_bytes = image_file.read()
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
    media_type = image_file.content_type

    # Step 4: Call Claude service with the image
    print("=== CALLING analyze_image_with_claude ===")
    result = analyze_image_with_claude(image_base64, media_type)
    print(f"=== RESULT KEYS: {list(result.keys())} ===")
    print(f"=== image_origin: {result.get('image_origin', 'NOT FOUND')} ===")

    if "error" in result:
        return jsonify(result), 500

    return jsonify(result), 200
