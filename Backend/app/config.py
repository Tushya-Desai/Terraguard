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
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    UPLOAD_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")

    @property
    def database_url(self) -> str:
        # Standard PyMySQL URL with URL-encoded credentials
        return str(
            URL.create(
                drivername="mysql+pymysql",
                username=self.DB_USER,
                password=self.DB_PASSWORD,
                host=self.DB_HOST,
                port=self.DB_PORT,
                database=self.DB_NAME,
            )
        )

    @property
    def server_connection_url(self) -> str:
        # URL without database name
        return str(
            URL.create(
                drivername="mysql+pymysql",
                username=self.DB_USER,
                password=self.DB_PASSWORD,
                host=self.DB_HOST,
                port=self.DB_PORT,
            )
        )

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=(
            os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
            os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
            ".env"
        ),
        extra="ignore"
    )

settings = Settings()

