from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
import uuid
import datetime

from ..database import get_db
from ..models import Report, Project, Dataset, AuditLog, AnalyticsResult
from ..schemas import ReportOut, ReportShareLink, ReportShareCreate
from .auth_utils import get_current_user
from ..services.reports import generate_pdf_report, generate_pptx_report, generate_xlsx_report

router = APIRouter(tags=["reports & sharing"])

REPORT_OUTPUT_DIR = "sample-datasets/outputs"
os.makedirs(REPORT_OUTPUT_DIR, exist_ok=True)

@router.post("/projects/{project_id}/reports/generate", response_model=ReportOut)
def trigger_report_generation(
    project_id: int,
    dataset_id: int,
    report_type: str, # pdf, pptx, xlsx
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
        
    report_type = report_type.lower()
    if report_type not in ["pdf", "pptx", "xlsx"]:
        raise HTTPException(status_code=400, detail="Invalid report type. Supported types: pdf, pptx, xlsx")
        
    filename = f"report_{project_id}_{uuid.uuid4().hex[:8]}.{report_type}"
    file_path = os.path.join(REPORT_OUTPUT_DIR, filename)
    
    try:
        if report_type == "pdf":
            generate_pdf_report(project_id, dataset_id, file_path, db)
        elif report_type == "pptx":
            generate_pptx_report(project_id, dataset_id, file_path, db)
        elif report_type == "xlsx":
            generate_xlsx_report(project_id, dataset_id, file_path, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {e}")
        
    # Save Report record
    db_report = Report(
        project_id=project_id,
        dataset_id=dataset_id,
        name=filename,
        type=report_type,
        file_path=file_path,
        is_shared=False
    )
    db.add(db_report)
    db.add(AuditLog(user_id=current_user.id, action="generate_report", details={"report_name": filename}))
    db.commit()
    db.refresh(db_report)
    
    return db_report

@router.get("/projects/{project_id}/reports", response_model=list[ReportOut])
def list_reports(project_id: int, db: Session = Depends(get_db)):
    return db.query(Report).filter(Report.project_id == project_id).all()

@router.get("/projects/{project_id}/reports/{report_id}/download")
def download_report(project_id: int, report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id, Report.project_id == project_id).first()
    if not report or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report file not found")
    return FileResponse(report.file_path, filename=report.name)

@router.post("/projects/{project_id}/reports/{report_id}/share", response_model=ReportShareLink)
def create_report_share_link(
    project_id: int,
    report_id: int,
    share_in: ReportShareCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id, Report.project_id == project_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    share_token = uuid.uuid4().hex
    expires_at = None
    if share_in.expires_in_days:
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(days=share_in.expires_in_days)
        
    report.is_shared = True
    report.share_token = share_token
    report.share_expires_at = expires_at
    
    db.add(AuditLog(user_id=current_user.id, action="share_report", details={"report_id": report.id}))
    db.commit()
    
    # Public sharing URL
    share_url = f"http://localhost:3000/shared/{share_token}"
    return {
        "share_token": share_token,
        "url": share_url,
        "expires_at": expires_at
    }

# Public read-only analytics summaries using share token
@router.get("/public/shared/{share_token}")
def get_shared_report_data(share_token: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.share_token == share_token).first()
    if not report:
        raise HTTPException(status_code=404, detail="Shared link not found")
        
    if report.share_expires_at and report.share_expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=410, detail="Shared link has expired")
        
    # Load summary layer for public rendering
    summary_result = db.query(AnalyticsResult).filter(
        AnalyticsResult.dataset_id == report.dataset_id,
        AnalyticsResult.type == "summary_layer"
    ).order_by(AnalyticsResult.created_at.desc()).first()
    
    # Also load standard cached charts
    charts = {}
    kpis = db.query(AnalyticsResult).filter(AnalyticsResult.dataset_id == report.dataset_id, AnalyticsResult.type == "kpis").first()
    regional = db.query(AnalyticsResult).filter(AnalyticsResult.dataset_id == report.dataset_id, AnalyticsResult.type == "regional").first()
    product = db.query(AnalyticsResult).filter(AnalyticsResult.dataset_id == report.dataset_id, AnalyticsResult.type == "product").first()
    
    return {
        "report_name": report.name,
        "created_at": report.created_at,
        "summary": summary_result.results if summary_result else {},
        "charts": {
            "kpis": kpis.results if kpis else {},
            "regional": regional.results if regional else {},
            "product": product.results if product else {}
        }
    }
