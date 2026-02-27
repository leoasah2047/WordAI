from typing import Any, Dict, List, Literal, Optional, Union
from pydantic import BaseModel, Field

# --- Base Schemas ---

class AgentActionBase(BaseModel):
    agent_reasoning: str = Field(..., description="Explanation for the Activity Feed or internal log")

# --- Home Agent Actions ---

class InsertTextAction(AgentActionBase):
    type: Literal["insert_text"] = "insert_text"
    content: str
    location: Literal["cursor", "replace_selection", "end"]

class ModifySelectionAction(AgentActionBase):
    type: Literal["modify_selection"] = "modify_selection"
    instructions: str

class ExecuteToolAction(AgentActionBase):
    type: Literal["execute_tool"] = "execute_tool"
    tool_name: str = Field(..., description="Must be an enabled WordToolName or GeneralToolName")
    arguments: Dict[str, Any]

class RequestClarificationAction(AgentActionBase):
    type: Literal["request_user_clarification"] = "request_user_clarification"
    question: str

class NoAction(AgentActionBase):
    type: Literal["no_action"] = "no_action"
    reason: str

HomeAgentAction = Union[
    InsertTextAction,
    ModifySelectionAction,
    ExecuteToolAction,
    RequestClarificationAction,
    NoAction
]

# --- Advisor Actions ---

class HighlightRangeAction(AgentActionBase):
    type: Literal["highlight_critical_range"] = "highlight_critical_range"
    text_to_highlight: str
    reason: str = Field(..., description="User-facing reason displayed in UI")
    severity: Literal["low", "medium", "high"]

class ProposeEditAction(AgentActionBase):
    type: Literal["propose_document_edit"] = "propose_document_edit"
    original_text: str
    proposed_text: str
    explanation: str = Field(..., description="Why the edit is proposed")

class RequestApprovalAction(AgentActionBase):
    type: Literal["request_approval"] = "request_approval"
    summary: str
    choices: Optional[List[str]] = Field(None, description="E.g., ['Approve', 'Reject', 'Modify']")

class ProceedStepAction(AgentActionBase):
    type: Literal["proceed_to_next_step"] = "proceed_to_next_step"
    current_step_index: int
    step_summary: str

AdvisorAction = Union[
    HighlightRangeAction,
    ProposeEditAction,
    RequestApprovalAction,
    ProceedStepAction,
    ExecuteToolAction
]

# --- Create Document Action ---

class DocumentSection(BaseModel):
    title: str
    content: str
    requires_source_verification: bool = False
    source_reference: Optional[str] = Field(None, description="Name of the DMS file or source of truth used")

class CreateDocumentSetup(AgentActionBase):
    title: str = Field(..., description="Primary title of the generated document")
    description: str = Field(..., description="Short abstract or executive summary")
    sections: List[DocumentSection]
    metadata: Dict[str, Any] = Field(..., description="Industry, documentType, tone, etc.")
