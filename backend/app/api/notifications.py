from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Notification, AuditLog, User
from ..schemas import NotificationOut, AuditLogOut
from .auth_utils import get_current_user, RoleChecker

router = APIRouter(tags=["notifications & administration"])

@router.get("/notifications", response_model=List[NotificationOut])
def list_notifications(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()

@router.put("/notifications/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

# Admin-only: Audit Logs view
@router.get("/admin/audit-logs", response_model=List[AuditLogOut])
def view_audit_logs(
    current_user = Depends(RoleChecker(allowed_roles=["admin"])),
    db: Session = Depends(get_db)
):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).all()

# Admin-only: Users management
@router.get("/admin/users")
def list_users(
    current_user = Depends(RoleChecker(allowed_roles=["admin"])),
    db: Session = Depends(get_db)
):
    users = db.query(User).all()
    # Return count and basic emails
    return [
        {
            "id": u.id,
            "email": u.email,
            "role": u.role,
            "is_verified": u.is_verified,
            "created_at": u.created_at
        } for u in users
    ]
