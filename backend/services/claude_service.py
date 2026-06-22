# ================================================================
#  services/claude_service.py  —  AI Analysis Logic (Groq Version)
# ================================================================
#
#  We switched from Anthropic Claude to Groq API.
#  Groq is FREE and extremely fast (runs Llama 3 model).
#
#  HOW GROQ WORKS:
#  - Same concept as Claude — send a prompt, get a response
#  - Uses "llama-3.3-70b-versatile" model (very smart, free)
#  - Returns text which we parse as JSON
#
# ================================================================

import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# ── Build Groq client ─────────────────────────────────────────
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# ── System prompt ─────────────────────────────────────────────
SYSTEM_PROMPT = """You are VeritAI, an expert multimodal fake news detection and fact-verification AI.

Analyze the given content and return ONLY a valid JSON object — no explanation, no markdown, no text outside the JSON.

Return this exact structure:
{
  "verdict": "VERIFIED" | "FAKE" | "SUSPICIOUS" | "STYLE_FAKE",
  "confidence": <integer 0-100>,
  "credibility_score": <integer 0-100>,
  "summary": "<2-3 sentence plain-English verdict explanation>",
  "reasoning": {
    "ml_prediction": "<text style and linguistic signals observed>",
    "fact_check": "<key factual claims and whether they check out>",
    "semantic_analysis": "<tone, sensationalism, emotional manipulation>",
    "source_credibility": "<apparent source quality and reliability>"
  },
  "entities": [
    { "text": "<entity name>", "type": "PERSON" | "ORG" | "GPE" | "DATE" }
  ],
  "suspicious_phrases": ["<phrase1>", "<phrase2>"],
  "key_claims": ["<claim1>", "<claim2>"],
  "wiki_insights": "<relevant factual context in 1-2 sentences>",
  "explanation": "<one sentence XAI explanation of the verdict>"
}

Verdict definitions:
- VERIFIED:    Factually accurate, credible, no sensationalism
- FAKE:        Contains demonstrably false claims or known misinformation
- SUSPICIOUS:  Unverifiable claims, possible bias, lacks credible sourcing
- STYLE_FAKE:  Writing mimics fake news style even if content may be true

Always return valid JSON only. Never include any text outside the JSON object."""


def analyze_text_with_claude(text: str) -> dict:
    """
    Analyze text for fake news using Groq (Llama 3.3 model).
    Function name kept as 'analyze_text_with_claude' so routes
    don't need to be changed.
    """
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",   # Free, very smart model
            max_tokens=1500,
            temperature=0.1,                    # Low = more consistent output
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": f"Analyze this content for fake news:\n\n{text}"
                }
            ]
        )

        # Extract text from response
        raw = response.choices[0].message.content
        return parse_response(raw)

    except Exception as e:
        error_msg = str(e)
        if "invalid_api_key" in error_msg.lower() or "auth" in error_msg.lower():
            return {"error": "Invalid Groq API key. Check your GROQ_API_KEY in .env"}
        elif "rate_limit" in error_msg.lower():
            return {"error": "Rate limit hit. Please wait a moment and try again."}
        else:
            return {"error": f"Analysis failed: {error_msg}"}


def analyze_image_with_claude(image_base64: str, media_type: str) -> dict:
    """
    Analyze image for fake news.
    Groq's Llama vision model handles image + text together.
    """
    try:
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",  # Groq vision model
            max_tokens=1500,
            temperature=0.1,
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{media_type};base64,{image_base64}"
                            }
                        },
                        {
                            "type": "text",
                            "text": (
                                "Analyze this image for fake news and misinformation. "
                                "1) Extract ALL visible text (OCR). "
                                "2) Analyze that text for fake news signals. "
                                "3) Check for signs of image manipulation or misleading visuals. "
                                "Return your full analysis as JSON."
                            )
                        }
                    ]
                }
            ]
        )

        raw = response.choices[0].message.content
        result = parse_response(raw)
        result["source_type"] = "image"
        return result

    except Exception as e:
        return {"error": f"Image analysis failed: {str(e)}"}


def parse_response(raw: str) -> dict:
    """
    Parse the model's text response into a Python dictionary.
    Strips markdown code fences if present.
    """
    cleaned = raw.strip()

    # Remove ```json ... ``` if model adds them
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1]
        cleaned = cleaned.rsplit("```", 1)[0]
        cleaned = cleaned.strip()

    # Find JSON object in response
    start = cleaned.find("{")
    end   = cleaned.rfind("}") + 1
    if start != -1 and end > start:
        cleaned = cleaned[start:end]

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        # Safe fallback if JSON parsing fails
        return {
            "verdict":           "SUSPICIOUS",
            "confidence":        50,
            "credibility_score": 50,
            "summary":           "Analysis completed but response format was unexpected.",
            "reasoning": {
                "ml_prediction":     "Unable to parse detailed reasoning.",
                "fact_check":        "Manual verification recommended.",
                "semantic_analysis": "N/A",
                "source_credibility":"N/A"
            },
            "entities":          [],
            "suspicious_phrases":[],
            "key_claims":        [],
            "wiki_insights":     "",
            "explanation":       f"Parse error: {str(e)}",
        }
