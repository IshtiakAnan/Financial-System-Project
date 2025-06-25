from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas


db_grant_router = APIRouter(prefix="/grants", tags=["Grants"])


@db_grant_router.post("/", response_model=schemas.Grant)
def create_grant(grant: schemas.GrantCreate, db: Session = Depends(get_db)):
    new_grant = models.Grant(**grant.dict())
    db.add(new_grant)
    db.commit()
    db.refresh(new_grant)
    return new_grant

@db_grant_router.get("/", response_model=List[schemas.Grant])
def get_grants(db: Session = Depends(get_db)):
    return db.query(models.Grant).all()
