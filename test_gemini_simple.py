import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

def test_simple_text():
    if not GEMINI_API_KEY:
        print("Error: GEMINI_API_KEY not found in .env")
        return

    print(f"API Key found: {GEMINI_API_KEY[:5]}...{GEMINI_API_KEY[-4:]}")
    
    genai.configure(api_key=GEMINI_API_KEY)
    
    try:
        # Switching to latest flash model alias
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content("Hello, can you hear me? Reply with 'Yes, I can hear you!'")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error calling Gemini API: {e}")

if __name__ == "__main__":
    test_simple_text()
