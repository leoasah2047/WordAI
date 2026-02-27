"""
Phase 5: Tool Execution Framework
"""

from pydantic import BaseModel
from typing import Any, Dict, List, Optional, Callable, Coroutine
from enum import Enum
import json
import uuid
from logging_config import get_logger

logger = get_logger(__name__)


class ToolType(str, Enum):
    WORD_API = "word_api"
    GENERAL = "general"


class ToolParameter(BaseModel):
    name: str
    type: str
    description: str
    required: bool = False
    enum: Optional[List[str]] = None
    default: Optional[Any] = None


class ToolDefinition(BaseModel):
    name: str
    description: str
    tool_type: ToolType
    parameters: List[ToolParameter]
    handler: Optional[Callable[..., Coroutine[Any, Any, Any]]] = None
    requires_confirmation: bool = False


class ToolCall(BaseModel):
    """A tool call request from an agent"""
    id: str
    tool_name: str
    arguments: Dict[str, Any]
    requires_confirmation: bool = True


class ToolResult(BaseModel):
    """Result of tool execution"""
    tool_call_id: str
    success: bool
    result: Optional[Any] = None
    error: Optional[str] = None
    executed_at: Optional[str] = None


class ToolRegistry:
    def __init__(self):
        self.tools: Dict[str, ToolDefinition] = {}
        self._register_default_tools()

    def register(self, tool: ToolDefinition):
        self.tools[tool.name] = tool

    def _register_default_tools(self):
        # Word API
        word_tools = [
            ("getSelectedText", "Get selected text", []),
            ("appendText", "Append text to document", [
                ToolParameter(name="text", type="string", description="Text to append", required=True)
            ]),
            ("insertText", "Insert text at cursor", [
                ToolParameter(name="text", type="string", description="Text to insert", required=True),
                ToolParameter(name="location", type="string", description="Where to insert", enum=["Start", "End", "Replace"])
            ]),
            ("formatText", "Apply formatting", [
                ToolParameter(name="bold", type="boolean", description="Bold text"),
                ToolParameter(name="italic", type="boolean", description="Italic text"),
                ToolParameter(name="color", type="string", description="Hex color")
            ]),
            ("insertTable", "Insert a table", [
                ToolParameter(name="rows", type="number", description="Number of rows", required=True),
                ToolParameter(name="columns", type="number", description="Number of columns", required=True)
            ]),
            ("insertAnnotation", "Insert an annotation", [
                ToolParameter(name="content", type="string", description="Annotation text", required=True)
            ]),
            ("getDocumentContent", "Get full document content", [])
        ]

        for name, desc, params in word_tools:
            self.register(ToolDefinition(name=name, description=desc, tool_type=ToolType.WORD_API, parameters=params))

        # DMS
        self.register(ToolDefinition(
            name="listDmsFiles",
            description="List files from DMS",
            tool_type=ToolType.GENERAL,
            parameters=[
                ToolParameter(name="folder_path", type="string", description="Folder path"),
                ToolParameter(name="limit", type="number", description="Max files", default=20)
            ]
        ))
        self.register(ToolDefinition(
            name="readDmsFile",
            description="Read file from DMS",
            tool_type=ToolType.GENERAL,
            parameters=[
                ToolParameter(name="file_id", type="string", description="File ID", required=True)
            ]
        ))

    def get_tool(self, name: str) -> Optional[ToolDefinition]:
        return self.tools.get(name)

    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any], **kwargs) -> Any:
        tool = self.get_tool(tool_name)
        if not tool: raise ValueError(f"Tool {tool_name} not found")
        if tool.handler: return await tool.handler(**arguments, **kwargs)
        if tool.tool_type == ToolType.WORD_API: return f"SCHEDULED: {tool_name} requires frontend."
        return "INFO: No backend handler."

    def get_tools_schema(self) -> List[Dict[str, Any]]:
        schema = []
        for tool in self.tools.values():
            properties = {p.name: {"type": p.type, "description": p.description} for p in tool.parameters}
            for p in tool.parameters:
                if p.enum: properties[p.name]["enum"] = p.enum
                if p.default is not None: properties[p.name]["default"] = p.default
            schema.append({
                "name": tool.name,
                "description": tool.description,
                "parameters": {"type": "object", "properties": properties, "required": [p.name for p in tool.parameters if p.required]}
            })
        return schema

    def validate_tool_call(self, tool_name: str, arguments: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """Validate a tool call against its definition"""
        tool = self.get_tool(tool_name)
        if not tool:
            return False, f"Tool '{tool_name}' not found"
        for param in tool.parameters:
            if param.required and param.name not in arguments:
                return False, f"Missing required parameter: {param.name}"
            if param.enum and param.name in arguments:
                if arguments[param.name] not in param.enum:
                    return False, f"Invalid value for {param.name}."
        return True, None

    def create_tool_call(self, tool_name: str, arguments: Dict[str, Any]) -> ToolCall:
        """Create a validated tool call"""
        is_valid, error = self.validate_tool_call(tool_name, arguments)
        if not is_valid: raise ValueError(f"Invalid tool call: {error}")
        tool = self.get_tool(tool_name)
        return ToolCall(
            id=str(uuid.uuid4()),
            tool_name=tool_name,
            arguments=arguments,
            requires_confirmation=tool.requires_confirmation
        )

tool_registry = ToolRegistry()
