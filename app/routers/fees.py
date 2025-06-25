from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from ..database import get_db
from .. import models, schemas


class PaginatedFeeResponse(BaseModel):
    items: List[schemas.Fee]
    total: int

    class Config:
        orm_mode = True


db_fee_router = APIRouter(prefix="/fees", tags=["Fees"])


@db_fee_router.post("/", response_model=schemas.Fee)
def create_fee(fee: schemas.FeeCreate, db: Session = Depends(get_db)):
    new_fee = models.Fee(**fee.dict(by_alias=True))
    db.add(new_fee)
    db.commit()
    db.refresh(new_fee)
    return new_fee


@db_fee_router.get("/", response_model=PaginatedFeeResponse)
def get_fees(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
):
    total = db.query(models.Fee).count()
    items = db.query(models.Fee).offset(skip).limit(limit).all()
    return {"items": items, "total": total}


@db_fee_router.get("/{fee_id}", response_model=schemas.Fee)
def get_fee(fee_id: int, db: Session = Depends(get_db)):
    fee = db.query(models.Fee).filter(models.Fee.id == fee_id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee not found")
    return fee


@db_fee_router.put("/{fee_id}", response_model=schemas.Fee)
def update_fee(fee_id: int, fee_update: schemas.FeeCreate, db: Session = Depends(get_db)):
    fee = db.query(models.Fee).filter(models.Fee.id == fee_id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee not found")
    
    for key, value in fee_update.dict(by_alias=True).items():
        setattr(fee, key, value)
    
    db.commit()
    db.refresh(fee)
    return fee


@db_fee_router.delete("/{fee_id}")
def delete_fee(fee_id: int, db: Session = Depends(get_db)):
    fee = db.query(models.Fee).filter(models.Fee.id == fee_id).first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee not found")
    
    db.delete(fee)
    db.commit()
    return {"message": "Fee deleted successfully"}
