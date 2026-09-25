from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, ConfigDict

class ResourceCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    category: str = Field(..., min_length=2, max_length=100)
    status: Optional[str] = "active"
    location: Optional[str] = "Formosa Capital"
    extra_data: Optional[Dict[str, Any]] = None

class ResourceUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    extra_data: Optional[Dict[str, Any]] = None

class ResourceResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    category: str
    status: str
    location: str
    extra_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedResourceResponse(BaseModel):
    data: List[ResourceResponse]
    total: int
    page: int
    limit: int
    total_pages: int
