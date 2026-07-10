from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional
from app.core.security import security_service, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    username: str = Field(default="admin")
    password: str = Field(default="admin123")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


class UserInfo(BaseModel):
    username: str
    role: str = "operator"


# Default credentials (MVP only — replace with DB in production)
DEFAULT_USER = "admin"
DEFAULT_PASS_HASH: Optional[str] = None

def _get_admin_hash() -> str:
    global DEFAULT_PASS_HASH
    if DEFAULT_PASS_HASH is None:
        DEFAULT_PASS_HASH = security_service.hash_password("admin123")
    return DEFAULT_PASS_HASH


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Authenticate and get JWT token"""
    if request.username != DEFAULT_USER:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not security_service.verify_password(request.password, _get_admin_hash()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = security_service.create_access_token({
        "sub": request.username,
        "role": "operator",
    })
    return TokenResponse(access_token=token, username=request.username)


@router.get("/me", response_model=UserInfo)
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user info"""
    return UserInfo(username=user.get("sub", "unknown"), role=user.get("role", "operator"))


@router.post("/verify")
async def verify_token(user: dict = Depends(get_current_user)):
    """Verify JWT token is valid"""
    return {"valid": True, "username": user.get("sub"), "role": user.get("role")}
