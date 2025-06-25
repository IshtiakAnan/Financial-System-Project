from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas


db_purchase_router = APIRouter(prefix="/purchases", tags=["Purchases"])


@db_purchase_router.post("/", response_model=schemas.Purchase)
def create_purchase(purchase: schemas.PurchaseCreate, db: Session = Depends(get_db)):
    new_purchase = models.Purchase(**purchase.dict())
    db.add(new_purchase)
    db.commit()
    db.refresh(new_purchase)
    return new_purchase

@db_purchase_router.get("/", response_model=List[schemas.Purchase])
def get_purchases(db: Session = Depends(get_db)):
    return db.query(models.Purchase).all()
