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

from typing import Dict, Any, List, Optional, Union
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
from tools import tool_registry, ToolCall as LegacyToolCall
from rag import rag_service
from dms_utils import DMSClient
from agent_schemas import HomeAgentAction, AdvisorAction, CreateDocumentSetup

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
    type: str  # "text", "tool_call", "context", "data", "agent_action"
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
    - Structured Agent Actions
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
        Process task with structured output and autonomous tool execution
        """
        try:
            # Determine correctly authorized user
            db_user = None
            if task.userId:
                db_user = db.query(User).filter(User.id == task.userId).first()
            
            # Setup DMS tool handlers for this specific task context
            if db_user:
                dms_client = DMSClient(db_user, db)
                
                async def list_dms_handler(**kwargs):
                    return await dms_client.list_files(
                        folder_path=kwargs.get("folder_path"),
                        limit=kwargs.get("limit", 20)
                    )
                
                async def read_dms_handler(**kwargs):
                    return await dms_client.read_file(file_id=kwargs.get("file_id"))
                
                # Injection (not ideal but works for prototype, ideally tool_registry is per-request or stateless)
                tool_registry.tools["listDmsFiles"].handler = list_dms_handler
                tool_registry.tools["readDmsFile"].handler = read_dms_handler

            # Determine API Key
            llm_api_key = api_key
            if not llm_api_key and db_user:
                if db_user.profile and db_user.profile.gemini_api_key:
                    llm_api_key = db_user.profile.gemini_api_key
            
            llm_api_key = llm_api_key or os.getenv("GOOGLE_API_KEY")
            if not llm_api_key:
                raise ValueError("API Key not configured")
            
            llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-pro",
                google_api_key=llm_api_key,
                temperature=0.2,
                max_retries=3
            )
            
            # Determine correct schema based on mode
            metadata = task.metadata or {}
            mode = metadata.get("mode", "home")
            
            output_schema = HomeAgentAction
            if mode == "advisor":
                output_schema = AdvisorAction
            elif mode == "create_document":
                output_schema = CreateDocumentSetup
            
            # Bind structured output
            structured_llm = llm.with_structured_output(output_schema)
            
            # Autonomous execution loop
            max_iterations = 5
            context_findings = []
            
            import re
            
            # Extract user message
            user_message = next((msg for msg in reversed(task.history) if msg.role == Role.USER), None)
            user_text = user_message.content if user_message and isinstance(user_message.content, str) else ""

            # Extract requested documents and tools
            requested_docs = [m.group(1) for m in re.finditer(r'@Document:([^\s]+)', user_text)]
            requested_tools = [m.group(1) for m in re.finditer(r'@Tool:([^\s]+)', user_text)]
            
            clean_user_text = re.sub(r'@[A-Za-z]+:[^\s]+', '', user_text).strip()
            if not clean_user_text:
                clean_user_text = user_text

            # Phase 2: RAG Context
            await self._update_task_status(task.id, db, TaskState.IN_PROGRESS, "Consulting knowledge base", 0.2)
            try:
                filters = {"sources": requested_docs} if requested_docs else None
                docs = await rag_service.query(clean_user_text, filters=filters, top_k=4)
                if docs:
                    context_findings.append(f"Knowledge Base: {[doc.page_content for doc in docs]}")
                elif requested_docs:
                    # Fallback if the specifically requested documents yielded no results
                    fallback_docs = await rag_service.query(clean_user_text, top_k=4)
                    if fallback_docs:
                        context_findings.append(f"Knowledge Base (Fallback, specific docs not found): {[doc.page_content for doc in fallback_docs]}")
            except Exception as e:
                logger.warning(f"RAG failed: {e}")

            iteration = 0
            while iteration < max_iterations:
                iteration += 1
                await self._update_task_status(task.id, db, TaskState.IN_PROGRESS, f"Agent reasoning (Round {iteration})", 0.3 + (iteration * 0.1))
                
                # Build context-aware prompt
                system_tools_instruction = ""
                if requested_tools:
                    system_tools_instruction = f"\nUSER REQUESTED TOOLS: The user explicitly requested to use the following tools: {', '.join(requested_tools)}. Prioritize using these if applicable to the task.\n"

                system_msg = f"""Expert Word AI Agent. Mode: {mode}.
Current Context Findings: {json.dumps(context_findings)}
Available Tools: {json.dumps(tool_registry.get_tools_schema())}{system_tools_instruction}
"""
                prompt = ChatPromptTemplate.from_messages([
                    ("system", system_msg),
                    ("human", user_text)
                ])
                
                # Get structured action
                action = await (prompt | structured_llm).ainvoke({})
                
                logger.info(f"Agent Action ({mode}): {action}")

                # Create artifact for reasoning visibility
                action_artifact = Artifact(
                    id=str(uuid.uuid4()),
                    type="agent_action",
                    content=action.dict()
                )
                await self._add_artifact_to_db(task.id, action_artifact, db)
                await ws_manager.add_artifact(task.id, action_artifact.dict())

                # Branch based on action type
                if hasattr(action, 'type') and action.type == "execute_tool":
                    await self._update_task_status(task.id, db, TaskState.IN_PROGRESS, f"Executing: {action.tool_name}", 0.5)
                    
                    try:
                        # Pass user and db context to execute_tool
                        result = await tool_registry.execute_tool(
                            action.tool_name, 
                            action.arguments,
                            user=db_user,
                            db=db
                        )
                        context_findings.append(f"Tool {action.tool_name} Result: {result}")
                        
                        # Add tool artifact
                        tool_art = Artifact(
                            id=str(uuid.uuid4()),
                            type="tool_result",
                            content={"tool": action.tool_name, "result": result}
                        )
                        await self._add_artifact_to_db(task.id, tool_art, db)
                        await ws_manager.add_artifact(task.id, tool_art.dict())

                    except Exception as e:
                        context_findings.append(f"Tool {action.tool_name} Error: {str(e)}")
                        continue
                
                elif hasattr(action, 'type') and action.type == "request_user_clarification":
                    await self._complete_task(task.id, db, f"Clarification requested: {action.question}")
                    return
                
                elif hasattr(action, 'type') and action.type == "no_action":
                    await self._complete_task(task.id, db, f"No action taken: {action.reason}")
                    return

                else:
                    # Final answer or Complex structure (like CreateDocumentSetup)
                    await self._complete_task(task.id, db, "Agent task completed")
                    return

            await self._complete_task(task.id, db, "Task completed (max iterations reached)")

        except Exception as e:
            logger.error(f"Task {task.id} failed: {e}")
            await self._update_task_status(task.id, db, TaskState.FAILED, f"Error: {str(e)}", 1.0)

    async def _add_artifact_to_db(self, task_id: str, artifact: Artifact, db: Session):
        db_task = db.query(TaskModel).filter(TaskModel.id == task_id).first()
        if db_task:
            artifacts = list(db_task.artifacts or [])
            artifacts.append(artifact.dict())
            db_task.artifacts = artifacts
            db.commit()

    async def _complete_task(self, task_id: str, db: Session, message: str):
        await self._update_task_status(task_id, db, TaskState.COMPLETED, message, 1.0, completed=True)

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
        await ws_manager.update_status(task_id, state.value, message, progress)

    def _extract_tool_calls(self, response_text: str) -> List[Dict[str, Any]]:
        # Deprecated: Using with_structured_output now
        return []


# Global server instance
a2a_server = A2AServer()
