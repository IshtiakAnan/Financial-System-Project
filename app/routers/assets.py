from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas


db_asset_router = APIRouter(prefix="/assets", tags=["Assets"])


@db_asset_router.post("/", response_model=schemas.Asset)
def create_asset(asset: schemas.AssetCreate, db: Session = Depends(get_db)):
    new_asset = models.Asset(**asset.dict())
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)
    return new_asset

@db_asset_router.get("/", response_model=List[schemas.Asset])
def get_assets(db: Session = Depends(get_db)):
    return db.query(models.Asset).all()
