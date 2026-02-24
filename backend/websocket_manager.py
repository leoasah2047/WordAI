"""
Phase 1: WebSocket Manager for Real-Time Streaming

Manages WebSocket connections for real-time task updates and LLM streaming.
"""

import json
import asyncio
from typing import Dict, Set, Optional
from fastapi import WebSocket
from logging_config import get_logger
from config import settings
import redis.asyncio as redis

logger = get_logger(__name__)


class WebSocketManager:
    """
    Manages WebSocket connections with Redis Pub/Sub support for production scaling.
    
    If settings.REDIS_URL is provided, it uses Redis to synchronize messages
    across multiple backend workers.
    """
    
    def __init__(self):
        # task_id -> set of local WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.redis: Optional[redis.Redis] = None
        self.pubsub_task: Optional[asyncio.Task] = None
        logger.info("WebSocket Manager initialized")
    
    async def _init_redis(self):
        """Initialize Redis connection and subscriber task"""
        if settings.REDIS_URL and not self.redis:
            try:
                self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
                self.pubsub_task = asyncio.create_task(self._listen_to_redis())
                logger.info("Redis Pub/Sub connected for WebSockets")
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {e}")
    
    async def _listen_to_redis(self):
        """Listen for messages from other workers via Redis"""
        pubsub = self.redis.pubsub()
        await pubsub.subscribe("websocket_broadcast")
        
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    task_id = data.get("task_id")
                    if task_id and task_id in self.active_connections:
                        # Forward message to local connections
                        await self._local_broadcast(task_id, data["payload"])
        except Exception as e:
            logger.error(f"Redis Pub/Sub listener error: {e}")
        finally:
            await pubsub.unsubscribe("websocket_broadcast")
    
    async def connect(self, task_id: str, websocket: WebSocket):
        """Accept and register a new local WebSocket connection"""
        await websocket.accept()
        
        # Ensure Redis is initialized if available
        if settings.REDIS_URL and not self.redis:
            await self._init_redis()
            
        if task_id not in self.active_connections:
            self.active_connections[task_id] = set()
        
        self.active_connections[task_id].add(websocket)
        logger.info(f"WebSocket connected for task {task_id}")
    
    def disconnect(self, task_id: str, websocket: WebSocket):
        """Remove a local WebSocket connection"""
        if task_id in self.active_connections:
            self.active_connections[task_id].discard(websocket)
            if not self.active_connections[task_id]:
                del self.active_connections[task_id]
        
        logger.info(f"WebSocket disconnected for task {task_id}")
    
    async def broadcast_to_task(self, task_id: str, message: dict):
        """
        Broadcast a message to ALL connections watching a task across ALL workers
        """
        if settings.REDIS_URL:
            # Publish to Redis for cross-worker delivery
            if not self.redis:
                await self._init_redis()
            
            if self.redis:
                try:
                    await self.redis.publish("websocket_broadcast", json.dumps({
                        "task_id": task_id,
                        "payload": message
                    }))
                    return
                except Exception as e:
                    logger.error(f"Redis publish error: {e}")
                    # Fallback to local broadcast if Redis fails
        
        # In-memory fallback (local dev or Redis fail)
        await self._local_broadcast(task_id, message)
    
    async def _local_broadcast(self, task_id: str, message: dict):
        """Helper to send message only to locally connected clients"""
        if task_id not in self.active_connections:
            return
        
        disconnected = set()
        for websocket in self.active_connections[task_id]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to websocket: {e}")
                disconnected.add(websocket)
        
        for ws in disconnected:
            self.disconnect(task_id, ws)
    
    async def stream_llm_chunk(self, task_id: str, chunk: str):
        """Stream an LLM response chunk"""
        await self.broadcast_to_task(task_id, {
            "type": "chunk",
            "content": chunk,
            "timestamp": asyncio.get_event_loop().time()
        })
    
    async def update_status(self, task_id: str, state: str, message: str = None, progress: float = None):
        """Send task status update"""
        await self.broadcast_to_task(task_id, {
            "type": "status",
            "state": state,
            "message": message,
            "progress": progress,
            "timestamp": asyncio.get_event_loop().time()
        })
    
    async def add_artifact(self, task_id: str, artifact: dict):
        """Notify about new artifact"""
        await self.broadcast_to_task(task_id, {
            "type": "artifact",
            "artifact": artifact,
            "timestamp": asyncio.get_event_loop().time()
        })


# Global WebSocket manager instance
ws_manager = WebSocketManager()
