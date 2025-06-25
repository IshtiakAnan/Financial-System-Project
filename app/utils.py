from passlib.context import CryptContext
from fastapi import FastAPI, Response, status, HTTPException, Depends
from sqlalchemy.orm import Session
from . import models
from .database import get_db


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
def my_posts(db: Session = Depends(get_db)):
    my_posts = db.query(models.Post).all()
    return my_posts


def hash(password: str):
    return pwd_context.hash(password)


def verify(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

