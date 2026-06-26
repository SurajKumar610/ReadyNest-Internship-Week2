import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from sqlalchemy.orm import Session
import pandas as pd
import json

from ..database import get_db
from ..models import Dataset, Project, SalesRecord, AnalyticsResult, CustomerSegment, Prediction, Recommendation, AuditLog, Notification
from ..schemas import DatasetOut, DatasetMappingUpdate, SalesRecordOut, AnalyticsResultOut, CustomerSegmentOut, PredictionOut, RecommendationOut
from .auth_utils import get_current_user, RoleChecker
from ..services.pipeline import smart_detect_schema, run_full_analytics_pipeline, run_full_analytics_pipeline_task

router = APIRouter(prefix="/projects/{project_id}/datasets", tags=["datasets"])

UPLOAD_DIR = "sample-datasets"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=DatasetOut)
def upload_dataset(
    project_id: int,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Check file size & formats
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".csv", ".xlsx", ".xls", ".json"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported format. Only CSV, XLSX, XLS, and JSON are supported."
        )
        
    file_path = os.path.join(UPLOAD_DIR, f"{project_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Perform temporary load to detect schema
    try:
        if ext == ".csv":
            df = pd.read_csv(file_path, nrows=5)
        elif ext in [".xlsx", ".xls"]:
            df = pd.read_excel(file_path, nrows=5)
        elif ext == ".json":
            df = pd.read_json(file_path, nrows=5)
            
        detected_mappings = smart_detect_schema(df)
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Corrupted or invalid dataset structure: {e}")
        
    # Create Dataset metadata record
    db_dataset = Dataset(
        name=file.filename,
        project_id=project_id,
        file_path=file_path,
        row_count=0,
        status="uploaded",
        column_mappings=detected_mappings
    )
    db.add(db_dataset)
    
    # Audit log
    db.add(AuditLog(
        user_id=current_user.id,
        action="upload_dataset",
        details={"filename": file.filename, "project_id": project_id}
    ))
    db.commit()
    db.refresh(db_dataset)
    
    return db_dataset

@router.put("/{dataset_id}/mapping", response_model=DatasetOut)
def update_mapping(
    project_id: int,
    dataset_id: int,
    mapping_in: DatasetMappingUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.project_id == project_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    dataset.column_mappings = mapping_in.column_mappings
    db.add(AuditLog(user_id=current_user.id, action="update_mappings", details={"dataset_id": dataset.id}))
    db.commit()
    db.refresh(dataset)
    return dataset

@router.post("/{dataset_id}/process")
def start_pipeline_processing(
    project_id: int,
    dataset_id: int,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.project_id == project_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    dataset.status = "cleaning"
    db.commit()
    
    # Trigger pipeline via Celery task if running, else fallback to BackgroundTasks
    celery_active = False
    try:
        from ..services.pipeline import celery
        inspect = celery.control.inspect()
        ping_res = inspect.ping()
        if ping_res and len(ping_res) > 0:
            celery_active = True
    except Exception as e:
        print(f"Error checking Celery workers status: {e}")
        celery_active = False

    if celery_active:
        try:
            run_full_analytics_pipeline_task.delay(dataset.id)
            print("Triggered analysis pipeline via Celery task successfully")
        except Exception as celery_err:
            print(f"Celery task trigger failed, falling back to BackgroundTasks: {celery_err}")
            background_tasks.add_task(run_full_analytics_pipeline, dataset.id)
    else:
        print("No active Celery workers found. Processing locally with BackgroundTasks.")
        background_tasks.add_task(run_full_analytics_pipeline, dataset.id)
    
    # Add notification
    db.add(Notification(
        user_id=current_user.id,
        title="Processing Started",
        message=f"Dataset {dataset.name} analysis pipeline has been queued."
    ))
    db.commit()
    
    return {"message": "Pipeline processing triggered successfully"}

@router.get("/{dataset_id}/status")
def get_dataset_status(project_id: int, dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id, Dataset.project_id == project_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return {
        "id": dataset.id,
        "name": dataset.name,
        "status": dataset.status,
        "row_count": dataset.row_count,
        "error_message": dataset.error_message
    }
