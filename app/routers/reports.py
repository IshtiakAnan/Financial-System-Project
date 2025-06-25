from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas


db_report_router = APIRouter(prefix="/reports", tags=["Reports"])


@db_report_router.post("/", response_model=schemas.Report)
def create_report(report: schemas.ReportCreate, db: Session = Depends(get_db)):
    new_report = models.Report(**report.dict())
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

@db_report_router.get("/", response_model=List[schemas.Report])
def get_reports(db: Session = Depends(get_db)):
    return db.query(models.Report).all()