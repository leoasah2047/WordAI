"""
Enhanced A2A Protocol Server - All 5 Phases Integrated

Implements:
- Phase 1: WebSocket streaming for real-time updates
- Phase 2: RAG integration for context-aware responses
- Phase 3: User authentication and multi-user support
- Phase 4: Database persistence for tasks
- Phase 5: Tool execution framework

Specification: https://a2a.ai/spec
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from enum import Enum
import uuid
from datetime import datetime
import asyncio
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import os
from logging_config import get_logger
from sqlalchemy.orm import Session
from models import TaskModel, User
from websocket_manager import ws_manager
from tools import tool_registry, ToolCall
from rag import rag_service

logger = get_logger(__name__)


class Role(str, Enum):
    """Message role as per A2A spec"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class TaskState(str, Enum):
    """Task state as per A2A spec"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Part(BaseModel):
    """Part of a message (text or data)"""
    type: str = "text"
    text: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class Message(BaseModel):
    """A2A Message structure"""
    role: Role
    content: str | List[Part]
    
    class Config:
        use_enum_values = True


class TaskStatus(BaseModel):
    """Status of a task"""
    state: TaskState
    message: Optional[str] = None
    progress: Optional[float] = None
    
    class Config:
        use_enum_values = True


class Artifact(BaseModel):
    """Task artifact (output data)"""
    id: str
    type: str  # "text", "tool_call", "context", "data"
    content: str | Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None


class Task(BaseModel):
    """A2A Task structure"""
    id: str
    sessionId: Optional[str] = None
    userId: Optional[int] = None
    status: TaskStatus
    history: List[Message] = []
    artifacts: List[Artifact] = []
    metadata: Optional[Dict[str, Any]] = None
    context_sources: List[Dict[str, Any]] = []
    created_at: datetime
    updated_at: datetime


class TaskSendParams(BaseModel):
    """Parameters for tasks/send endpoint"""
    id: str
    sessionId: Optional[str] = None
    message: Message
    metadata: Optional[Dict[str, Any]] = None
    historyLength: Optional[int] = None


class TaskQueryParams(BaseModel):
    """Parameters for tasks/get endpoint"""
    id: str
    historyLength: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None


class A2AServer:
    """
    Enhanced A2A Protocol Server
    
    Features:
    - WebSocket streaming
    - RAG context integration
    - User authentication
    - Database persistence
    - Tool execution
    """
    
    def __init__(self):
        logger.info("Enhanced A2A Server initialized")
    
    def _db_to_pydantic(self, db_task: TaskModel) -> Task:
        """Convert database model to Pydantic task"""
        return Task(
            id=db_task.id,
            sessionId=db_task.session_id,
            userId=db_task.user_id,
            status=TaskStatus(
                state=TaskState(db_task.status_state),
                message=db_task.status_message,
                progress=db_task.status_progress
            ),
            history=[Message(**msg) for msg in (db_task.history or [])],
            artifacts=[Artifact(**art) for art in (db_task.artifacts or [])],
            metadata=db_task.task_metadata or {},
            context_sources=db_task.context_sources or [],
            created_at=db_task.created_at,
            updated_at=db_task.updated_at
        )
    
    async def handle_task_send(
        self,
        params: TaskSendParams,
        db: Session,
        user: Optional[User] = None,
        api_key: Optional[str] = None
    ) -> Task:
        """
        Handle tasks/send request with full persistence and auth
        
        Phase 3: User authentication
        Phase 4: Database persistence
        """
        task_id = params.id
        
        # Check if task exists in database
        db_task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
        
        if db_task:
            # Update existing task
            history = list(db_task.history or [])
            history.append(params.message.dict())
            db_task.history = history
            db_task.updated_at = datetime.utcnow()
        else:
            # Create new task
            db_task = TaskModel(
                id=task_id,
                user_id=user.id if user else None,
                session_id=params.sessionId,
                status_state=TaskState.PENDING.value,
                status_message="Task received",
                status_progress=0.0,
                history=[params.message.dict()],
                task_metadata=params.metadata or {},
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(db_task)
        
        db.commit()
        db.refresh(db_task)
        
        # Convert to Pydantic
        task = self._db_to_pydantic(db_task)
        
        # Process task asynchronously
        asyncio.create_task(self._process_task(task, db, api_key))
        
        return task
    
    async def handle_task_get(self, params: TaskQueryParams, db: Session) -> Task:
        """Handle tasks/get request from database"""
        db_task = db.query(TaskModel).filter(TaskModel.id == params.id).first()
        
        if not db_task:
            raise ValueError(f"Task {params.id} not found")
        
        task = self._db_to_pydantic(db_task)
        
        # Apply history length limit if specified
        if params.historyLength and params.historyLength > 0:
            task.history = task.history[-params.historyLength:]
        
        return task
    
    async def handle_task_cancel(self, task_id: str, db: Session) -> Task:
        """Handle tasks/cancel request"""
        db_task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
        
        if not db_task:
            raise ValueError(f"Task {task_id} not found")
        
        if db_task.status_state in [TaskState.COMPLETED.value, TaskState.FAILED.value, TaskState.CANCELLED.value]:
            raise ValueError(f"Task {task_id} cannot be cancelled (state: {db_task.status_state})")
        
        db_task.status_state = TaskState.CANCELLED.value
        db_task.status_message = "Task cancelled by user"
        db_task.updated_at = datetime.utcnow()
        db.commit()
        
        # Phase 1: Broadcast cancellation via WebSocket
        await ws_manager.update_status(task_id, TaskState.CANCELLED.value, "Task cancelled by user")
        
        return self._db_to_pydantic(db_task)
    
    async def list_user_tasks(
        self,
        user: User,
        db: Session,
        limit: int = 50,
        offset: int = 0,
        state: Optional[TaskState] = None
    ) -> List[Task]:
        """List tasks for a specific user (Phase 3)"""
        query = db.query(TaskModel).filter(TaskModel.user_id == user.id)
        
        if state:
            query = query.filter(TaskModel.status_state == state.value)
        
        db_tasks = query.order_by(TaskModel.created_at.desc()).limit(limit).offset(offset).all()
        
        return [self._db_to_pydantic(t) for t in db_tasks]
    
    async def _process_task(self, task: Task, db: Session, api_key: Optional[str] = None):
        """
        Process task with all enhancements:
        - Phase 1: WebSocket streaming
        - Phase 2: RAG context retrieval
        - Phase 5: Tool execution
        """
        try:
            # Update DB and broadcast status
            await self._update_task_status(
                task.id, db,
                TaskState.IN_PROGRESS,
                "Processing request",
                0.1
            )
            
            logger.info(f"Processing task {task.id}")
            
            # Extract user message
            user_message = next(
                (msg for msg in reversed(task.history) if msg.role == Role.USER),
                None
            )
            
            if not user_message:
                raise ValueError("No user message found in task")
            
            # Get content
            if isinstance(user_message.content, str):
                user_content = user_message.content
            else:
                user_content = " ".join(
                    part.text for part in user_message.content if part.text
                )
            
            # Extract metadata
            metadata = task.metadata or {}
            language = metadata.get("language", "English")
            
            # Phase 2: RAG Context Retrieval
            await self._update_task_status(task.id, db, TaskState.IN_PROGRESS, "Retrieving context", 0.2)
            
            context_text = ""
            context_sources = []
            
            try:
                # Search for relevant context
                context_docs = await rag_service.query(
                    user_content,
                    top_k=4
                )
                
                if context_docs:
                    context_text = "\n\n".join([doc.page_content for doc in context_docs])
                    context_sources = [
                        {
                            "source": doc.metadata.get("source", "Unknown"),
                            "excerpt": doc.page_content[:200]
                        }
                        for doc in context_docs
                    ]
                    
                    # Store context sources in DB
                    db_task = db.query(TaskModel).filter(TaskModel.id == task.id).first()
                    if db_task:
                        db_task.context_sources = context_sources
                        db.commit()
                    
                    logger.info(f"Retrieved {len(context_docs)} context documents")
            except Exception as e:
                logger.warning(f"RAG retrieval failed, continuing without context: {e}")
            
            # Phase 5: Get available tools
            tools_schema = tool_registry.get_tools_schema()
            tools_text = json.dumps(tools_schema, indent=2)
            
            # Build enriched prompt
            system_prompt = f"""You are an expert AI assistant.
..."""
            
            # Phase 1: Stream LLM response
            await self._update_task_status(task.id, db, TaskState.IN_PROGRESS, "Analyzing request and planning response", 0.3)
            await asyncio.sleep(0.5) # Slight delay for UI visibility
            await self._update_task_status(task.id, db, TaskState.IN_PROGRESS, "Generating consultant insights", 0.5)
            
            # Determine API Key hierarchy: Header > User Profile > Environment
            llm_api_key = api_key
            
            # If not in header, check user profile
            if not llm_api_key and task.userId:
                db_user = db.query(User).filter(User.id == task.userId).first()
                if db_user and db_user.profile and db_user.profile.gemini_api_key:
                    llm_api_key = db_user.profile.gemini_api_key
                    logger.info(f"Using Gemini API key from user profile for task {task.id}")
            
            # Fallback to environment variable
            llm_api_key = llm_api_key or os.getenv("GOOGLE_API_KEY")
            
            if not llm_api_key:
                raise ValueError("Google API Key not configured (checked header, profile, and env)")
            
            llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-pro",
                google_api_key=llm_api_key,
                temperature=0.4,
                max_retries=2
            )

            
            prompt = ChatPromptTemplate.from_template(system_prompt)
            chain = prompt | llm | StrOutputParser()
            
            # Stream response chunks via WebSocket
            response_chunks = []
            async for chunk in chain.astream({}):
                response_chunks.append(chunk)
                await ws_manager.stream_llm_chunk(task.id, chunk)
            
            response_text = "".join(response_chunks)
            
            await self._update_task_status(task.id, db, TaskState.IN_PROGRESS, "Processing response", 0.8)
            
            # Add assistant response to history
            assistant_message = Message(
                role=Role.ASSISTANT,
                content=response_text
            )
            
            # Update DB with response
            db_task = db.query(TaskModel).filter(TaskModel.id == task.id).first()
            if db_task:
                history = db_task.history or []
                history.append(assistant_message.dict())
                db_task.history = history
                db.commit()
            
            # Create text artifact
            artifact = Artifact(
                id=str(uuid.uuid4()),
                type="text",
                content=response_text,
                metadata={
                    "language": language,
                    "has_context": bool(context_text)
                }
            )
            
            # Phase 5: Extract and process tool calls
            tool_calls = self._extract_tool_calls(response_text)
            
            if tool_calls:
                logger.info(f"Extracted {len(tool_calls)} tool calls")
                
                for tool_call_data in tool_calls:
                    try:
                        tool_call = tool_registry.create_tool_call(
                            tool_call_data["tool"],
                            tool_call_data["arguments"]
                        )
                        
                        # Create tool call artifact
                        tool_artifact = Artifact(
                            id=tool_call.id,
                            type="tool_call",
                            content=tool_call.dict(),
                            metadata={"requires_confirmation": tool_call.requires_confirmation}
                        )
                        
                        # Add to DB
                        if db_task:
                            artifacts = db_task.artifacts or []
                            artifacts.append(tool_artifact.dict())
                            db_task.artifacts = artifacts
                            db.commit()
                        
                        # Broadcast via WebSocket
                        await ws_manager.add_artifact(task.id, tool_artifact.dict())
                        
                    except Exception as e:
                        logger.error(f"Tool call creation failed: {e}")
            
            # Add text artifact to DB
            if db_task:
                artifacts = db_task.artifacts or []
                artifacts.append(artifact.dict())
                db_task.artifacts = artifacts
                db.commit()
            
            # Complete task
            await self._update_task_status(
                task.id, db,
                TaskState.COMPLETED,
                "Task completed successfully",
                1.0,
                completed=True
            )
            
            logger.info(f"Task {task.id} completed successfully")
            
        except Exception as e:
            logger.error(f"Task {task.id} failed: {str(e)}")
            
            await self._update_task_status(
                task.id, db,
                TaskState.FAILED,
                f"Task failed: {str(e)}",
                1.0
            )
            
            # Add error message to history
            error_message = Message(
                role=Role.ASSISTANT,
                content=f"I encountered an error while processing your request: {str(e)}"
            )
            
            db_task = db.query(TaskModel).filter(TaskModel.id == task.id).first()
            if db_task:
                history = db_task.history or []
                history.append(error_message.dict())
                db_task.history = history
                db.commit()
    
    async def _update_task_status(
        self,
        task_id: str,
        db: Session,
        state: TaskState,
        message: str,
        progress: float,
        completed: bool = False
    ):
        """Update task status in DB and broadcast via WebSocket"""
        db_task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
        
        if db_task:
            db_task.status_state = state.value
            db_task.status_message = message
            db_task.status_progress = progress
            db_task.updated_at = datetime.utcnow()
            
            if completed:
                db_task.completed_at = datetime.utcnow()
            
            db.commit()
        
        # WebSocket broadcast
        await ws_manager.update_status(task_id, state.value, message, progress)
    
    def _extract_tool_calls(self, response_text: str) -> List[Dict[str, Any]]:
        """Extract tool calls from LLM response using a robust scanning approach"""
        tool_calls = []
        if "tool_call" not in response_text:
            return tool_calls

        import json
        # Find all possible JSON-like blocks starting with {
        start_indices = [i for i, char in enumerate(response_text) if char == '{']
        
        for start in start_indices:
            # Try progressively longer substrings to find valid JSON
            stack = 0
            for end in range(start, len(response_text)):
                if response_text[end] == '{':
                    stack += 1
                elif response_text[end] == '}':
                    stack -= 1
                    if stack == 0:
                        candidate = response_text[start:end+1]
                        try:
                            data = json.loads(candidate)
                            if isinstance(data, dict) and "tool_call" in data:
                                tool_calls.append(data["tool_call"])
                        except:
                            pass
                        break
        
        # Remove duplicates if any (by content)
        unique_calls = []
        seen = set()
        for call in tool_calls:
            call_str = json.dumps(call, sort_keys=True)
            if call_str not in seen:
                unique_calls.append(call)
                seen.add(call_str)
                
        return unique_calls


# Global enhanced server instance
a2a_server = A2AServer()
