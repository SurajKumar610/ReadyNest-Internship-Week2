from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import AIConversation, Project, AuditLog
from ..schemas import AIQuery, AIChatResponse, AIConversationOut
from .auth_utils import get_current_user
from ..services.ai import get_ai_response

router = APIRouter(prefix="/projects/{project_id}/ai", tags=["ai analyst"])

@router.get("/conversations", response_model=List[AIConversationOut])
def list_conversations(project_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(AIConversation).filter(
        AIConversation.project_id == project_id,
        AIConversation.user_id == current_user.id
    ).all()

@router.post("/conversations", response_model=AIConversationOut)
def create_conversation(project_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    convo = AIConversation(
        project_id=project_id,
        user_id=current_user.id,
        title="New Chat",
        messages=[]
    )
    db.add(convo)
    db.commit()
    db.refresh(convo)
    return convo

@router.post("/conversations/{conversation_id}/chat", response_model=AIChatResponse)
def send_chat_message(
    project_id: int,
    conversation_id: int,
    query: AIQuery,
    dataset_id: Optional[int] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    convo = db.query(AIConversation).filter(
        AIConversation.id == conversation_id,
        AIConversation.project_id == project_id,
        AIConversation.user_id == current_user.id
    ).first()
    
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    history = convo.messages or []
    
    # Get response
    ai_response_text = get_ai_response(project_id, query.message, db, history, dataset_id=dataset_id)
    
    # Save messages
    updated_messages = list(history)
    updated_messages.append({"role": "user", "content": query.message})
    updated_messages.append({"role": "assistant", "content": ai_response_text})
    convo.messages = updated_messages
    
    # Auto rename conversation title on first message
    if len(history) == 0:
        convo.title = query.message[:25] + ("..." if len(query.message) > 25 else "")
        
    db.add(AuditLog(user_id=current_user.id, action="ai_chat", details={"conversation_id": convo.id}))
    db.commit()
    
    return {"response": ai_response_text}
