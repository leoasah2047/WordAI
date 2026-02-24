# A2A Protocol Backend for Word AI

This backend implements the **Agent-to-Agent (A2A) Protocol** to enable AI agent communication between the Word AI frontend and the backend services.

## Features

- **A2A Protocol Support**: JSON-RPC 2.0 compliant endpoints for agent communication
- **Task Management**: Create, track, and manage agent tasks
- **LLM Integration**: Uses Google Gemini for intelligent task processing
- **RAG System**: Vector database integration for document knowledge retrieval
- **Authentication**: OAuth 2.0 support for Google and Microsoft
- **User Profiles**: Nexus persona analysis and contextual preferences

## A2A Endpoints

### Base URL
```
http://localhost:8000
```

### JSON-RPC Endpoint
```
POST /a2a/rpc
```

### Supported Methods

#### 1. `tasks/send`
Create or update a task.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tasks/send",
  "params": {
    "id": "task-uuid",
    "message": {
      "role": "user",
      "content": "Generate a legal contract..."
    },
    "metadata": {
      "functionArea": "Legal",
      "styleAuthor": "GAK",
      "language": "English"
    }
  },
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "id": "task-uuid",
    "status": {
      "state": "pending",
      "message": "Task received"
    },
    "history": [...],
    "artifacts": [],
    "created_at": "2026-02-16T17:00:00",
    "updated_at": "2026-02-16T17:00:00"
  },
  "id": 1
}
```

#### 2. `tasks/get`
Retrieve task status and results.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tasks/get",
  "params": {
    "id": "task-uuid"
  },
  "id": 2
}
```

#### 3. `tasks/cancel`
Cancel a running task.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tasks/cancel",
  "params": {
    "id": "task-uuid"
  },
  "id": 3
}
```

## Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
Create a `.env` file:
```env
GOOGLE_API_KEY=your_gemini_api_key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 3. Run Server
```bash
# Windows
start_server.bat

# Linux/Mac
python main.py
```

Server will start on `http://localhost:8000`

## Architecture

```
┌─────────────────┐
│   Word AI       │
│   Frontend      │
│ (agentOrchest.) │
└────────┬────────┘
         │ JSON-RPC
         │ /a2a/rpc
         ▼
┌─────────────────┐
│  FastAPI        │
│  Backend        │
│  (main.py)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  A2A Server     │
│  (a2a_server.py)│
│                 │
│  Task Manager   │
│  LLM Processor  │
└─────────────────┘
```

## Task States

- `pending`: Task received, queued for processing
- `in_progress`: Task currently being processed by LLM
- `completed`: Task finished successfully
- `failed`: Task encountered an error
- `cancelled`: Task cancelled by user

## API Headers

- `Content-Type: application/json` (required)
- `X-Google-Api-Key: YOUR_API_KEY` (optional, overrides env)

## Testing

Run tests:
```bash
pytest test_main.py -v
```

## Related Files

- `a2a_server.py`: A2A Protocol implementation
- `main.py`: FastAPI application with endpoints
- `models.py`: Database models
- `rag.py`: RAG service for document retrieval
- `auth_utils.py`: OAuth authentication utilities

## Frontend Integration

The frontend `agentOrchestrator.ts` communicates with this backend:

```typescript
const response = await fetch(`${baseUrl}/a2a/rpc`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Google-Api-Key': apiKey,
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'tasks/send',
    params: { /* TaskSendParams */ },
  }),
})
```

## Error Codes

- `-32600`: Invalid Request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error
- `-32700`: Parse error

## License

Internal use only - Consortium Products
