from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    farm_label = Column(String(150), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    soil_tests = relationship("SoilTest", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class SoilTest(Base):
    __tablename__ = "soil_tests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    plot_label = Column(String(150), nullable=True, default="Plot 1")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    photo_path = Column(String(300), nullable=False)
    lead_concentration = Column(Float, nullable=False) # e.g. ppm (mg/kg)
    risk_level = Column(String(20), nullable=False)    # 'low', 'moderate', 'high'
    remediation_active = Column(Boolean, default=False, nullable=False)
    remediation_start_date = Column(DateTime, nullable=True)
    tested_at = Column(DateTime, default=utc_now, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="soil_tests")
    notifications = relationship("Notification", back_populates="soil_test")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    test_id = Column(Integer, ForeignKey("soil_tests.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(150), nullable=False, default="Alert")
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False, default="risk_alert") # 'risk_alert', 'remediation_milestone'
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    # Relationships
    user = relationship("User", back_populates="notifications")
    soil_test = relationship("SoilTest", back_populates="notifications")
