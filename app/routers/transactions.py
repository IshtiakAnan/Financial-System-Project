from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas


db_transaction_router = APIRouter(prefix="/transactions", tags=["Transactions"])


@db_transaction_router.post("/", response_model=schemas.Transaction)
def create_transaction(trx: schemas.TransactionCreate, db: Session = Depends(get_db)):
    new_trx = models.Transaction(**trx.dict())
    db.add(new_trx)
    db.commit()
    db.refresh(new_trx)
    return new_trx

@db_transaction_router.get("/", response_model=List[schemas.Transaction])
def get_transactions(db: Session = Depends(get_db)):
    return db.query(models.Transaction).all()