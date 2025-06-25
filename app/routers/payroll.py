from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas


db_payroll_router = APIRouter(prefix="/payroll", tags=["Payroll"])


@db_payroll_router.post("/", response_model=schemas.Payroll)
def create_payroll(p: schemas.PayrollCreate, db: Session = Depends(get_db)):
    new_payroll = models.Payroll(**p.dict())
    db.add(new_payroll)
    db.commit()
    db.refresh(new_payroll)
    return new_payroll

@db_payroll_router.get("/", response_model=List[schemas.Payroll])
def get_payrolls(db: Session = Depends(get_db)):
    return db.query(models.Payroll).all()