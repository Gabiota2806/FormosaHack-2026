import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

@pytest.fixture(autouse=True)
def setup_db():
    from app.database import Base, get_db
    from app.main import app
    from app.models.user import User

    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=test_engine)

    testing_session_factory = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    def override_get_db():
        db = testing_session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    import app.database as app_db
    original_session_local = app_db.SessionLocal
    app_db.SessionLocal = testing_session_factory

    try:
        yield
    finally:
        app_db.SessionLocal = original_session_local
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=test_engine)
