import os
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
from google import genai

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)

# Get Gemini API key
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError(
        "GEMINI_API_KEY is missing. Please check your .env file."
    )

# Connect to Gemini
client = genai.Client(api_key=api_key)

SYSTEM_INSTRUCTION = (
    "You are a friendly and helpful AI assistant. "
    "Answer clearly, naturally, and simply. "
    "Use the previous messages to understand the conversation. "
    "If you do not know a current fact, be honest about it."
)

# In-memory conversation history
conversation_history = []


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    global conversation_history

    data = request.get_json(silent=True) or {}
    user_message = data.get("message", "").strip()

    # Validate user input
    if not user_message:
        return jsonify({
            "error": "Please enter a message."
        }), 400

    # Add user message to conversation history
    conversation_history.append({
        "role": "user",
        "content": user_message
    })

    try:
        # Format the conversation history
        history_text = "\n\n".join(
            f"{'User' if message['role'] == 'user' else 'Assistant'}: "
            f"{message['content']}"
            for message in conversation_history
        )

        # Send the conversation to Gemini
        response = client.interactions.create(
            model="gemini-3.8-flash",
            input=history_text,
            system_instruction=SYSTEM_INSTRUCTION
        )

        assistant_message = response.output_text

        if not assistant_message:
            assistant_message = (
                "I couldn't generate a response. Please try again."
            )

        # Store assistant response in memory
        conversation_history.append({
            "role": "assistant",
            "content": assistant_message
        })

        return jsonify({
            "reply": assistant_message
        })

    except Exception as error:
        # Remove the unanswered user message if the API call fails
        conversation_history.pop()

        app.logger.exception("Chat request failed")

        return jsonify({
            "error": (
                "Unable to get a response from the AI service. "
                "Please try again later. "
                f"Details: {type(error).__name__}: {error}"
            )
        }), 500


if __name__ == "__main__":
    app.run(debug=True)