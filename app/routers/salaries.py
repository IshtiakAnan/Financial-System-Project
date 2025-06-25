from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas


db_salary_router = APIRouter(prefix="/salaries", tags=["Salaries"])


@db_salary_router.post("/", response_model=schemas.Salary)
def create_salary(salary: schemas.SalaryCreate, db: Session = Depends(get_db)):
    new_salary = models.Salary(**salary.dict())
    db.add(new_salary)
    db.commit()
    db.refresh(new_salary)
    return new_salary

@db_salary_router.get("/", response_model=List[schemas.Salary])
def get_salaries(db: Session = Depends(get_db)):
    return db.query(models.Salary).all()
