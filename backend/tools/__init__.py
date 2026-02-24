"""
Phase 5: Tool Execution Framework

Defines tool interfaces and provides a registry for Word API tools
that can be executed by AI agents.
"""

from pydantic import BaseModel
from typing import Any, Dict, List, Optional, Callable
from enum import Enum
import json
from logging_config import get_logger

logger = get_logger(__name__)


class ToolType(str, Enum):
    """Types of tools available"""
    WORD_API = "word_api"
    GENERAL = "general"
    CUSTOM = "custom"


class ToolParameter(BaseModel):
    """Single tool parameter define"""
    name: str
    type: str  # "string", "number", "boolean", "object", "array"
    description: str
    required: bool = False
    enum: Optional[List[str]] = None
    default: Optional[Any] = None


class ToolDefinition(BaseModel):
    """Definition of an executable tool"""
    name: str
    description: str
    tool_type: ToolType
    parameters: List[ToolParameter]
    requires_confirmation: bool = False
    is_destructive: bool = False
    examples: Optional[List[Dict[str, Any]]] = None


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
    """
    Registry for managing available tools
    
    Tools are registered with their definitions and can be:
    - Listed for agent awareness
    - Validated before execution
    - Executed with safety checks
    """
    
    def __init__(self):
        self.tools: Dict[str, ToolDefinition] = {}
        self._register_default_tools()
        logger.info("Tool Registry initialized")
    
    def _register_default_tools(self):
        """Register default Word API tools synchronized with wordTools.ts"""
        
        # --- Core Selection & Content ---
        self.register(ToolDefinition(
            name="getSelectedText",
            description="Get the currently selected text in the Word document",
            tool_type=ToolType.WORD_API,
            parameters=[]
        ))
        
        self.register(ToolDefinition(
            name="getDocumentContent",
            description="Get the full content of the Word document body as plain text",
            tool_type=ToolType.WORD_API,
            parameters=[]
        ))

        self.register(ToolDefinition(
            name="appendText",
            description="Append text to the end of the document",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="text", type="string", description="The text to append", required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="getDocumentProperties",
            description="Get document properties including paragraph count, word count, and character count",
            tool_type=ToolType.WORD_API,
            parameters=[]
        ))

        self.register(ToolDefinition(
            name="getDocumentStructure",
            description="Get the document outline (headings) to understand structure",
            tool_type=ToolType.WORD_API,
            parameters=[]
        ))

        # --- Basic Insertion ---
        self.register(ToolDefinition(
            name="insertText",
            description="Insert text at the current cursor position",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="text", type="string", description="The text to insert", required=True),
                ToolParameter(name="location", type="string", description="Where to insert", enum=["Start", "End", "Before", "After", "Replace"])
            ]
        ))

        self.register(ToolDefinition(
            name="replaceSelectedText",
            description="Replace the currently selected text with new text",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="newText", type="string", description="The new text", required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="insertParagraph",
            description="Insert a new paragraph at the specified location",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="text", type="string", description="The paragraph text", required=True),
                ToolParameter(name="location", type="string", description="Where to insert", enum=["After", "Before", "Start", "End"]),
                ToolParameter(name="style", type="string", description="Word built-in style", enum=["Normal", "Heading1", "Heading2", "Heading3", "Quote", "Title"])
            ]
        ))

        self.register(ToolDefinition(
            name="deleteText",
            description="Delete the currently selected text or a specific range",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="direction", type="string", description="Direction to delete if nothing selected", enum=["Before", "After"])
            ]
        ))

        self.register(ToolDefinition(
            name="selectText",
            description="Select all text in the document or specific location",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="scope", type="string", description='What to select: "All" for entire document', enum=["All"], required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="getRangeInfo",
            description="Get detailed information about the current selection including text, formatting, and position",
            tool_type=ToolType.WORD_API,
            parameters=[]
        ))

        self.register(ToolDefinition(
            name="findText",
            description="Find text in the document and return information about matches. Does not modify the document",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="searchText", type="string", description="The text to search for", required=True),
                ToolParameter(name="matchCase", type="boolean", description="Whether to match case"),
                ToolParameter(name="matchWholeWord", type="boolean", description="Whether to match whole word only")
            ]
        ))

        self.register(ToolDefinition(
            name="bulkFindReplace",
            description="Perform multiple find and replace operations in one go",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="replacements", type="array", description="Array of replacement objects (find, replace, matchCase, matchWholeWord)", required=True)
            ]
        ))

        # --- Formatting ---
        self.register(ToolDefinition(
            name="formatText",
            description="Apply formatting to the currently selected text",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="bold", type="boolean", description="Make text bold"),
                ToolParameter(name="italic", type="boolean", description="Make text italic"),
                ToolParameter(name="underline", type="boolean", description="Underline text"),
                ToolParameter(name="fontSize", type="number", description="Font size in points"),
                ToolParameter(name="fontColor", type="string", description="Font color hex"),
                ToolParameter(name="highlightColor", type="string", description="Highlight color name")
            ]
        ))

        self.register(ToolDefinition(
            name="applyStyle",
            description="Apply a Word style to the selected text",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="styleName", type="string", description="Style name", required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="listStyles",
            description="List all styles available in the document",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="includeBuiltIn", type="boolean", description="Include built-in styles")
            ]
        ))

        self.register(ToolDefinition(
            name="clearFormatting",
            description="Clear all formatting from the selected text",
            tool_type=ToolType.WORD_API,
            parameters=[]
        ))

        self.register(ToolDefinition(
            name="setFontName",
            description="Set the font name/family for the selected text",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="fontName", type="string", description="Font name (e.g., Arial, Calibri)", required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="setFontAdvanced",
            description="Apply advanced font formatting like strikethrough, subscript, or superscript",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="strikethrough", type="boolean", description="Apply strikethrough"),
                ToolParameter(name="subscript", type="boolean", description="Apply subscript"),
                ToolParameter(name="superscript", type="boolean", description="Apply superscript"),
                ToolParameter(name="doubleStrikethrough", type="boolean", description="Apply double strikethrough")
            ]
        ))

        self.register(ToolDefinition(
            name="changeCase",
            description="Change the case of the selected text",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="caseType", type="string", description="Type of case to apply", enum=["lowercase", "UPPERCASE", "Sentence case", "Capitalize Each Word"], required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="insertSymbol",
            description="Insert a specific symbol or character at the current position",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="symbol", type="string", description="The symbol to insert", required=True),
                ToolParameter(name="fontName", type="string", description="Optional font for the symbol")
            ]
        ))

        # --- Search & Replace ---
        self.register(ToolDefinition(
            name="searchAndReplace",
            description="Search for text and replace it with new text",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="searchText", type="string", description="Text to search", required=True),
                ToolParameter(name="replaceText", type="string", description="Replacement text", required=True),
                ToolParameter(name="matchCase", type="boolean", description="Match case"),
                ToolParameter(name="matchWholeWord", type="boolean", description="Match whole word")
            ]
        ))

        # --- Tables & Lists ---
        self.register(ToolDefinition(
            name="insertTable",
            description="Insert a table at the cursor position",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="rows", type="number", description="Number of rows", required=True),
                ToolParameter(name="columns", type="number", description="Number of columns", required=True),
                ToolParameter(name="data", type="array", description="2D array of cell values")
            ]
        ))

        self.register(ToolDefinition(
            name="formatTable",
            description="Format the table at the current cursor position with advanced styling",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="style", type="string", description="Table style name"),
                ToolParameter(name="headerRow", type="boolean", description="Show/hide header row"),
                ToolParameter(name="firstColumn", type="boolean", description="Highlight first column"),
                ToolParameter(name="lastColumn", type="boolean", description="Highlight last column"),
                ToolParameter(name="bandedRows", type="boolean", description="Alternate row shading"),
                ToolParameter(name="bandedColumns", type="boolean", description="Alternate column shading"),
                ToolParameter(name="shadingColor", type="string", description="Background shading color hex"),
                ToolParameter(name="alignment", type="string", description="Table alignment", enum=["Left", "Centered", "Right"])
            ]
        ))

        self.register(ToolDefinition(
            name="insertList",
            description="Insert a bulleted or numbered list",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="items", type="array", description="List item texts", required=True),
                ToolParameter(name="listType", type="string", description="Type of list", enum=["bullet", "number"], required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="getTableInfo",
            description="Get information about tables in the document",
            tool_type=ToolType.WORD_API,
            parameters=[]
        ))

        self.register(ToolDefinition(
            name="insertPageBreak",
            description="Insert a page break at the current cursor position",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="location", type="string", description="Where to insert", enum=["Before", "After", "Start", "End"])
            ]
        ))

        self.register(ToolDefinition(
            name="insertBookmark",
            description="Insert a bookmark at the current selection",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="name", type="string", description="Bookmark name (unique, no spaces)", required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="goToBookmark",
            description="Navigate to a previously created bookmark",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="name", type="string", description="Bookmark name", required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="insertContentControl",
            description="Insert a content control container",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="title", type="string", description="Title of the control", required=True),
                ToolParameter(name="tag", type="string", description="Optional tag"),
                ToolParameter(name="appearance", type="string", description="Visual appearance", enum=["BoundingBox", "Tags", "Hidden"])
            ]
        ))

        self.register(ToolDefinition(
            name="createSection",
            description="Create a new section break",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="type", type="string", description="Type of section break", enum=["NextPage", "Continuous", "EvenPage", "OddPage"])
            ]
        ))

        self.register(ToolDefinition(
            name="setPageMargins",
            description="Set the page margins for the current section",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="top", type="number", description="Top margin in points"),
                ToolParameter(name="bottom", type="number", description="Bottom margin in points"),
                ToolParameter(name="left", type="number", description="Left margin in points"),
                ToolParameter(name="right", type="number", description="Right margin in points")
            ]
        ))

        self.register(ToolDefinition(
            name="setPageOrientation",
            description="Set the page orientation for the current section",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="orientation", type="string", description="Page orientation", enum=["Portrait", "Landscape"], required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="setPageColumnCount",
            description="Set the number of columns for the current section layout",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="count", type="number", description="Number of columns (1-3)", required=True)
            ]
        ))

        # --- Objects & Layout ---
        self.register(ToolDefinition(
            name="insertImage",
            description="Insert an image from a URL",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="imageUrl", type="string", description="Image URL", required=True),
                ToolParameter(name="width", type="number", description="Width in points"),
                ToolParameter(name="height", type="number", description="Height in points"),
                ToolParameter(name="location", type="string", description="Insertion location", enum=["Before", "After", "Start", "End", "Replace"])
            ]
        ))

        self.register(ToolDefinition(
            name="arrangeObject",
            description="Adjust the layout and text wrapping of a selected object",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="wrapText", type="string", description="Text wrapping style", required=True, enum=["Square", "Tight", "Through", "TopAndBottom", "BehindText", "InFrontOfText", "Inline"]),
                ToolParameter(name="alignment", type="string", description="Horizontal alignment", enum=["Left", "Centered", "Right"]),
                ToolParameter(name="vAlignment", type="string", description="Vertical alignment", enum=["Top", "Center", "Bottom"])
            ]
        ))

        self.register(ToolDefinition(
            name="insertShape",
            description="Insert a basic shape (Rectangle) into the document",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="color", type="string", description="Fill color"),
                ToolParameter(name="width", type="number", description="Width in points"),
                ToolParameter(name="height", type="number", description="Height in points")
            ]
        ))

        self.register(ToolDefinition(
            name="insertChart",
            description="Insert a placeholder chart into the document",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="type", type="string", description="Chart type", enum=["Bar", "Pie", "Line"])
            ]
        ))

        self.register(ToolDefinition(
            name="insertSmartArt",
            description="Insert a SmartArt-like diagram placeholder",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="diagramType", type="string", description="Type of diagram")
            ]
        ))

        # --- References & Citations ---
        self.register(ToolDefinition(
            name="insertCitation",
            description="Add a bibliographic citation source to the document",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="author", type="string", description="Author name(s)", required=True),
                ToolParameter(name="title", type="string", description="Title of the work", required=True),
                ToolParameter(name="year", type="number", description="Year"),
                ToolParameter(name="tag", type="string", description="Short tag/ID")
            ]
        ))

        self.register(ToolDefinition(
            name="insertFootnote",
            description="Insert a footnote at the current position",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="text", type="string", description="Footnote text", required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="insertEndnote",
            description="Insert an endnote at the current position",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="text", type="string", description="Endnote text", required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="insertTableOfContents",
            description="Insert a Table of Contents at the current position",
            tool_type=ToolType.WORD_API,
            parameters=[]
        ))

        self.register(ToolDefinition(
            name="insertCaption",
            description="Insert a caption for an image or table",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="label", type="string", description='Label (e.g., "Figure", "Table")', required=True),
                ToolParameter(name="title", type="string", description="Caption title text", required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="insertIndex",
            description="Insert an index at the end of the document",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="columns", type="number", description="Number of columns in the index")
            ]
        ))

        self.register(ToolDefinition(
            name="insertTableOfAuthorities",
            description="Insert a Table of Authorities (legal) at the end of the document",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="category", type="string", description='Category (e.g., "Cases", "Statutes")')
            ]
        ))

        # --- Reviewing ---
        self.register(ToolDefinition(
            name="insertComment",
            description="Add a comment to the currently selected text",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="text", type="string", description="Comment text", required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="listComments",
            description="Retrieve a list of all comments in the document",
            tool_type=ToolType.WORD_API,
            parameters=[]
        ))

        self.register(ToolDefinition(
            name="deleteComment",
            description="Delete specific or all comments",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="author", type="string", description="Optional author filter")
            ]
        ))

        self.register(ToolDefinition(
            name="setTrackChanges",
            description="Enable or disable Track Changes",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="enabled", type="boolean", description="True to enable", required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="acceptTrackedChanges",
            description="Accept all tracked changes in the document",
            tool_type=ToolType.WORD_API,
            parameters=[]
        ))

        self.register(ToolDefinition(
            name="rejectTrackedChanges",
            description="Reject all tracked changes in the document",
            tool_type=ToolType.WORD_API,
            parameters=[]
        ))

        self.register(ToolDefinition(
            name="insertHyperlink",
            description="Insert a hyperlink on the selected text or at the cursor",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="url", type="string", description="The absolute URL", required=True),
                ToolParameter(name="text", type="string", description="The link text")
            ]
        ))

        # --- Document Actions & Page Setup ---
        self.register(ToolDefinition(
            name="saveDocument",
            description="Save the current document",
            tool_type=ToolType.WORD_API,
            parameters=[]
        ))

        self.register(ToolDefinition(
            name="printDocument",
            description="Trigger the system print dialog",
            tool_type=ToolType.WORD_API,
            parameters=[]
        ))

        self.register(ToolDefinition(
            name="exportAsPdf",
            description="Export the document as a PDF file",
            tool_type=ToolType.WORD_API,
            parameters=[]
        ))

        self.register(ToolDefinition(
            name="newDocument",
            description="Create a new blank document",
            tool_type=ToolType.WORD_API,
            parameters=[]
        ))

        self.register(ToolDefinition(
            name="setPageColor",
            description="Set the background color of the document pages",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="color", type="string", description="Background color hex", required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="insertWatermark",
            description="Insert a text watermark into the document",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="text", type="string", description="Watermark text", required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="setPaperSize",
            description="Set the paper size for the current section",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="size", type="string", description="Paper size name", enum=["A3", "A4", "A5", "B4", "B5", "Executive", "Legal", "Letter", "Statement"], required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="setLineNumbers",
            description="Enable or disable line numbering",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="enabled", type="boolean", description="Enable line numbering", required=True),
                ToolParameter(name="restartType", type="string", description="When to restart numbering", enum=["Continuous", "NewPage", "NewSection"])
            ]
        ))

        self.register(ToolDefinition(
            name="compareDocuments",
            description="Compare the current document with another version",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="otherDocBase64", type="string", description="Base64 string of the other document", required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="protectDocument",
            description="Protect the document with a specific protection type",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="type", type="string", description="Protection type", enum=["ReadOnly", "CommentsOnly", "TrackedChangesOnly", "FormsOnly"], required=True),
                ToolParameter(name="password", type="string", description="Optional password")
            ]
        ))

        self.register(ToolDefinition(
            name="setZoom",
            description="Adjust the view zoom level",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="percent", type="number", description="Zoom percentage (e.g. 100)", required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="setHyphenation",
            description="Enable or disable automatic hyphenation",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="enabled", type="boolean", description="Enable hyphenation", required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="translateSelection",
            description="Translate the selected text using AI",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="targetLanguage", type="string", description="Target language", required=True)
            ]
        ))

        # --- Advanced New Tools ---
        self.register(ToolDefinition(
            name="insertAnnotation",
            description="Insert an annotation (critique or note) for the selected text",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="content", type="string", description="The text of the annotation", required=True),
                ToolParameter(name="critic", type="string", description="Name of the person/agent providing the annotation")
            ]
        ))

        self.register(ToolDefinition(
            name="insertCheckboxContentControl",
            description="Insert a checkbox content control at the current position",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="title", type="string", description="Title of the checkbox"),
                ToolParameter(name="checked", type="boolean", description="Initial state")
            ]
        ))

        self.register(ToolDefinition(
            name="updateCheckboxContentControl",
            description="Update the state of a checkbox content control",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="title", type="string", description="Title of the checkbox to update", required=True),
                ToolParameter(name="checked", type="boolean", description="New state of the checkbox", required=True)
            ]
        ))

        self.register(ToolDefinition(
            name="manageField",
            description="Insert, update, or delete document fields",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="action", type="string", description="Action to perform", enum=["Insert", "UpdateAll", "DeleteSelected"], required=True),
                ToolParameter(name="fieldType", type="string", description='Field code (e.g., "DATE")')
            ]
        ))

        self.register(ToolDefinition(
            name="mergeTableCells",
            description="Merge selected cells in a table",
            tool_type=ToolType.WORD_API,
            parameters=[]
        ))

        self.register(ToolDefinition(
            name="splitTableCells",
            description="Split a merged cell or specific range into multiple rows/columns",
            tool_type=ToolType.WORD_API,
            parameters=[
                ToolParameter(name="rows", type="number", description="Number of rows", required=True),
                ToolParameter(name="columns", type="number", description="Number of columns", required=True)
            ]
        ))

        # --- DMS (Google Drive / ERPNext) ---

        self.register(ToolDefinition(
            name="listDmsFiles",
            description="List files from the connected Document Management System (Google Drive or ERPNext)",
            tool_type=ToolType.GENERAL,
            parameters=[
                ToolParameter(name="folder_path", type="string", description="Optional folder path to list (ERPNext) or folder ID (Google Drive)"),
                ToolParameter(name="limit", type="number", description="Maximum number of files to return", default=20)
            ]
        ))

        self.register(ToolDefinition(
            name="readDmsFile",
            description="Read the content of a file from the connected Document Management System",
            tool_type=ToolType.GENERAL,
            parameters=[
                ToolParameter(name="file_id", type="string", description="The ID or path of the file to read", required=True)
            ]
        ))

        # self.register(ToolDefinition(
        #     name="uploadDmsFile",
        #     description="Upload a document to the connected Document Management System",
        #     tool_type=ToolType.GENERAL,
        #     parameters=[
        #         ToolParameter(name="file_name", type="string", description="Name of the file to create", required=True),
        #         ToolParameter(name="content_base64", type="string", description="Base64 encoded file content", required=True),
        #         ToolParameter(name="folder_path", type="string", description="Optional destination folder")
        #     ]
        # ))

    def register(self, tool: ToolDefinition):
        """Register a new tool"""
        self.tools[tool.name] = tool
        logger.info(f"Registered tool: {tool.name}")

    
    def get_tool(self, name: str) -> Optional[ToolDefinition]:
        """Get tool definition by name"""
        return self.tools.get(name)
    
    def list_tools(self, tool_type: Optional[ToolType] = None) -> List[ToolDefinition]:
        """List all available tools, optionally filtered by type"""
        if tool_type:
            return [t for t in self.tools.values() if t.tool_type == tool_type]
        return list(self.tools.values())
    
    def get_tools_schema(self) -> List[Dict[str, Any]]:
        """
        Get tool definitions in a format suitable for LLM function calling
        
        Returns JSON schema compatible with OpenAI/Gemini function calling
        """
        schema = []
        
        for tool in self.tools.values():
            properties = {}
            required = []
            
            for param in tool.parameters:
                prop = {
                    "type": param.type,
                    "description": param.description
                }
                
                if param.enum:
                    prop["enum"] = param.enum
                
                if param.default is not None:
                    prop["default"] = param.default
                
                properties[param.name] = prop
                
                if param.required:
                    required.append(param.name)
            
            schema.append({
                "name": tool.name,
                "description": tool.description,
                "parameters": {
                    "type": "object",
                    "properties": properties,
                    "required": required
                }
            })
        
        return schema
    
    def validate_tool_call(self, tool_name: str, arguments: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """
        Validate a tool call against its definition
        
        Returns: (is_valid, error_message)
        """
        tool = self.get_tool(tool_name)
        
        if not tool:
            return False, f"Tool '{tool_name}' not found"
        
        # Check required parameters
        for param in tool.parameters:
            if param.required and param.name not in arguments:
                return False, f"Missing required parameter: {param.name}"
            
            # Validate enum values
            if param.enum and param.name in arguments:
                if arguments[param.name] not in param.enum:
                    return False, f"Invalid value for {param.name}. Must be one of: {param.enum}"
        
       
        return True, None
    
    def create_tool_call(self, tool_name: str, arguments: Dict[str, Any]) -> ToolCall:
        """Create a validated tool call"""
        import uuid
        
        is_valid, error = self.validate_tool_call(tool_name, arguments)
        
        if not is_valid:
            raise ValueError(f"Invalid tool call: {error}")
        
        tool = self.get_tool(tool_name)
        
        return ToolCall(
            id=str(uuid.uuid4()),
            tool_name=tool_name,
            arguments=arguments,
            requires_confirmation=tool.requires_confirmation
        )


# Global tool registry instance
tool_registry = ToolRegistry()
