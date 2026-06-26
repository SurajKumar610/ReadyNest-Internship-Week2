from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import Workspace, Project, Dataset, AnalyticsResult, CustomerSegment, Prediction, Recommendation, AuditLog
from ..schemas import (
    WorkspaceCreate, WorkspaceOut,
    ProjectCreate, ProjectOut,
    AnalyticsResultOut, CustomerSegmentOut,
    PredictionOut, RecommendationOut,
    DatasetOut
)
from .auth_utils import get_current_user

router = APIRouter(tags=["projects & workspaces"])

# --- WORKSPACE ENDPOINTS ---

@router.get("/workspaces", response_model=List[WorkspaceOut])
def list_workspaces(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    # Admins see all, users see their own
    if current_user.role == "admin":
        return db.query(Workspace).all()
    return db.query(Workspace).filter(Workspace.owner_id == current_user.id).all()

@router.post("/workspaces", response_model=WorkspaceOut, status_code=status.HTTP_201_CREATED)
def create_workspace(workspace_in: WorkspaceCreate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    ws = Workspace(
        name=workspace_in.name,
        owner_id=current_user.id
    )
    db.add(ws)
    db.add(AuditLog(user_id=current_user.id, action="create_workspace", details={"name": ws.name}))
    db.commit()
    db.refresh(ws)
    return ws

# --- PROJECT ENDPOINTS ---

@router.get("/workspaces/{workspace_id}/projects", response_model=List[ProjectOut])
def list_projects(workspace_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if ws.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to access this workspace")
        
    return db.query(Project).filter(Project.workspace_id == workspace_id).all()

@router.post("/workspaces/{workspace_id}/projects", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(workspace_id: int, project_in: ProjectCreate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    ws = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if ws.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to modify this workspace")
        
    project = Project(
        name=project_in.name,
        description=project_in.description,
        workspace_id=workspace_id
    )
    db.add(project)
    db.add(AuditLog(user_id=current_user.id, action="create_project", details={"name": project.name}))
    db.commit()
    db.refresh(project)
    return project

@router.get("/projects/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    # Verify workspace ownership
    ws = db.query(Workspace).filter(Workspace.id == project.workspace_id).first()
    if ws.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to access this project")
    return project

# --- ANALYTICS CACHE ENDPOINTS ---

@router.get("/projects/{project_id}/analytics/{analytics_type}")
def get_project_analytics(
    project_id: int,
    analytics_type: str, # kpis, customer, product, regional, summary_layer
    dataset_id: Optional[int] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    query = db.query(AnalyticsResult).filter(
        AnalyticsResult.project_id == project_id,
        AnalyticsResult.type == analytics_type
    )
    if dataset_id is not None:
        query = query.filter(AnalyticsResult.dataset_id == dataset_id)
        
    res = query.order_by(AnalyticsResult.created_at.desc()).first()
    
    if not res:
        raise HTTPException(
            status_code=404,
            detail=f"Analytics of type '{analytics_type}' not available for this project. Ensure you upload a dataset and process it."
        )
        
    return res.results

@router.get("/projects/{project_id}/segments", response_model=List[CustomerSegmentOut])
def get_customer_segments(
    project_id: int,
    dataset_id: Optional[int] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(CustomerSegment).filter(CustomerSegment.project_id == project_id)
    if dataset_id is not None:
        query = query.filter(CustomerSegment.dataset_id == dataset_id)
    return query.all()

@router.get("/projects/{project_id}/predictions", response_model=List[PredictionOut])
def get_predictions(
    project_id: int,
    prediction_type: str, # churn or sales_forecast
    dataset_id: Optional[int] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Prediction).filter(
        Prediction.project_id == project_id,
        Prediction.type == prediction_type
    )
    if dataset_id is not None:
        query = query.filter(Prediction.dataset_id == dataset_id)
    return query.all()

@router.get("/projects/{project_id}/recommendations", response_model=List[RecommendationOut])
def get_recommendations(
    project_id: int,
    dataset_id: Optional[int] = None,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Recommendation).filter(Recommendation.project_id == project_id)
    if dataset_id is not None:
        query = query.filter(Recommendation.dataset_id == dataset_id)
    return query.all()

@router.get("/projects/{project_id}/datasets", response_model=List[DatasetOut])
def list_project_datasets(
    project_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Verify workspace ownership
    ws = db.query(Workspace).filter(Workspace.id == project.workspace_id).first()
    if ws.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to access this project's datasets")
        
    return db.query(Dataset).filter(Dataset.project_id == project_id).all()
