import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models import incident as incident_models, resource as resource_models
from app.routers import resources, chat, incident

Base.metadata.create_all(bind=engine)

root_path = os.getenv("ROOT_PATH", "")

openapi_tags = [
    {
        "name": "Chatbot CiberGuardián",
        "description": "Motor heurístico de análisis de engaños, manipulación psicológica y cálculo del semáforo de riesgo (Verde, Amarillo, Rojo) con sugerencias de acción y plantilla empática para WhatsApp."
    },
    {
        "name": "Radar de Amenazas",
        "description": "Gestión comunitaria de reportes de estafas, deduplicación atómica de votos ('A mí también me llegó') y detección de brotes activos de fraude en la Provincia de Formosa."
    },
    {
        "name": "Recursos Comunitarios",
        "description": "Directorio de recursos de asistencia, instituciones provinciales y contención familiar."
    },
    {
        "name": "Health",
        "description": "Monitoreo del estado operativo y salud del microservicio core."
    }
]

app = FastAPI(
    title="CiberGuardián Core Service API — FormosaHack 2026",
    summary="Microservicio de Prevención, Contención y Radar Comunitario de Ciberestafas",
    description="""
### 🛡️ CiberGuardián — Sistema Inteligente de Prevención Comunitaria de Ciberestafas
Desarrollado para **FormosaHack 2026**. Proporciona protección perimetral e interactiva:

- **Analizador Heurístico**: Detección de urgencia, coerción, premios falsos y suplantación de entidades locales (Banco Formosa, REFSA, Tarjeta Chigüé, ANSES).
- **Semáforo de Riesgo**: Clasificación inmediata en 3 niveles (Riesgo Alto 🔴, Medio 🟡, Bajo 🟢).
- **Radar Comunitario y Brotes**: Feed paginado con borrado lógico (`deleted_at`), validación de votos anónimos y detección de picos en 24h.
- **Canales Oficiales**: Directorio verificado de dominios y teléfonos legítimos.
    """,
    version="1.0.0",
    openapi_tags=openapi_tags,
    root_path=root_path,
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

@app.get("/health", tags=["Health"], summary="Chequeo de salud del servicio")
def health_check():
    return {"status": "healthy", "service": "core_service"}

# Rutas directas para Nginx Gateway y Swagger UI
app.include_router(chat.router)
app.include_router(incident.router)
app.include_router(resources.router)

# Rutas espejo con prefijo /api/core para retrocompatibilidad sin duplicar documentación
app.include_router(chat.router, prefix="/api/core", include_in_schema=False)
app.include_router(incident.router, prefix="/api/core", include_in_schema=False)
