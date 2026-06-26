from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import datetime

from ..database import get_db
from ..models import User, Workspace, AuditLog
from ..schemas import UserCreate, UserOut, Token, PasswordResetRequest, PasswordResetConfirm
from .auth_utils import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    get_current_user
)
from ..config import settings

router = APIRouter(prefix="/auth", tags=["authentication"])

# A helper for email simulated sending or Resend integration
def send_email_notification(email: str, subject: str, body: str):
    print(f"--- [EMAIL SIMULATION] To: {email} | Subject: {subject} ---")
    print(body)
    print("-------------------------------------------------------------")
    if settings.RESEND_API_KEY:
        try:
            import resend
            resend.api_key = settings.RESEND_API_KEY
            resend.Emails.send({
                "from": settings.SMTP_FROM,
                "to": email,
                "subject": subject,
                "html": f"<p>{body}</p>"
            })
        except Exception as e:
            print(f"Resend send failed: {e}")

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists"
        )
        
    hashed_password = get_password_hash(user_in.password)
    user = User(
        email=user_in.email,
        hashed_password=hashed_password,
        role="user",
        is_verified=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Auto-create a default workspace for the new user
    workspace = Workspace(
        name="Default Workspace",
        owner_id=user.id
    )
    db.add(workspace)
    
    # Audit log
    db.add(AuditLog(
        user_id=user.id,
        action="register",
        details={"email": user.email}
    ))
    db.commit()
    
    # Send email verification
    verification_link = f"http://localhost:3000/auth/verify?email={user.email}&token=mock-token"
    body = f"Welcome to Sightfill! Please click the link to verify your email: {verification_link}"
    background_tasks.add_task(send_email_notification, user.email, "Verify Your Email - Sightfill", body)
    
    return user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
        
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}
    )
    refresh_token = create_refresh_token(
        data={"sub": user.email, "role": user.role}
    )
    
    # Audit log
    db.add(AuditLog(
        user_id=user.id,
        action="login",
        details={"ip": "127.0.0.1"}
    ))
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token_in: str, db: Session = Depends(get_db)):
    # Standard decoding
    try:
        from jose import jwt, JWTError
        payload = jwt.decode(refresh_token_in, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=400, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid refresh token")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    access_token = create_access_token(data={"sub": user.email, "role": user.role})
    new_refresh_token = create_refresh_token(data={"sub": user.email, "role": user.role})
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.post("/verify")
def verify_email(email: str, token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_verified = True
    db.add(AuditLog(user_id=user.id, action="verify_email", details={}))
    db.commit()
    return {"message": "Email verified successfully"}

@router.post("/forgot-password")
def forgot_password(req: PasswordResetRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if user:
        reset_link = f"http://localhost:3000/auth/reset-password?email={user.email}&token=mock-reset-token"
        body = f"Click the link to reset your password: {reset_link}"
        background_tasks.add_task(send_email_notification, user.email, "Reset Password - Sightfill", body)
    return {"message": "If the email is registered, a password reset link has been sent"}

@router.post("/reset-password")
def reset_password(req: PasswordResetConfirm, db: Session = Depends(get_db)):
    # simple mock verification
    if req.token != "mock-reset-token":
        raise HTTPException(status_code=400, detail="Invalid reset token")
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = get_password_hash(req.new_password)
    db.add(AuditLog(user_id=user.id, action="reset_password", details={}))
    db.commit()
    return {"message": "Password reset successfully"}

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
