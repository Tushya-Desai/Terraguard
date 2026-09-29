import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL

class Settings(BaseSettings):
    DB_HOST: str = "mysql-1f7b7c05-terraguard.h.aivencloud.com"
    DB_PORT: int = 22972
    DB_USER: str = "avnadmin"
    DB_PASSWORD: str = ""
    DB_NAME: str = "defaultdb"

    JWT_SECRET_KEY: str = "dev_secret_jwt_key_terraguard_local_development_only"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    BACKEND_HOST: str = "127.0.0.1"
    BACKEND_PORT: int = 8000
    ALLOWED_ORIGINS: str = "https://terraguard-eosin.vercel.app,http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")

    @property
    def database_url(self) -> str:
        # Standard PyMySQL URL with URL-encoded credentials
        return URL.create(
            drivername="mysql+pymysql",
            username=self.DB_USER,
            password=self.DB_PASSWORD,
            host=self.DB_HOST,
            port=self.DB_PORT,
            database=self.DB_NAME,
        ).render_as_string(hide_password=False)

    @property
    def server_connection_url(self) -> str:
        # URL without database name
        return URL.create(
            drivername="mysql+pymysql",
            username=self.DB_USER,
            password=self.DB_PASSWORD,
            host=self.DB_HOST,
            port=self.DB_PORT,
        ).render_as_string(hide_password=False)

    @property
    def cors_origins(self) -> List[str]:
        raw = self.ALLOWED_ORIGINS.strip()
        if raw.startswith("[") and raw.endswith("]"):
            import json
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return [str(o).strip().strip("'\"").rstrip("/") for o in parsed if o]
            except Exception:
                pass
        return [
            origin.strip().strip("'\"").rstrip("/")
            for origin in raw.split(",")
            if origin.strip().strip("'\"").rstrip("/")
        ]

    model_config = SettingsConfigDict(
        env_file=(
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
            ".env"
        ),
        extra="ignore"
    )

settings = Settings()

