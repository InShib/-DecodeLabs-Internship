import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

app = Flask(__name__)

API_KEY = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=API_KEY) if API_KEY else None


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/generate", methods=["POST"])
def generate_copy():
    if not client:
        return jsonify({
            "error": "Gemini API key is missing. Add GEMINI_API_KEY to your .env file."
        }), 500

    data = request.get_json(silent=True) or {}

    product_name = data.get("product_name", "").strip()
    description = data.get("description", "").strip()
    platform = data.get("platform", "Instagram")
    tone = data.get("tone", "Friendly")

    try:
        temperature = float(data.get("temperature", 0.7))
        top_p = float(data.get("top_p", 0.9))
    except (ValueError, TypeError):
        return jsonify({"error": "Temperature and Top-P must be numbers."}), 400

    if not product_name or not description:
        return jsonify({
            "error": "Please enter both the product name and description."
        }), 400

    if not 0 <= temperature <= 2:
        return jsonify({"error": "Temperature must be between 0 and 2."}), 400

    if not 0 < top_p <= 1:
        return jsonify({"error": "Top-P must be greater than 0 and at most 1."}), 400

    prompt = f"""
You are an expert marketing copywriter.

Create marketing copy using the following details:

Product name: {product_name}
Product description: {description}
Target platform: {platform}
Desired tone: {tone}

Instructions:
- Adapt the content to the selected platform.
- Maintain the requested tone.
- Highlight the product's key benefits.
- Make the copy engaging and easy to read.
- Include a suitable call to action.
- For Instagram, include relevant hashtags where appropriate.
- For email, include a suitable subject line.
- Do not invent product claims that were not provided.
- Return only the generated marketing copy.
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=temperature,
                top_p=top_p,
                max_output_tokens=800
            )
        )

        generated_text = response.text

        if not generated_text:
            return jsonify({
                "error": "The AI returned an empty response. Please try again."
            }), 502

        return jsonify({"generated_copy": generated_text})

    except Exception as error:
        print("Gemini API error:", error)
        return jsonify({
            "error": "Content generation failed. Check your API key, quota, model availability, and internet connection."
        }), 502


if __name__ == "__main__":
    app.run(debug=True)