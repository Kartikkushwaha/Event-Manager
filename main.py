import os
import json
import re
import requests
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

# Load environment variables from .env
load_dotenv()

app = FastAPI(title="EventEase Unified API")

# Enable CORS so your local HTML/JS frontend can talk to this server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your exact frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY")

API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key={GEMINI_API_KEY}"

# ==========================================
# GEMINI: INVITATION GENERATOR ENDPOINTS
# ==========================================

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
            print(f" GOOGLE API ERROR [{response.status_code}]:", response.text)
            raise HTTPException(status_code=response.status_code, detail=f"Google API Error: {response.text}")
        
        data = response.json()
        
        # Check if Gemini returned valid candidates
        if "candidates" not in data or not data["candidates"]:
            print(" GEMINI BLOCKED RESPONSE:", data)
            raise HTTPException(status_code=500, detail="AI failed to return a valid layout design.")

        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
        
        # Bulletproof JSON extraction: find ONLY what is between { and }
        match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if not match:
            print(" AI DID NOT RETURN JSON. RAW TEXT:", raw_text)
            raise HTTPException(status_code=500, detail="AI did not return a valid JSON object.")

        clean_json = match.group(0)
        design_data = json.loads(clean_json)
        
        print(" SUCCESS! Sending design data to browser.")
        return {"success": True, "designData": design_data}
        
    except HTTPException as he:
        raise he
    except json.JSONDecodeError as jde:
        print("JSON PARSE ERROR:", str(jde))
        raise HTTPException(status_code=500, detail="Failed to parse layout JSON from AI.")
    except Exception as e:
        print(" BACKEND CRASH:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# TOMTOM: MAPS, POI SEARCH, & ROUTING ENDPOINTS
# ==========================================

@app.get("/api/search")
async def search_poi(query: str, lat: float, lon: float, radius: int):
    url = f"https://api.tomtom.com/search/2/poiSearch/{query}.json"
    params = {
        "key": TOMTOM_API_KEY,
        "lat": lat,
        "lon": lon,
        "radius": radius,
        "limit": 20
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="TomTom Search API error")
        return response.json()

@app.get("/api/route")
async def get_route(start_lat: float, start_lon: float, dest_lat: float, dest_lon: float):
    url = f"https://api.tomtom.com/routing/1/calculateRoute/{start_lat},{start_lon}:{dest_lat},{dest_lon}/json"
    params = {
        "key": TOMTOM_API_KEY,
        "routeType": "fastest",
        "traffic": "false"
    }
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="TomTom Routing API error")
        return response.json()

@app.get("/api/tiles/{layer}/{style}/{z}/{x}/{y}.{ext}")
async def get_tile(layer: str, style: str, z: int, x: int, y: int, ext: str):
    """Proxies map tiles so the frontend doesn't need the API key for Leaflet."""
    url = f"https://api.tomtom.com/map/1/tile/{layer}/{style}/{z}/{x}/{y}.{ext}?key={TOMTOM_API_KEY}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return Response(content=response.content, media_type=response.headers.get("Content-Type"))