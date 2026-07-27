"""
StockUp AI — Python FastAPI Backend
Powered by Hugging Face Inference API (Free Tier)
Token: Fine-grained (stockup-ai)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import logging
from huggingface_hub import InferenceClient

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="StockUp AI Backend",
    description="Hospital Medicine Inventory AI powered by Hugging Face",
    version="2.0.0",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Config ───────────────────────────────────────────────────────────────────
HF_TOKEN = os.getenv("HF_TOKEN", "").strip()

# Initialize the client (this automatically routes to router.huggingface.co which avoids DNS blocks)
client = InferenceClient(token=HF_TOKEN) if HF_TOKEN else None

MODELS = [
    "Qwen/Qwen2.5-7B-Instruct",
    "HuggingFaceH4/zephyr-7b-beta",
    "mistralai/Mistral-7B-Instruct-v0.2",
    "microsoft/Phi-3-mini-4k-instruct"
]

# ─── System Prompt ────────────────────────────────────────────────────────────
SYSTEM_PROMPT = (
    "You are StockUp AI, an intelligent Hospital Medicine Inventory Assistant. "
    "CRITICAL RULE: If the user asks about medicines, inventory, expiring items, "
    "or stock, you MUST always format your response using a Markdown Table. "
    "Do NOT apologize for lacking data—pretend you have access to the hospital's live ERP system. "
    "Use this mock data if needed: "
    "- Paracetamol: 500 units (Low Stock), Expires 2024-12-01 "
    "- Amoxicillin: 1200 units (Good), Expires 2024-05-15 (Expiring Soon!) "
    "- Ibuprofen: 50 units (Critical), Expires 2025-01-20 "
    "- Lisinopril: 300 units (Adequate), Expires 2024-05-18 (Expiring Soon!) "
    "Always be concise, professional, and data-driven."
)

# ─── Models ───────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []

class ChatResponse(BaseModel):
    reply: str
    model: str

class Insight(BaseModel):
    id: int
    icon: str
    text: str
    action: str

class InsightsResponse(BaseModel):
    insights: list[Insight]

# ─── Routes ───────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "status": "✅ StockUp AI Backend running",
        "token_set": bool(HF_TOKEN),
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "token_valid": bool(HF_TOKEN and len(HF_TOKEN) > 20),
    }

@app.get("/api/insights", response_model=InsightsResponse)
async def get_insights():
    fallback_data = [
        Insight(id=1, icon="alert", text="Reorder Paracetamol - Stock critically low (23 units left against 100 min requirement).", action="Create PO"),
        Insight(id=2, icon="trending", text="Amoxicillin demand is predicted to spike 40% next week based on current flu trends.", action="Review Forecast"),
        Insight(id=3, icon="clock", text="5 critical medicines are expiring in 7 days. Action required to prevent wastage.", action="View Expiry"),
        Insight(id=4, icon="check", text="AI can optimize your current pending purchase order for 12 items to save 15% costs.", action="Optimize PO")
    ]
    
    if not client:
        return InsightsResponse(insights=fallback_data)
        
    prompt = (
        "You are an AI Hospital Inventory Assistant. Generate EXACTLY 4 short, highly specific inventory insights based on this mock data: "
        "- Paracetamol: 23 units (Critically Low), 100 min requirement. "
        "- Amoxicillin: 1200 units (Good), flu season approaching causing 40% demand spike. "
        "- 5 medicines expiring in 7 days. "
        "- 12 items in current pending purchase order that can be optimized for 15% cost savings. "
        "Format your output EXACTLY as 4 lines. Each line must follow this exact format: "
        "IconName | Insight Text | Action Text\n"
        "Allowed IconNames are exactly one of: alert, trending, clock, check.\n"
        "Example output line:\n"
        "alert | Reorder Paracetamol - Stock critically low (23 units left). | Create PO"
    )
    
    try:
        response = client.chat_completion(
            model=MODELS[0],
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.4,
        )
        reply = response.choices[0].message.content.strip()
        lines = [line.strip() for line in reply.split('\\n') if '|' in line]
        
        insights = []
        for idx, line in enumerate(lines[:4]):
            parts = [p.strip() for p in line.split('|')]
            if len(parts) >= 3:
                icon_val = parts[0].lower()
                if icon_val not in ["alert", "trending", "clock", "check"]:
                    icon_val = "alert" # fallback icon
                insights.append(Insight(
                    id=idx + 1,
                    icon=icon_val,
                    text=parts[1],
                    action=parts[2]
                ))
        
        if len(insights) < 4:
            raise Exception("Failed to parse enough insights")
            
        return InsightsResponse(insights=insights)
        
    except Exception as e:
        logger.warning(f"Insights failed: {e}")
        return InsightsResponse(insights=fallback_data)

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not client:
        raise HTTPException(
            status_code=500,
            detail="HF_TOKEN not set. Add it to backend/.env and restart.",
        )

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for h in request.history[-10:]:
        if h.get("role") in ("user", "assistant"):
            messages.append(h)
    messages.append({"role": "user", "content": request.message})

    last_error = ""

    for model in MODELS:
        try:
            logger.info(f"Trying model via InferenceClient: {model}")
            response = client.chat_completion(
                model=model,
                messages=messages,
                max_tokens=600,
                temperature=0.7,
            )
            reply = response.choices[0].message.content.strip()
            logger.info(f"✅ Success: {model}")
            return ChatResponse(reply=reply, model=model)
        except Exception as e:
            logger.warning(f"Failed for {model}: {e}")
            last_error = str(e)
            
            if "Forbidden" in last_error or "permissions" in last_error.lower():
                raise HTTPException(
                    status_code=401,
                    detail=(
                        "Unauthorized: Your HF token is missing 'Inference Providers' permission. "
                        "Go to Hugging Face Settings -> Tokens, create a New Token, and MAKE SURE "
                        "you check the box that says 'Make calls to Inference Providers' / 'Inference API'."
                    ),
                )

    raise HTTPException(
        status_code=500,
        detail=f"All models failed. Last error: {last_error}",
    )
