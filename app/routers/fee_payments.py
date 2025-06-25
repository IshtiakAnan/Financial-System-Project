from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime
from loguru import logger

from app.database import get_db
from app import models, schemas, oauth2

db_payment_router = APIRouter(prefix="/payments", tags=["Fee Payments"])

def check_accountant_role(user: models.User = Depends(oauth2.get_current_user)):
    if user.role.name != "accountant" and user.role.name != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only accountants and admins can manage payments"
        )
    return user

@db_payment_router.post("/", response_model=schemas.FeePayment)
def create_payment(
    payment: schemas.FeePaymentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_accountant_role)
):
    try:
        new_payment = models.FeePayment(**payment.dict())
        db.add(new_payment)
        
        # Create audit log
        audit_log = models.AuditLog(
            action="create",
            table_name="fee_payments",
            record_id=new_payment.id,
            user_id=current_user.id,
            changes=payment.dict()
        )
        db.add(audit_log)
        
        db.commit()
        db.refresh(new_payment)
        logger.info(f"Payment created: {new_payment.id} by user {current_user.id}")
        return new_payment
    except Exception as e:
        logger.error(f"Error creating payment: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@db_payment_router.get("/", response_model=List[schemas.FeePayment])
def get_payments(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    student_id: Optional[int] = None,
    payment_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    try:
        query = db.query(models.FeePayment).filter(models.FeePayment.is_deleted == False)
        
        # Apply filters
        if student_id:
            query = query.filter(models.FeePayment.student_id == student_id)
        if payment_date:
            query = query.filter(models.FeePayment.payment_date == payment_date)
            
        # Apply pagination
        total = query.count()
        payments = query.order_by(desc(models.FeePayment.payment_date)).offset(skip).limit(limit).all()
        
        logger.info(f"Retrieved {len(payments)} payments")
        return payments
    except Exception as e:
        logger.error(f"Error retrieving payments: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))