from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas

db_student_router = APIRouter(prefix="/students", tags=["Students"])


@db_student_router.post("/", response_model=schemas.Student)
def create_student(student: schemas.StudentCreate, db: Session = Depends(get_db)):
    new_student = models.Student(**student.dict(by_alias=True))
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return new_student

@db_student_router.get("/", response_model=List[schemas.Student])
def get_students(db: Session = Depends(get_db)):
    return db.query(models.Student).all()
