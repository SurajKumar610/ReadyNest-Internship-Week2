from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- AUTH SCHEMAS ---
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    role: str
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

# --- WORKSPACE SCHEMAS ---
class WorkspaceCreate(BaseModel):
    name: str

class WorkspaceOut(BaseModel):
    id: int
    name: str
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- PROJECT SCHEMAS ---
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    workspace_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- DATASET SCHEMAS ---
class DatasetOut(BaseModel):
    id: int
    name: str
    project_id: int
    file_path: str
    row_count: int
    status: str
    error_message: Optional[str] = None
    column_mappings: Optional[Dict[str, str]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DatasetMappingUpdate(BaseModel):
    column_mappings: Dict[str, str]

# --- SALES RECORD SCHEMAS ---
class SalesRecordOut(BaseModel):
    id: int
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    product_name: Optional[str] = None
    product_category: Optional[str] = None
    sales_amount: float
    profit: float
    quantity: int
    order_date: datetime
    country: Optional[str] = None
    state: Optional[str] = None
    region: Optional[str] = None

    class Config:
        from_attributes = True

# --- ANALYTICS SCHEMAS ---
class AnalyticsResultOut(BaseModel):
    id: int
    project_id: int
    dataset_id: int
    type: str
    results: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class CustomerSegmentOut(BaseModel):
    id: int
    customer_id: str
    customer_name: Optional[str] = None
    rfm_recency: Optional[int] = None
    rfm_frequency: Optional[int] = None
    rfm_monetary: Optional[float] = None
    segment_name: str
    cluster_id: Optional[int] = None

    class Config:
        from_attributes = True

# --- PREDICTION SCHEMAS ---
class PredictionOut(BaseModel):
    id: int
    type: str
    target_id: str
    value: float
    details: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# --- REPORT SCHEMAS ---
class ReportOut(BaseModel):
    id: int
    project_id: int
    name: str
    type: str
    file_path: str
    is_shared: bool
    share_expires_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReportShareLink(BaseModel):
    share_token: str
    url: str
    expires_at: Optional[datetime] = None

class ReportShareCreate(BaseModel):
    expires_in_days: Optional[int] = None

# --- RECOMMENDATION SCHEMAS ---
class RecommendationOut(BaseModel):
    id: int
    category: str
    content: str
    impact_score: Optional[str] = None
    confidence_score: Optional[float] = None

    class Config:
        from_attributes = True

# --- AI CONVERSATION SCHEMAS ---
class AIQuery(BaseModel):
    message: str

class AIChatResponse(BaseModel):
    response: str

class AIConversationOut(BaseModel):
    id: int
    project_id: int
    title: str
    messages: List[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True

# --- NOTIFICATION & AUDIT LOG SCHEMAS ---
class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLogOut(BaseModel):
    id: int
    action: str
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
