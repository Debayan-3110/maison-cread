import os
from pathlib import Path
from typing import List, Dict
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI, OpenAIError

# Load environment variables from .env file
load_dotenv()

# Initialize FastAPI application
app = FastAPI(
    title="E-Commerce AI Shopping Assistant",
    description="Production-ready FastAPI e-commerce AI chatbot powered by OpenAI GPT-3.5-Turbo",
    version="1.0.0"
)

# Enable CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# System prompt as specified
SYSTEM_PROMPT = (
    "You are an AI shopping assistant. Help customers find products by asking about "
    "their budget, preferences, and needs. Recommend 3-5 products that match their "
    "requirements. Be friendly, conversational, and helpful. Suggest complementary "
    "items when relevant."
)

# Global conversation history storage
conversation_history: List[Dict[str, str]] = [
    {"role": "system", "content": SYSTEM_PROMPT}
]

# Request & Response schemas
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

# Helper to get configured OpenAI client
def get_openai_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY environment variable is not set. Please add it to your .env file."
        )
    # Set 30 second client timeout
    return OpenAI(api_key=api_key, timeout=30.0)

# Static files directory
BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
STATIC_DIR.mkdir(exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/", include_in_schema=False)
def serve_index():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {
        "status": "online",
        "message": "AI Shopping Assistant API running. Please add static/index.html."
    }

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    user_message = req.message.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        # Check API key configuration
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key or api_key.strip() == "your_openai_api_key_here":
            fallback_reply = (
                "⚠️ **OpenAI API Key Missing**: Please set your `OPENAI_API_KEY` in the `.env` file.\n\n"
                "Once configured, I will be ready to help you discover products, suggest recommendations, "
                "and assist you with your shopping needs!"
            )
            return ChatResponse(reply=fallback_reply)

        client = OpenAI(api_key=api_key, timeout=30.0)

        # Append user message to global history
        conversation_history.append({"role": "user", "content": user_message})

        # OpenAI Chat Completion with gpt-3.5-turbo and 30-second timeout
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=conversation_history,
            timeout=30.0,
            temperature=0.7,
        )

        ai_reply = response.choices[0].message.content or "I couldn't generate a response. Please try again."

        # Append AI reply to global history
        conversation_history.append({"role": "assistant", "content": ai_reply})

        return ChatResponse(reply=ai_reply)

    except OpenAIError as e:
        # Graceful handling for OpenAI API errors
        error_msg = f"OpenAI API Error: {str(e)}"
        raise HTTPException(status_code=502, detail=error_msg)
    except Exception as e:
        # General exception handling
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.post("/reset")
def reset_history():
    """Reset global conversation history back to the initial system prompt."""
    global conversation_history
    conversation_history = [{"role": "system", "content": SYSTEM_PROMPT}]
    return {"status": "success", "message": "Conversation history reset successfully."}

@app.get("/history")
def get_history():
    """Retrieve the current global conversation history."""
    return {"history": conversation_history}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
