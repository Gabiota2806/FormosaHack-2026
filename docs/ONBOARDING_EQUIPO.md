# Guía de Puesta en Marcha Rápida (Onboarding del Equipo)

> **¡IMPORTANTE PARA LOS 4 INTEGRANTES!**  
> Realizar estos pasos **antes de que empiece la competencia** para asegurar que Docker, Node y las herramientas funcionen en cada laptop sin perder tiempo en la hora 0.

---

## 1. Requisitos Previos en la Computadora
Cada integrante debe tener instalado:
1. **Git:** (`git --version`)
2. **Docker & Docker Compose:** (`docker --version` y `docker compose version`).  
   - En Windows: Docker Desktop con motor WSL2 activo.
   - En Linux: Docker engine y plugin `docker-compose-v2`.
   - En macOS: Docker Desktop.
3. **Node.js (v20 o superior):** (`node -v`) — Opcional si solo corren Docker, pero muy recomendado para el integrante de Frontend.
4. **Python (v3.11 o v3.12):** (`python3 --version`) — Recomendado para el integrante de Backend.

---

## 2. Paso a Paso tras Clonar el Repositorio

### Paso 1: Clonar el proyecto
```bash
git clone https://github.com/Gabiota2806/FormosaHack-2026.git
cd FormosaHack-2026
```

### Paso 2: Crear el archivo de entorno
```bash
cp .env.example .env
```

### Paso 3: Levantar todo el sistema con Docker
```bash
docker compose up -d
```
*(La primera vez descargará las imágenes de PostgreSQL, Python y Nginx. Aguardar a que termine).*

### Paso 4: Comprobar que todo funcione en el navegador
Abrir los siguientes enlaces:
* **Frontend Web:** [http://localhost:8000](http://localhost:8000) (Debe verse el panel de FormosaHack con métricas y pestañas).
* **Swagger Auth Service:** [http://localhost:8000/api/auth/docs](http://localhost:8000/api/auth/docs) (Debe abrir la documentación interactiva).
* **Swagger Core Service:** [http://localhost:8000/api/core/docs](http://localhost:8000/api/core/docs) (Debe abrir la documentación de la API).

---

## 3. Comandos Diarios Útiles
* **Ver logs de los servicios en vivo:** `docker compose logs -f`
* **Reiniciar un servicio específico:** `docker compose restart core_service`
* **Apagar el sistema:** `docker compose down`
* **Cambiar a la rama de trabajo:**
  ```bash
  git checkout develop   # Para desarrollo
  git checkout design    # Para diseño de tablas y pantallas
  ```
