#!/usr/bin/env python3
"""
Wrapper CLI del seeder de CiberGuardián.
La lógica real vive en backend/core_service/app/seeder.py (testeable con pytest).

Uso local (apuntando al Postgres de Docker):
    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/formosahack python scripts/seed.py
Uso recomendado (dentro del contenedor):
    docker compose exec core_service python -m app.seeder
"""

import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend/core_service")))

from app.seeder import main

if __name__ == "__main__":
    main()
