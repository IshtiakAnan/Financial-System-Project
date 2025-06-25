from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas


db_attendance_router = APIRouter(prefix="/attendance", tags=["Attendance"])


@db_attendance_router.post("/", response_model=schemas.Attendance)
def create_attendance(att: schemas.AttendanceCreate, db: Session = Depends(get_db)):
    new_att = models.Attendance(**att.dict())
    db.add(new_att)
    db.commit()
    db.refresh(new_att)
    return new_att

@db_attendance_router.get("/", response_model=List[schemas.Attendance])
def get_attendance(db: Session = Depends(get_db)):
    return db.query(models.Attendance).all()
