from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas


db_ledger_router = APIRouter(prefix="/ledger", tags=["Ledger"])


@db_ledger_router.post("/", response_model=schemas.LedgerEntry)
def create_ledger_entry(entry: schemas.LedgerEntryCreate, db: Session = Depends(get_db)):
    new_entry = models.LedgerEntry(**entry.dict())
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

@db_ledger_router.get("/", response_model=List[schemas.LedgerEntry])
def get_ledger_entries(db: Session = Depends(get_db)):
    return db.query(models.LedgerEntry).all()
