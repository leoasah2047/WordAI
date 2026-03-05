import base64
import io
import asyncio
import uuid
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Any
from rag import rag_service
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import uvicorn
import os
import time
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from logging_config import configure_logging, get_logger
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import engine, Base, get_db
import models
from auth_utils import (
    exchange_google_code, 
    exchange_microsoft_code, 
    create_access_token, 
    verify_token
)
from fastapi.responses import JSONResponse
from a2a_server import a2a_server, TaskSendParams, TaskQueryParams, Task

from config import settings
from structlog.contextvars import bind_contextvars, clear_contextvars
import httpx

# Create tables handled by Alembic Migrations

# Initialize Logging
configure_logging()
logger = get_logger(__name__)

# Initialize Rate Limiter
storage_uri = settings.REDIS_URL if settings.REDIS_URL else "memory://"
limiter = Limiter(key_func=get_remote_address, storage_uri=storage_uri)

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("unhandled_global_exception", error=str(exc), path=request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})

@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    logger.warning("http_exception", detail=exc.detail, status=exc.status_code, path=request.url.path)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.middleware("http")
async def add_request_id_and_log(request: Request, call_next):
    clear_contextvars()
    req_id = str(uuid.uuid4())
    bind_contextvars(request_id=req_id)
    
    start_time = time.time()
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        logger.info("request_completed", path=request.url.path, method=request.method, status_code=response.status_code, duration=time.time() - start_time)
        return response
    except Exception as exc:
        logger.error("request_failed", path=request.url.path, method=request.method, error=str(exc), duration=time.time() - start_time)
        raise exc

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ConsultantQuery(BaseModel):
    query: str
    tender_context: str # The document text provided by the user
    top_k: int = 4
    sources: Optional[List[str]] = None
    language: Optional[str] = "English"
    has_images: Optional[bool] = False
    available_images: Optional[List[dict]] = []

class QueryResponse(BaseModel):
    response: str
    context: List[dict]

# Endpoints
@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    health_status = {"status": "healthy", "service": "word-ai-backend", "version": "2.0.0", "features": [
        "websocket_streaming",
        "rag_integration",
        "user_authentication",
        "task_persistence",
        "tool_execution"
    ], "checks": {}}
    
    # DB Check
    try:
        db.execute(text("SELECT 1"))
        health_status["checks"]["database"] = "up"
    except Exception as e:
        health_status["checks"]["database"] = f"down ({str(e)})"
        health_status["status"] = "unhealthy"
        
    # Qdrant Check
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{settings.QDRANT_URL}/collections")
            if resp.status_code == 200:
                health_status["checks"]["qdrant"] = "up"
            else:
                health_status["checks"]["qdrant"] = f"down (status {resp.status_code})"
                health_status["status"] = "unhealthy"
    except Exception as e:
        health_status["checks"]["qdrant"] = f"down ({str(e)})"
        health_status["status"] = "unhealthy"

    return health_status

# ==================== A2A Protocol Endpoints (Enhanced) ====================
# Implements all 5 enhancement phases:
# Phase 1: WebSocket Streaming
# Phase 2: RAG Integration  
# Phase 3: User Authentication
# Phase 4: Task Persistence
# Phase 5: Tool Execution
# Specification: https://a2a.ai/spec

from fastapi import WebSocket, WebSocketDisconnect
from websocket_manager import ws_manager
from tools import tool_registry

class JSONRPCRequest(BaseModel):
    """JSON-RPC 2.0 Request"""
    jsonrpc: str = "2.0"
    method: str
    params: dict
    id: Optional[str | int] = None

class JSONRPCResponse(BaseModel):
    """JSON-RPC 2.0 Response"""
    jsonrpc: str = "2.0"
    result: Optional[Any] = None
    error: Optional[dict] = None
    id: Optional[str | int] = None

# Phase 3: Optional authentication for A2A endpoints
async def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Optional[models.User]:
    """Get user from auth header if provided"""
    if not authorization:
        return None
    
    try:
        token = authorization.replace("Bearer ", "")
        token_data = verify_token(token)
        user = db.query(models.User).filter(
            models.User.id == token_data.user_id
        ).first()
        return user
    except:
        return None

# Phase 1: WebSocket endpoint for real-time streaming
@app.websocket("/a2a/tasks/{task_id}/stream")
async def task_stream_websocket(websocket: WebSocket, task_id: str):
    """
    WebSocket endpoint for real-time task updates
    
    Provides streaming for:
    - Task status changes
    - LLM response chunks
    - Progress updates
    - Artifact additions
    """
    await ws_manager.connect(task_id, websocket)
    try:
        # Keep connection alive and listen for disconnects
        while True:
            # Ping to keep alive
            await asyncio.sleep(30)
            await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        ws_manager.disconnect(task_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(task_id, websocket)

# Enhanced A2A RPC with all phases
@app.post("/a2a/rpc")
async def a2a_rpc_endpoint(
    request: JSONRPCRequest,
    x_google_api_key: Optional[str] = Header(None),
    user: Optional[models.User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Enhanced A2A Protocol JSON-RPC endpoint
    
    Supports:
    - tasks/send: Create or update a task (with persistence & auth)
    - tasks/get: Retrieve task status (from database)
    - tasks/cancel: Cancel a task
    - tasks/list: List user tasks (Phase 3)
    - tools/list: List available tools (Phase 5)
    """
    try:
        method = request.method
        params = request.params
        
        if method == "tasks/send":
            # Phase 3 & 4: Authenticated, persisted task creation
            task_params = TaskSendParams(**params)
            task = await a2a_server.handle_task_send(
                task_params,
                db,
                user,
                x_google_api_key
            )
            
            return JSONRPCResponse(
                jsonrpc="2.0",
                result=task.dict(),
                id=request.id
            )
        
        elif method == "tasks/get":
            # Phase 4: Get from database
            task_params = TaskQueryParams(**params)
            task = await a2a_server.handle_task_get(task_params, db)
            
            return JSONRPCResponse(
                jsonrpc="2.0",
                result=task.dict(),
                id=request.id
            )
        
        elif method == "tasks/cancel":
            # Phase 4: Cancel with persistence
            task_id = params.get("id")
            if not task_id:
                raise ValueError("Task ID is required")
            
            task = await a2a_server.handle_task_cancel(task_id, db)
            
            return JSONRPCResponse(
                jsonrpc="2.0",
                result=task.dict(),
                id=request.id
            )
        
        elif method == "tasks/list":
            # Phase 3: List user's tasks
            if not user:
                raise ValueError("Authentication required for tasks/list")
            
            limit = params.get("limit", 50)
            offset = params.get("offset", 0)
            state = params.get("state")
            
            tasks = await a2a_server.list_user_tasks(user, db, limit, offset, state)
            
            return JSONRPCResponse(
                jsonrpc="2.0",
                result=[t.dict() for t in tasks],
                id=request.id
            )
        
        elif method == "tools/list":
            # Phase 5: List available tools
            tool_type = params.get("type")
            tools = tool_registry.list_tools(tool_type)
            
            return JSONRPCResponse(
                jsonrpc="2.0",
                result=[t.dict() for t in tools],
                id=request.id
            )
        
        elif method == "tools/schema":
            # Phase 5: Get tools schema for LLM
            schema = tool_registry.get_tools_schema()
            
            return JSONRPCResponse(
                jsonrpc="2.0",
                result=schema,
                id=request.id
            )
        
        else:
            return JSONRPCResponse(
                jsonrpc="2.0",
                error={
                    "code": -32601,
                    "message": f"Method not found: {method}"
                },
                id=request.id
            )
    
    except ValueError as e:
        logger.error(f"A2A RPC validation error: {str(e)}")
        return JSONRPCResponse(
            jsonrpc="2.0",
            error={
                "code": -32602,
                "message": f"Invalid params: {str(e)}"
            },
            id=request.id
        )
    except Exception as e:
        logger.error(f"A2A RPC error: {str(e)}")
        return JSONRPCResponse(
            jsonrpc="2.0",
            error={
                "code": -32603,
                "message": f"Internal error: {str(e)}"
            },
            id=request.id
        )

# ==================== End Enhanced A2A Protocol Endpoints ====================

# Auth Models
class OAuthCallbackData(BaseModel):
    code: str
    code_verifier: str
    redirect_uri: str

class ProfileUpdate(BaseModel):
    identity: str
    dms_provider: Optional[str] = None
    dms_api_key: Optional[str] = None
    dms_oauth_token: Optional[str] = None
    gemini_api_key: Optional[str] = None

class NexusAnalysisRequest(BaseModel):
    text: str

# Dependency to get current user
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    user = db.query(models.User).filter(models.User.id == token_data.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Auth Endpoints
@app.post("/auth/google/callback")
async def google_callback(data: OAuthCallbackData, db: Session = Depends(get_db)):
    try:
        user_info, tokens = await exchange_google_code(data.code, data.redirect_uri, data.code_verifier)
        email = user_info["email"]
        provider_id = user_info["sub"]
        
        # Check if user exists
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            user = models.User(email=email, provider="google", provider_id=provider_id)
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Create user JWT
        access_token = create_access_token(data={"sub": user.id, "email": user.email})
        
        response = JSONResponse(content={
            "message": "Authenticated", 
            "user": {"email": user.email, "id": user.id},
            "requires_onboarding": user.profile is None
        })
        response.set_cookie(
            key="session_token", 
            value=access_token, 
            httponly=True, 
            secure=not settings.DEBUG,
            samesite="lax"
        )
        return response
    except Exception as e:
        logger.error("google_callback_error", error=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/microsoft/callback")
async def microsoft_callback(data: OAuthCallbackData, db: Session = Depends(get_db)):
    try:
        user_info, tokens = await exchange_microsoft_code(data.code, data.redirect_uri, data.code_verifier)
        email = user_info["email"]
        provider_id = user_info["id"]
        
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            user = models.User(email=email, provider="microsoft", provider_id=provider_id)
            db.add(user)
            db.commit()
            db.refresh(user)
            
        access_token = create_access_token(data={"sub": user.id, "email": user.email})
        
        response = JSONResponse(content={
            "message": "Authenticated", 
            "user": {"email": user.email, "id": user.id},
            "requires_onboarding": user.profile is None
        })
        response.set_cookie(key="session_token", value=access_token, httponly=True, secure=not settings.DEBUG, samesite="lax")
        return response
    except Exception as e:
        logger.error("microsoft_callback_error", error=str(e))
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/auth/me")
async def get_me(user: models.User = Depends(get_current_user)):
    return {
        "email": user.email, 
        "id": user.id, 
        "onboarded": user.profile is not None,
        "profile": {
            "identity": user.profile.identity if user.profile else None,
            "default_context": user.profile.default_context if user.profile else None,
            "nexus_profile": user.profile.nexus_profile if user.profile else {}
        } if user.profile else None
    }

@app.post("/auth/logout")
async def logout():
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("session_token")
    return response

# Onboarding Endpoints
@app.patch("/user/profile")
async def update_profile(data: ProfileUpdate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Identity options mapping to default context
    IDENTITY_DEFAULTS = {
        "Professional Writer": {"tone": "Creative", "style": "Fluid"},
        "Student": {"tone": "Informative", "style": "Simple"},
        "Academic Researcher": {"tone": "Academic", "style": "Detailed"},
        "Business Executive": {"tone": "Professional", "style": "Concise"},
        "Legal Professional": {"tone": "Formal", "style": "Precise"},
        "General Creative": {"tone": "Inspirational", "style": "Artistic"},
        "Grant Writer": {"tone": "Formal", "style": "Persuasive"},
        "Technical Illustrator": {"tone": "Technical", "style": "Descriptive"},
        "Bylaw Auditor": {"tone": "Formal", "style": "Analytical"},
        "Corporate Controller": {"tone": "Professional", "style": "Direct"},
        "HR Generalist": {"tone": "Empathetic", "style": "Professional"},
        "IT Support Specialist": {"tone": "Technical", "style": "Helpful"},
        "Medical Researcher": {"tone": "Academic", "style": "Exact"},
        "Financial Analyst": {"tone": "Analytical", "style": "Data-heavy"},
        "Marketing Strategist": {"tone": "Persuasive", "style": "Strategic"},
        "Social Media Manager": {"tone": "Casual", "style": "Punchy"},
        "UX Designer": {"tone": "User-centric", "style": "Clear"},
        "Software Engineer": {"tone": "Technical", "style": "Concise"},
        "Data Scientist": {"tone": "Analytical", "style": "Evidence-based"},
        "Project Manager": {"tone": "Direct", "style": "Organized"},
        "Risk Consultant": {"tone": "Prudent", "style": "Structured"},
        "Compliance Officer": {"tone": "Formal", "style": "Regulatory"},
        "Tax Accountant": {"tone": "Precise", "style": "Factual"},
        "External Auditor": {"tone": "Objective", "style": "Critical"},
        "Internal Auditor": {"tone": "Methodical", "style": "Thorough"},
        "Public Relations Specialist": {"tone": "Professional", "style": "Persuasive"},
        "Content Strategist": {"tone": "Creative", "style": "Goal-oriented"},
        "Brand Ambassador": {"tone": "Enthusiastic", "style": "Personal"},
        "Operations Manager": {"tone": "Direct", "style": "Efficient"},
        "Supply Chain Planner": {"tone": "Logistical", "style": "Accurate"},
        "Logistics Coordinator": {"tone": "Methodical", "style": "Structured"},
        "Procurement Officer": {"tone": "Formal", "style": "Precise"},
        "Sales Executive": {"tone": "Persuasive", "style": "Compelling"},
        "Account Manager": {"tone": "Professional", "style": "Personalized"},
        "Customer Success Lead": {"tone": "Empathetic", "style": "Supportive"},
        "Technical Writer": {"tone": "Informative", "style": "Technical"},
        "Copywriter": {"tone": "Creative", "style": "Engaging"},
        "Editor": {"tone": "Analytical", "style": "Polished"},
        "Proofreader": {"tone": "Meticulous", "style": "Exact"},
        "Ghostwriter": {"tone": "Adaptive", "style": "Fluid"},
        "Scriptwriter": {"tone": "Narrative", "style": "Dramatic"},
        "Journalist": {"tone": "Objective", "style": "Concise"},
        "Blogger": {"tone": "Casual", "style": "Conversational"},
        "SEO Specialist": {"tone": "Analytical", "style": "Optimized"},
        "E-commerce Manager": {"tone": "Conversion-oriented", "style": "Direct"},
        "Digital Nomad": {"tone": "Casual", "style": "Flexible"},
        "Entrepreneur": {"tone": "Visionary", "style": "Strategic"},
        "Small Business Owner": {"tone": "Practical", "style": "Direct"},
        "Startup Founder": {"tone": "Ambitious", "style": "Innovative"},
        "VC Partner": {"tone": "Critical", "style": "Calculated"},
        "Investment Banker": {"tone": "Formal", "style": "Data-driven"},
        "Hedge Fund Manager": {"tone": "Aggressive", "style": "Analytical"},
        "Private Equity Analyst": {"tone": "Diligent", "style": "Comprehensive"},
        "Actuary": {"tone": "Mathematical", "style": "Risk-focused"},
        "Insurance Broker": {"tone": "Consultative", "style": "Risk-aware"},
        "Real Estate Agent": {"tone": "Persuasive", "style": "Sales-focused"},
        "Property Manager": {"tone": "Professional", "style": "Organized"},
        "Architect": {"tone": "Creative", "style": "Structural"},
        "Civil Engineer": {"tone": "Technical", "style": "Standard-compliant"},
        "Mechanical Engineer": {"tone": "Technical", "style": "Precise"},
        "Electrical Engineer": {"tone": "Technical", "style": "Diagrammatic"},
        "Environmental Scientist": {"tone": "Academic", "style": "Evidence-based"},
        "Sustainability Consultant": {"tone": "Advisory", "style": "Green-focused"},
        "Policy Analyst": {"tone": "Academic", "style": "Evaluative"},
        "Government Officer": {"tone": "Formal", "style": "Regulated"},
        "Diplomat": {"tone": "Tactful", "style": "Eloquent"},
        "Non-Profit Director": {"tone": "Mission-driven", "style": "Persuasive"},
        "Fundraising Coordinator": {"tone": "Inspirational", "style": "Compelling"},
        "Volunteer Manager": {"tone": "Encouraging", "style": "Personal"},
        "Teacher": {"tone": "Educational", "style": "Clear"},
        "Professor": {"tone": "Academic", "style": "In-depth"},
        "Education Administrator": {"tone": "Professional", "style": "Regulatory"},
        "Librarian": {"tone": "Informative", "style": "Methodical"},
        "Curator": {"tone": "Scholarly", "style": "Expository"},
        "Museum Educator": {"tone": "Engaging", "style": "Informative"},
        "Artist": {"tone": "Creative", "style": "Expressive"},
        "Musician": {"tone": "Creative", "style": "Rhythmic"},
        "Photographer": {"tone": "Visual", "style": "Descriptive"},
        "Videographer": {"tone": "Dynamic", "style": "Cinematic"},
        "Animator": {"tone": "Playful", "style": "Imaginative"},
        "Game Designer": {"tone": "Creative", "style": "Interactive"},
        "Interior Designer": {"tone": "Creative", "style": "Aesthetic"},
        "Fashion Designer": {"tone": "Trendsetting", "style": "Visual"},
        "Chef": {"tone": "Passionate", "style": "Instructional"},
        "Restaurant Manager": {"tone": "Operational", "style": "Direct"},
        "Event Planner": {"tone": "Detail-oriented", "style": "Organized"},
        "Travel Agent": {"tone": "Enthusiastic", "style": "Inviting"},
        "Pilot": {"tone": "Technical", "style": "Protocol-driven"},
        "Air Traffic Controller": {"tone": "Direct", "style": "Precise"},
        "Doctor": {"tone": "Clinical", "style": "Authoritative"},
        "Nurse": {"tone": "Compassionate", "style": "Clinical"},
        "Pharmacist": {"tone": "Analytical", "style": "Safe"},
        "Physical Therapist": {"tone": "Encouraging", "style": "Practical"},
        "Psychologist": {"tone": "Empathetic", "style": "Insightful"},
        "Social Worker": {"tone": "Advocating", "style": "Empathetic"},
        "Legal Secretary": {"tone": "Formal", "style": "Administrative"},
        "Paralegal": {"tone": "Legalistic", "style": "Precise"},
        "Judge": {"tone": "Impartial", "style": "Reasoned"},
        "Clerk of Court": {"tone": "Formal", "style": "Procedural"},
        "Detective": {"tone": "Inquisitive", "style": "Investigative"},
        "Police Officer": {"tone": "Authoritative", "style": "Factual"},
        "Security Consultant": {"tone": "Cautious", "style": "Strategic"},
        "Cybersecurity Analyst": {"tone": "Technical", "style": "Alert"},
    }
    
    default_ctx = IDENTITY_DEFAULTS.get(data.identity, {"tone": "Professional", "style": "Standard"})
    
    if user.profile:
        user.profile.identity = data.identity
        user.profile.default_context = default_ctx
        if data.dms_provider is not None:
             user.profile.dms_provider = data.dms_provider
        if data.dms_api_key is not None:
             user.profile.dms_api_key = data.dms_api_key
        if data.dms_oauth_token is not None:
             user.profile.dms_oauth_token = data.dms_oauth_token
        if data.gemini_api_key is not None:
             user.profile.gemini_api_key = data.gemini_api_key
    else:
        profile = models.UserProfile(
            user_id=user.id, 
            identity=data.identity, 
            default_context=default_ctx,
            dms_provider=data.dms_provider,
            dms_api_key=data.dms_api_key,
            dms_oauth_token=data.dms_oauth_token,
            gemini_api_key=data.gemini_api_key
        )
        db.add(profile)
    
    db.commit()
    return {"status": "Profile updated", "identity": data.identity}

@app.get("/")
def read_root():
    return {"status": "Word-GPT-Plus Backend Running", "docs_url": "/docs"}

@app.post("/api/v1/ingest")
@limiter.limit("10/minute")
async def ingest_document(
    request: Request,
    file: UploadFile = File(...),
    author: str = Form(...),
    department: str = Form(...),
    doc_type: str = Form(...),
    x_google_api_key: Optional[str] = Header(None),
    user: models.User = Depends(get_current_user)
):
    logger.info("ingest_document_start", author=author, department=department, doc_type=doc_type, filename=file.filename, user_id=user.id)
    start_time = time.time()
    try:
        # Use user's preferred identity if not specified? 
        # For now, we'll just log that it's this user's document.
        
        # Pass API key to service if provided or in profile
        api_key = x_google_api_key
        if not api_key and user.profile and user.profile.gemini_api_key:
            api_key = user.profile.gemini_api_key
            
        if api_key:
            rag_service.update_api_key(api_key)
            
        metadata = {
            "author": author,
            "department": department,
            "type": doc_type,
            "user_id": user.id
        }
        result = await rag_service.ingest_file(file, metadata)
        duration = time.time() - start_time
        logger.info("ingest_document_success", duration=duration, file_id=result.get("file_id"))
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("ingest_document_error", error=str(e), author=author, filename=file.filename)
        raise HTTPException(status_code=500, detail="An error occurred during document ingestion.")

@app.post("/api/v1/nexus/analyze")
async def analyze_nexus_persona(
    request: Request,
    data: NexusAnalysisRequest,
    x_google_api_key: Optional[str] = Header(None),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not user.profile:
        raise HTTPException(status_code=400, detail="User profile not initialized. Complete onboarding first.")

    api_key = x_google_api_key
    if not api_key and user.profile and user.profile.gemini_api_key:
        api_key = user.profile.gemini_api_key
        
    api_key = api_key or settings.GOOGLE_API_KEY
    if not api_key:
        raise HTTPException(status_code=401, detail="Google API Key required")

    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash", # Use Flash for persistent background tasks
            google_api_key=api_key,
            temperature=0.1
        )

        system_prompt = """Analyze the provided text to build a "User Persona Profile" based on these 5 specific metrics. 
        Return ONLY a JSON object with these keys:
        1. "domain": Identify the industry (e.g., Legal, Medical, Creative Fiction).
        2. "cognitive_style": "Logic-driven" (bulleted lists) or "Narrative-driven" (long-form prose).
        3. "tone": The dominant voice (e.g., Authoritative, Empathetic, Academic).
        4. "proficiency": Identified grammatical slips, overused words, or sophistication.
        5. "intent": The primary goal (e.g., Persuading, Informing, Recording).

        Text to analyze:
        {text}
        """
        
        prompt = ChatPromptTemplate.from_template(system_prompt)
        chain = prompt | llm | StrOutputParser()
        
        response = await chain.ainvoke({"text": data.text})
        
        # Simple JSON extraction from LLM response
        import json
        import re
        
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            nexus_data = json.loads(json_match.group(0))
            user.profile.nexus_profile = nexus_data
            db.commit()
            return nexus_data
        else:
            raise ValueError("Failed to parse LLM response as JSON")

    except Exception as e:
        logger.error("nexus_analysis_error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Nexus analysis failed: {str(e)}")

async def extract_style_instruction(style_author: str, style_docs: List, api_key: str) -> str:
    """
    AI-driven style extraction from writing samples.
    """
    if not style_docs:
        return f"STYLE: PROFESSIONAL & STANDARD ({style_author})\n- Tone: Professional, clear, and business-appropriate."

    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=api_key,
            temperature=0.1
        )

        samples_text = "\n---\n".join([doc.page_content for doc in style_docs])
        
        system_prompt = f"""Analyze the writing style of these samples for author "{style_author}".
        Extract 5 key stylistic metrics and return a concise writing style definition.
        
        Format the response EXACTLY as follows:
        STYLE: [CONCISE NAME] ({style_author})
        - Tone: [Description]
        - Vocabulary: [Description]
        - Structure: [Description]
        - Formatting: [Description]
        - Focus: [Description]
        
        Samples:
        {samples_text}
        """
        
        response = await llm.ainvoke(system_prompt)
        return response.content.strip() if hasattr(response, 'content') else str(response).strip()

    except Exception as e:
        logger.error(f"Error extracting style for {style_author}: {e}")
        return f"STYLE: PROFESSIONAL & STANDARD\n- Tone: Professional, clear, and business-appropriate."

@app.post("/api/v1/query", response_model=QueryResponse)
@limiter.limit("20/minute")
async def query_consultant(
    request: Request,
    data: ConsultantQuery,
    x_google_api_key: Optional[str] = Header(None),
    user: models.User = Depends(get_current_user)
):
    start_time = time.time()
    try:
        import re
        
        # Determine user preferences
        nexus_profile = {}
        user_identity = "Professional"
        user_defaults = {}
        if user and user.profile:
            nexus_profile = user.profile.nexus_profile or {}
            user_identity = user.profile.identity or "Professional"
            user_defaults = user.profile.default_context or {}
            
        api_key = x_google_api_key
        if not api_key and user and user.profile and user.profile.gemini_api_key:
            api_key = user.profile.gemini_api_key
        effective_api_key = api_key or settings.GOOGLE_API_KEY
        
        # 1. Retrieve Context from Vector DB
        source_filter = getattr(data, 'sources', None) or []
        
        # Extract requested documents and tools
        requested_docs = [m.group(1) for m in re.finditer(r'@Document:([^\s]+)', data.query)]
        requested_tools = [m.group(1) for m in re.finditer(r'@Tool:([^\s]+)', data.query)]
            
        clean_query = re.sub(r'@[A-Za-z]+:[^\s]+', '', data.query).strip() or data.query
            
        if requested_docs:
            source_filter.extend(requested_docs)
            source_filter = list(set(source_filter))
            
        # Search for Knowledge using the query
        context_docs = await rag_service.query(
            clean_query, 
            filters={"sources": source_filter} if source_filter else None, 
            top_k=data.top_k
        )
        
        # Group knowledge by source for synthesis
        docs_by_source = {}
        for doc in context_docs:
            source = doc.metadata.get("source", "Unknown Source")
            if source not in docs_by_source:
                docs_by_source[source] = []
            docs_by_source[source].append(doc.page_content)
        
        knowledge_context = ""
        for source, contents in docs_by_source.items():
            knowledge_context += f"### SOURCE: {source}\n"
            knowledge_context += "\n".join(contents) + "\n\n"
    
        
        # 2. Construct Super-Prompt
        hidden_instruction = ""
        if nexus_profile:
            hidden_instruction = f'You are assisting a {nexus_profile.get("domain", "standard")} expert who prefers {nexus_profile.get("cognitive_style", "professional")} style and writes with a {nexus_profile.get("tone", "neutral")} tone. Focus on {nexus_profile.get("proficiency", "clarity")} and mitigate any linguistic weaknesses.'
    
        tools_instruction = ""
        if requested_tools:
            tools_instruction = f"\n# REQUESTED TOOLS\nThe user explicitly requested to focus on the following tools/methods: {', '.join(requested_tools)}. Keep this in mind and suggest their usage if applicable.\n"

        system_template = f"""{hidden_instruction}
        
        You are an expert World-Class Consultant specializing in your field.
        
        # USER CONTEXT
        User Identity: {{user_identity}}
        User Preferences: {{user_defaults}}
        {tools_instruction}
        # INSTRUCTIONS
        Your goal is to answer the user's query using the provided context.
        If multiple sources are provided in the reference material, perform a "Cross-Document Synthesis":
        - Compare information across sources.
        - Highlight agreement or discrepancies.
        - Synthesize a comprehensive view that draws from all relevant sources.
        
        # EXPERT PERSONA
        Role: Senior Consultant
        Objective: Provide high-quality, actionable advice or draft content that meets supreme professional standards.
        
        # REFERENCE MATERIAL
        
        ## Internal Knowledge Base:
        {{knowledge_context}}
        
        # INPUT DATA
        
        ## Document Context (Source of Truth):
        {{tender_context}}
        
        ## User Task/Query:
        {{user_query}}
        
        # RESPONSE GENERATION
        Generate the response now. Do not include introductory filler like "Here is the response". Go straight into the content.
        """
    
        prompt = ChatPromptTemplate.from_template(system_template)
        
        # 3. Generate Response using Gemini
        if not effective_api_key:
             raise HTTPException(status_code=401, detail="Google API Key provided in headers or env.")
             
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-pro",
            google_api_key=effective_api_key,
            temperature=0.3,
            max_retries=3
        )
        
        chain = prompt | llm | StrOutputParser()
        
        response_text = await chain.ainvoke({
            "knowledge_context": knowledge_context,
            "user_query": data.query,
            "tender_context": data.tender_context,
            "user_identity": user_identity,
            "user_defaults": str(user_defaults)
        })
    
        duration = time.time() - start_time
        logger.info("query_consultant_success", duration=duration)
    
        return {
            "response": response_text,
            "context": [{"content": doc.page_content, "metadata": doc.metadata} for doc in context_docs]
        }
    
    except HTTPException as e:
        raise e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        error_str = str(e).lower()
        if "429" in error_str or "rate limit" in error_str:
            raise HTTPException(status_code=429, detail="AI Service is currently overloaded. Please try again in a few moments.")
        elif "401" in error_str or "invalid api key" in error_str:
            raise HTTPException(status_code=401, detail="Invalid API Key. Please check your settings.")
        
        print(f"Error processing query: {e}")
        logger.error("query_consultant_error", error=str(e), query_snippet=data.query[:50])
        raise HTTPException(status_code=500, detail=f"AI processing failed: {str(e)}")


class OCRRequest(BaseModel):
    image_base64: str # Base64 encoded image data
    filename: Optional[str] = "image.png"

class ImageGenerationRequest(BaseModel):
    prompt: str
    model: Optional[str] = "gemini-3.1-flash-image-preview"
    style: Optional[str] = "photorealistic"
    aspect_ratio: Optional[str] = "1:1"

@app.post("/api/v1/ocr")
@limiter.limit("20/minute")
async def perform_ocr(
    request: Request,
    data: OCRRequest,
    x_google_api_key: Optional[str] = Header(None),
    user: models.User = Depends(get_current_user)
):
    """
    Perform high-accuracy AI OCR using Gemini 1.5 Flash
    Designed for noisy data, handwriting, and complex document geometry.
    """
    api_key = x_google_api_key or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=401, detail="Google API Key required")

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Decode base64 image
        img_data = base64.b64decode(data.image_base64)
        
        # Prepare for Gemini (using inline_data for small-to-medium images)
        prompt = "Extract all text from this image. Maintain the document's geometry and structure where possible. If it's a form, return it as structured text. If there's handwriting, transcribe it accurately. Return ONLY the extracted text."
        
        response = await asyncio.to_thread(
            model.generate_content,
            [
                prompt,
                {
                    "mime_type": "image/png", # Defaulting to PNG, base64 data should match
                    "data": img_data
                }
            ]
        )
        
        if not response or not response.text:
            raise ValueError("No text extracted from image")
            
        return {
            "text": response.text,
            "filename": data.filename
        }
        
    except Exception as e:
        logger.error("ocr_error", error=str(e), user_id=user.id)
        raise HTTPException(status_code=500, detail=f"OCR failed: {str(e)}")

@app.post("/api/v1/generate-image")
@limiter.limit("5/minute")
async def generate_image(
    request: Request,
    data: ImageGenerationRequest,
    x_google_api_key: Optional[str] = Header(None),
    user: models.User = Depends(get_current_user)
):
    start_time = time.time()
    logger.info("generate_image_start", prompt=data.prompt, style=data.style, model=data.model, user_id=user.id)
    
    api_key = x_google_api_key or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=401, detail="Google API Key required")

    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=api_key)
        
        # Using Nano Banana API (Gemini 3.1 Flash Image Preview / Gemini 3 Pro Image Preview)
        requested_model = data.model or "gemini-3.1-flash-image-preview"
        
        # Enhance prompt with style
        full_prompt = f"{data.prompt}. Style: {data.style}. High quality, detailed."
        
        # Call generate_images with modern SDK parameters
        response = client.models.generate_images(
            model=requested_model,
            prompt=full_prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio=data.aspect_ratio,
                safety_filter_level="block_only_high",
                person_generation="allow_adult"
            )
        )
        
        if not response or not response.generated_images:
             raise ValueError("No images generated")
             
        # Get the first image
        generated_image = response.generated_images[0]
        
        # Convert image bytes to base64
        # The new SDK provides the image bytes directly
        img_bytes = generated_image.image.image_bytes
        if not img_bytes:
             raise ValueError("Generated image contains no data")

        b64_data = base64.b64encode(img_bytes).decode('utf-8')
        mime_type = "image/png"
        
        duration = time.time() - start_time
        logger.info("generate_image_success", duration=duration, model=requested_model)
        
        return {
            "image_url": f"data:{mime_type};base64,{b64_data}",
            "prompt": data.prompt,
            "model": requested_model
        }

    except ImportError:
        logger.error("generate_image_error", error="google-genai not installed or incompatible")
        raise HTTPException(status_code=500, detail="Image generation library missing")
    except Exception as e:
        logger.error("generate_image_error", error=str(e))
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
