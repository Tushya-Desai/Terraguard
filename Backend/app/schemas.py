from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

# --- User Schemas ---
class UserSignup(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    farm_label: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    farm_label: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- Soil Test Schemas ---
class SoilTestBase(BaseModel):
    plot_label: Optional[str] = "Main Field"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    lead_concentration: float = Field(..., ge=0, description="Lead concentration in ppm")
    risk_level: Optional[str] = None # 'low', 'moderate', 'high' (auto-computed if omitted)
    remediation_active: Optional[bool] = False

class SoilTestCreate(SoilTestBase):
    pass

class SoilTestResponse(BaseModel):
    id: int
    user_id: int
    plot_label: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    photo_path: str
    photo_url: str
    lead_concentration: float
    risk_level: str
    remediation_active: bool
    remediation_start_date: Optional[datetime]
    days_elapsed: int = 0
    tested_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class RemediationToggleRequest(BaseModel):
    remediation_active: bool

class HeatmapPoint(BaseModel):
    id: int
    plot_label: Optional[str]
    lat: float
    lng: float
    intensity: float # 0.0 to 1.0 based on risk or concentration
    risk_level: str
    lead_concentration: float
    photo_url: Optional[str] = None

# --- Notification Schemas ---
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    test_id: Optional[int] = None
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationReadUpdate(BaseModel):
    is_read: bool = True

# --- Plot History Schemas ---
class PlotHistoryItem(BaseModel):
    id: int
    plot_label: str
    test_date: str
    tested_at: datetime
    ppm_value: float
    lead_concentration: float
    risk_level: str
    remediation_active: bool
    days_elapsed: int = 0

    class Config:
        from_attributes = True
