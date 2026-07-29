import os
import json
import re
import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Load environment variables from .env
load_dotenv()

app = FastAPI(title="AI Invitation Generator API")

# Enable CORS so your local HTML/JS frontend can talk to this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your exact frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"

# Define the expected structure of the incoming request body
class PromptRequest(BaseModel):
    prompt: str

@app.post("/api/generate")
def generate_invitation(request: PromptRequest):
    
    
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Please provide an event prompt.")

    system_instruction = f"""You are a layout designer. Analyze the user's invitation prompt and extract the content into a strict JSON format so it can be painted onto an image canvas.
    Return ONLY a JSON object with this exact structure (no markdown, no backticks, just raw JSON):
    {{
      "bgColor1": "#HexCode (primary background color requested)",
      "bgColor2": "#HexCode (secondary gradient color)",
      "textColor": "#HexCode (best contrasting color for text)",
      "heading": "The main invitation title",
      "subheading": "Name or primary highlight",
      "details": ["Line 1 of details", "Line 2 of details", "Line 3 of details"]
    }}
    User Prompt: {request.prompt}"""

    payload = {
        "contents": [{"parts": [{"text": system_instruction}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 1000,
            "responseMimeType": "application/json"
        }
    }

    try:
        # Call the Google Gemini API securely from the Python server
        response = requests.post(
            API_URL,
            headers={"Content-Type": "application/json"},
            json=payload
        )
        
        # If Google rejects the request, print the exact error to your terminal!
        if response.status_code != 200:
            print(f"❌ GOOGLE API ERROR [{response.status_code}]:", response.text)
            raise HTTPException(status_code=response.status_code, detail=f"Google API Error: {response.text}")
        
        data = response.json()
        
        # Check if Gemini returned valid candidates
        if "candidates" not in data or not data["candidates"]:
            print("❌ GEMINI BLOCKED RESPONSE:", data)
            raise HTTPException(status_code=500, detail="AI failed to return a valid layout design.")

        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
        
        # Bulletproof JSON extraction: find ONLY what is between { and }
        match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if not match:
            print("❌ AI DID NOT RETURN JSON. RAW TEXT:", raw_text)
            raise HTTPException(status_code=500, detail="AI did not return a valid JSON object.")

        clean_json = match.group(0)
        design_data = json.loads(clean_json)
        
        print("✅ SUCCESS! Sending design data to browser.")
        return {"success": True, "designData": design_data}
        
    except HTTPException as he:
        raise he
    except json.JSONDecodeError as jde:
        print("❌ JSON PARSE ERROR:", str(jde))
        raise HTTPException(status_code=500, detail="Failed to parse layout JSON from AI.")
    except Exception as e:
        print("❌ BACKEND CRASH:", str(e))
        raise HTTPException(status_code=500, detail=str(e))