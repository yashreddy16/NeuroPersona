import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load variables from .env file
load_dotenv()

# Initialize our FastAPI app
app = FastAPI(title="NeuroPersona AI Backend")

# Enable CORS (Allows React frontend to communicate with this backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Grab our API key from environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("CRITICAL ERROR: GEMINI_API_KEY is not set in the .env file.")

# 2. Initialize the Gemini API client
try:
    client = genai.Client(api_key=GEMINI_API_KEY)
except Exception as e:
    print(f"Error initializing Gemini client: {e}")

# 3. Define the data structure for incoming quiz responses
class QuizResponses(BaseModel):
    q1: int = Field(..., ge=1, le=5)  # Openness (+)
    q2: int = Field(..., ge=1, le=5)  # Openness (-)
    q3: int = Field(..., ge=1, le=5)  # Conscientiousness (+)
    q4: int = Field(..., ge=1, le=5)  # Conscientiousness (-)
    q5: int = Field(..., ge=1, le=5)  # Extraversion (+)
    q6: int = Field(..., ge=1, le=5)  # Extraversion (-)
    q7: int = Field(..., ge=1, le=5)  # Agreeableness (+)
    q8: int = Field(..., ge=1, le=5)  # Agreeableness (-)
    q9: int = Field(..., ge=1, le=5)  # Neuroticism (+)
    q10: int = Field(..., ge=1, le=5) # Neuroticism (-)

# Helper functions
def reverse_score(rating: int) -> int:
    return 6 - rating

def calculate_percentage(pos_score: int, neg_score_raw: int) -> float:
    score_sum = pos_score + reverse_score(neg_score_raw)
    percentage = ((score_sum - 2) / 8) * 100
    return round(percentage, 1)

# 4. Standard Welcome Routes
@app.get("/")
def read_root():
    return {"message": "Welcome to NeuroPersona AI API!"}

# 5. Core Scoring & AI Generation Endpoint
@app.post("/api/score")
def process_quiz(responses: QuizResponses):
    # Calculate scores
    openness = calculate_percentage(responses.q1, responses.q2)
    conscientiousness = calculate_percentage(responses.q3, responses.q4)
    extraversion = calculate_percentage(responses.q5, responses.q6)
    agreeableness = calculate_percentage(responses.q7, responses.q8)
    neuroticism = calculate_percentage(responses.q9, responses.q10)

    # Compile the score data
    scores = {
        "Openness": openness,
        "Conscientiousness": conscientiousness,
        "Extraversion": extraversion,
        "Agreeableness": agreeableness,
        "Neuroticism": neuroticism
    }

    # Construct the instruction prompt for Gemini
    system_prompt = (
        "You are an expert psychometrician and cognitive-behavioral performance coach. "
        "You will receive a user's Big Five (OCEAN) personality traits percentages. "
        "Your task is to analyze these scores and output a structured, deeply personalized self-development roadmap."
    )

    user_scores_data = f"""
    The user's OCEAN scores are:
    - Openness: {openness}%
    - Conscientiousness: {conscientiousness}%
    - Extraversion: {extraversion}%
    - Agreeableness: {agreeableness}%
    - Neuroticism (Emotional Stability): {neuroticism}%

    Generate an archetype title, description, key strengths, core struggles, and a highly practical 30-day development plan.
    """

    # We enforce JSON output formatting from Gemini
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[system_prompt, user_scores_data],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                # The structured system schema ensures the JSON keys are exactly what we expect
                response_schema=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "archetype": types.Schema(type=types.Type.STRING, description="A unique personal archetype name (e.g., 'The Imaginative Strategist')"),
                        "description": types.Schema(type=types.Type.STRING, description="A comprehensive assessment of their personality profile based on their scores"),
                        "strengths": types.Schema(
                            type=types.Type.ARRAY,
                            items=types.Schema(type=types.Type.STRING),
                            description="List of 3 primary strengths"
                        ),
                        "challenges": types.Schema(
                            type=types.Type.ARRAY,
                            items=types.Schema(type=types.Type.STRING),
                            description="List of 2 main bottlenecks or psychological challenges"
                        ),
                        "roadmap": types.Schema(
                            type=types.Type.ARRAY,
                            items=types.Schema(
                                type=types.Type.OBJECT,
                                properties={
                                    "area": types.Schema(type=types.Type.STRING, description="Life dimension, e.g., 'Career & Focus', 'Relationships', 'Mental Wellness'"),
                                    "actionable_steps": types.Schema(
                                        type=types.Type.ARRAY,
                                        items=types.Schema(type=types.Type.STRING),
                                        description="2 precise, immediately actionable exercises"
                                    )
                                }
                            ),
                            description="A 3-part targeted developmental roadmap"
                        )
                    },
                    required=["archetype", "description", "strengths", "challenges", "roadmap"]
                )
            )
        )

        # Parse the structured JSON response string from Gemini
        ai_analysis = json.loads(response.text)

    except Exception as e:
        # Fallback in case of API issues or parsing errors
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate AI insights: {str(e)}"
        )

    # Return both calculations and the parsed AI roadmap to the frontend
    return {
        "status": "success",
        "scores": scores,
        "insights": ai_analysis
    }
