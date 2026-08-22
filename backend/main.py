import os
import json
import re
import time  # Added for exponential backoff
import requests
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="EventEase Unified API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY")  
SCRAPER_API_KEY = os.getenv("SCRAPER_API_KEY") 

# Updated API URL without the ?key= parameter
API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"


# ==========================================
# GEMINI: INVITATION GENERATOR ENDPOINTS
# ==========================================

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
        # Implemented Exponential Backoff Retry Logic
        max_retries = 3
        for attempt in range(max_retries):
            # Added x-goog-api-key header for authentication
            response = requests.post(
                API_URL,
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": GEMINI_API_KEY
                },
                json=payload
            )
            
            # Handle server overload
            if response.status_code == 503:
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Wait 1s, then 2s, then fail
                    continue
                else:
                    return {"success": False, "detail": "Please try again..."}
            
            # Handle other API errors
            elif response.status_code != 200:
                print(f" GOOGLE API ERROR [{response.status_code}]:", response.text)
                raise HTTPException(status_code=response.status_code, detail=f"Google API Error: {response.text}")
            
            break # Break the loop if successful

        data = response.json()
        
        if "candidates" not in data or not data["candidates"]:
            print(" GEMINI BLOCKED RESPONSE:", data)
            raise HTTPException(status_code=500, detail="AI failed to return a valid layout design.")

        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
        
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
    url = f"https://api.tomtom.com/map/1/tile/{layer}/{style}/{z}/{x}/{y}.{ext}?key={TOMTOM_API_KEY}"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        return Response(content=response.content, media_type=response.headers.get("Content-Type"))


# ==========================================
# GEMINI: EVENT SUGGESTION ENDPOINT
# ==========================================

@app.post("/api/suggest")
def generate_suggestion(request: PromptRequest):
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Please provide a prompt.")

    system_instruction = f"""You are an expert event planning assistant. 
    Analyze the user's query and provide 4 to 6 highly specific, practical and person suggestions.
    Return ONLY a JSON object with this exact structure (no markdown fences, no backticks):
    {{
      "suggestions": [
        {{
          "item": "Name of the item/concept",
          "description": "Short explanation of how it is used in this specific event context"
        }}
      ]
    }}
    User Query: {request.prompt}"""

    payload = {
        "contents": [{"parts": [{"text": system_instruction}]}],
        "generationConfig": {
            "temperature": 0.4,
            "maxOutputTokens": 1500, 
            "responseMimeType": "application/json" 
        }
    }

    try:
        # Implemented Exponential Backoff Retry Logic
        max_retries = 3
        for attempt in range(max_retries):
            # Added x-goog-api-key header for authentication
            response = requests.post(
                API_URL,
                headers={
                    "Content-Type": "application/json",
                    "x-goog-api-key": GEMINI_API_KEY
                },
                json=payload
            )
            
            if response.status_code == 503:
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                else:
                    raise HTTPException(status_code=503, detail="The AI service is currently experiencing high demand. Please try again in a few moments.")
            
            elif response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=f"Google API Error: {response.text}")
            
            break

        data = response.json()
        
        if "candidates" not in data or not data["candidates"]:
            raise HTTPException(status_code=500, detail="AI failed to return a valid suggestion.")

        raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        
        clean_text = re.sub(r"^```(?:json)?\s*", "", raw_text, flags=re.IGNORECASE)
        clean_text = re.sub(r"\s*```$", "", clean_text).strip()

        if not (clean_text.startswith("{") and clean_text.endswith("}")):
            match = re.search(r"\{.*\}", clean_text, re.DOTALL)
            if match:
                clean_text = match.group(0)

        structured_data = json.loads(clean_text)
        return {"success": True, "data": structured_data}
        
    except json.JSONDecodeError as e:
        print(f"JSON PARSE ERROR: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI JSON response.")
    except Exception as e:
        print(" BACKEND CRASH:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# SCRAPERAPI: E-COMMERCE PRODUCT SEARCH
# ==========================================

@app.get("/api/products/search")
async def search_ecommerce_products(query: str):
    if not SCRAPER_API_KEY:
        raise HTTPException(status_code=500, detail="ScraperAPI key is missing in environment variables.")
    
    if not query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")

    scraper_url = "https://api.scraperapi.com/structured/google/shopping"
    
    params = {
        "api_key": SCRAPER_API_KEY,
        "query": query,
        "country": "in",  
        "tld": "co.in",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(scraper_url, params=params)
            
            if response.status_code != 200:
                print(f"ScraperAPI Error [{response.status_code}]: {response.text}")
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch products from ScraperAPI.")
            
            data = response.json()
            
            if "shopping_results" in data:
                return {"success": True, "results": data["shopping_results"]}
            else:
                return {"success": True, "results": []}

    except httpx.ReadTimeout:
        raise HTTPException(status_code=504, detail="ScraperAPI request timed out. Try again.")
    except Exception as e:
        print("ScraperAPI Backend Crash:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
