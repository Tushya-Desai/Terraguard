import os
import pymysql
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

Base = declarative_base()

def init_db():
    """Initializes the MySQL database and tables if they do not exist."""
    # 1. Connect to MySQL server to create the database if not present
    try:
        connection = pymysql.connect(
            host=settings.DB_HOST,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            port=settings.DB_PORT,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        with connection.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{settings.DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        connection.commit()
        connection.close()
        print(f"[DB] Verified/Created database `{settings.DB_NAME}`.")
    except Exception as e:
        print(f"[DB Warning] Could not verify/create database via pymysql: {e}")

    # 2. Create tables using SQLAlchemy
    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_recycle=3600
    )
    Base.metadata.create_all(bind=engine)
    print("[DB] Initialized database tables.")
    return engine

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=3600
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
