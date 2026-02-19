import google.generativeai as genai
import os
from dotenv import load_dotenv
from typing import Optional

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def analyze_image(image_bytes: bytes) -> str:
    if not GEMINI_API_KEY:
        return "Error: GEMINI_API_KEY not configured."
    
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        
        # Prepare content parts
        image_part = {
            "mime_type": "image/jpeg", # Assuming JPEG for simplicity, or we can detect
            "data": image_bytes
        }
        
        prompt = """
        Analyze this image of a hotel cleaning daily report.
        Extract the following information for each row/room:
        - Room Number (部屋番号)
        - Bed Staff Name (Bed担当者) - if empty or same as single name, infer reasonable default or leave null
        - Bath Staff Name (Bath担当者)
        - Towel Count (タオル) - 1 if circled/checked, 0 if not
        
        Return the result STRICTLY as a JSON array of objects with keys: "room", "bed_staff", "bath_staff", "towel" (0 or 1).
        Example: [{"room": "701", "bed_staff": "Lama", "bath_staff": "Rita", "towel": 0}, ...]
        Do not include markdown formatting like ```json ... ```. just the raw json string.
        """
        
        response = model.generate_content([prompt, image_part])
        return response.text
    except Exception as e:
        return f"Error analyzing image: {str(e)}"
