from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_openapi_json_structure():
    """Valida la especificación OpenAPI generada por FastAPI."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()

    assert "openapi" in schema
    assert "info" in schema
    assert "paths" in schema
    assert "components" in schema

    # Validar metadatos informativos
    info = schema["info"]
    assert "CiberGuardián" in info["title"]
    assert info["version"] == "1.0.0"
    assert "FormosaHack" in info["description"]

def test_openapi_tags_metadata():
    """Verifica que los tags de clasificación estén documentados con descripciones detalladas."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()

    assert "tags" in schema
    tags = {t["name"]: t["description"] for t in schema["tags"]}

    expected_tags = [
        "Chatbot CiberGuardián",
        "Radar de Amenazas",
        "Recursos Comunitarios",
        "Health"
    ]
    for tag in expected_tags:
        assert tag in tags
        assert len(tags[tag]) > 10

def test_openapi_paths_contain_critical_endpoints():
    """Verifica que todos los endpoints del core service estén expuestos en la documentación OpenAPI."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]

    # Endpoint de análisis de mensajes
    assert "/chat/message" in paths
    assert "post" in paths["/chat/message"]
    chat_post = paths["/chat/message"]["post"]
    assert "Chatbot CiberGuardián" in chat_post["tags"]
    assert "summary" in chat_post
    assert "description" in chat_post

    # Endpoint de reporte de incidentes y feed
    assert "/incidents" in paths
    assert "get" in paths["/incidents"]
    assert "post" in paths["/incidents"]
    assert "Radar de Amenazas" in paths["/incidents"]["get"]["tags"]

    # Endpoint de votación comunitaria ('A mí también me llegó')
    assert "/incidents/{incident_id}/me-too" in paths
    assert "post" in paths["/incidents/{incident_id}/me-too"]
    vote_post = paths["/incidents/{incident_id}/me-too"]["post"]
    assert "Radar de Amenazas" in vote_post["tags"]

    # Endpoint de canales verificados de Formosa
    assert "/incidents/channels/verified" in paths
    assert "get" in paths["/incidents/channels/verified"]

    # Endpoint de borrado lógico
    assert "/incidents/{incident_id}" in paths
    assert "delete" in paths["/incidents/{incident_id}"]

    # Endpoint de salud
    assert "/health" in paths
    assert "get" in paths["/health"]

def test_no_duplicate_paths_in_openapi():
    """Garantiza que no existan rutas duplicadas (como /api/core/...) en la especificación OpenAPI pública."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    paths = list(response.json()["paths"].keys())

    # Las rutas expuestas en el esquema no deben contener el prefijo redundante
    duplicate_paths = [p for p in paths if p.startswith("/api/core/")]
    assert len(duplicate_paths) == 0, f"Rutas duplicadas detectadas en OpenAPI: {duplicate_paths}"

def test_swagger_ui_html_endpoint():
    """Verifica que la interfaz Swagger UI sea accesible y contenga los componentes visuales."""
    response = client.get("/docs")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "swagger-ui" in response.text
    assert "SwaggerUIBundle" in response.text

def test_redoc_html_endpoint():
    """Verifica que la documentación alternativa ReDoc esté disponible."""
    response = client.get("/redoc")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "redoc" in response.text.lower()
