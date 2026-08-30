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
    allow_credentials=False, 
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY")  
SCRAPER_API_KEY = os.getenv("SCRAPER_API_KEY") 


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
            "responseMimeType": "application/json"
        }
    }

    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
    }

    # Primary model with fallback chain
    model_chain = [
        "gemini-3.5-flash",       # Primary attempt
        "gemini-3.5-flash-lite",  # First fallback
        "gemini-3.1-flash-lite"   # Second fallback
    ]

    for model in model_chain:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        
        try:
            # 5-second timeout constraint
            response = requests.post(url, headers=headers, json=payload, timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                if "candidates" in data and data["candidates"]:
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    
                    match = re.search(r"\{.*\}", raw_text, re.DOTALL)
                    if match:
                        clean_json = match.group(0)
                        design_data = json.loads(clean_json)
                        print(f" SUCCESS! Generated using {model}")
                        return {"success": True, "designData": design_data, "model_used": model}
            
            print(f"[{model}] Failed with status {response.status_code}. Shifting to fallback...")

        except requests.exceptions.Timeout:
            print(f"[{model}] Timed out after 5 seconds. Shifting to fallback...")
        except requests.exceptions.RequestException as e:
            print(f"[{model}] Network error: {e}. Shifting to fallback...")
        except json.JSONDecodeError:
            print(f"[{model}] Invalid JSON output. Shifting to fallback...")

    # If all models in the chain fail or time out
    raise HTTPException(
        status_code=503, 
        detail="Due to heavy traffic we can't process your request. Please try after few seconds."
    )

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
        "limit": 50
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

    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
    }

    model_chain = [
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.1-flash-lite"
    ]

    error_log = []

    for model in model_chain:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=25)
            
            if response.status_code == 200:
                data = response.json()
                if "candidates" in data and data["candidates"]:
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    
                    clean_text = re.sub(r"^```(?:json)?\s*", "", raw_text, flags=re.IGNORECASE)
                    clean_text = re.sub(r"\s*```$", "", clean_text).strip()

                    if not (clean_text.startswith("{") and clean_text.endswith("}")):
                        match = re.search(r"\{.*\}", clean_text, re.DOTALL)
                        if match:
                            clean_text = match.group(0)

                    structured_data = json.loads(clean_text)
                    return {"success": True, "data": structured_data, "model_used": model}
            else:
                error_log.append(f"[{model}] {response.status_code}: {response.text}")

        except requests.exceptions.Timeout:
            error_log.append(f"[{model}] Timed out after 25s")
        except Exception as e:
            error_log.append(f"[{model}] Error: {str(e)}")

    # Print to terminal AND send directly to frontend UI
    debug_message = " | ".join(error_log)
    print("DIAGNOSTIC LOG:", debug_message)
    
    raise HTTPException(
        status_code=503, 
        detail=f"Diagnostics: {debug_message}"
    )
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
