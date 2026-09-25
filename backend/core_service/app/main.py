import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models import incident as incident_models, resource as resource_models
from app.routers import resources, chat, incident

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CiberGuardián Core Service API — FormosaHack 2026",
    description="Microservicio de Prevención, Contención y Radar de Ciberestafas con Repository Pattern, Soft Delete y Paginación.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "service": "core_service"}

# Rutas directas para Nginx Gateway (proxy_pass reescribe /api/core/)
app.include_router(chat.router)
app.include_router(incident.router)

# Rutas con prefijo para llamadas directas y suites de pruebas
app.include_router(resources.router)
app.include_router(chat.router, prefix="/api/core")
app.include_router(incident.router, prefix="/api/core")
