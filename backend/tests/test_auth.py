import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.api.auth_utils import get_password_hash

# Setup test SQLite DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_register_user(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "testuser@sightfill.com", "password": "testpassword"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "testuser@sightfill.com"
    assert "id" in data
    assert data["role"] == "user"

def test_login_user(client):
    # Register first (done in previous test, but we can do another)
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "testuser@sightfill.com", "password": "testpassword"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

def test_login_incorrect_password(client):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "testuser@sightfill.com", "password": "wrongpassword"}
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Incorrect email or password"
