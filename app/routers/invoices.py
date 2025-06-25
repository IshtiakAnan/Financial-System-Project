from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from reportlab.pdfgen import canvas 
from reportlab.lib.pagesizes import letter 
from io import BytesIO

from ..database import get_db
from .. import models, schemas

class PaginatedInvoiceResponse(schemas.BaseModel):
    items: List[schemas.Invoice]
    total: int


db_invoice_router = APIRouter(prefix="/invoices", tags=["Invoices"])


@db_invoice_router.post("/", response_model=schemas.Invoice)
def create_invoice(invoice: schemas.InvoiceCreate, db: Session = Depends(get_db)):
    # Generate invoice number
    current_year = datetime.now().year
    last_invoice = db.query(models.Invoice).filter(
        models.Invoice.invoice_number.like(f"INV-{current_year}-%")
    ).order_by(models.Invoice.invoice_number.desc()).first()
    
    if last_invoice:
        last_number = int(last_invoice.invoice_number.split('-')[-1])
        new_number = last_number + 1
    else:
        new_number = 1
    
    invoice_number = f"INV-{current_year}-{new_number:04d}"
    
    # Create new invoice
    new_invoice = models.Invoice(**invoice.dict(), invoice_number=invoice_number)
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    return new_invoice


@db_invoice_router.get("/", response_model=PaginatedInvoiceResponse)
def get_invoices(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1),
    student_id: Optional[int] = None,
    status: Optional[str] = None
):
    query = db.query(models.Invoice)
    
    if student_id:
        query = query.filter(models.Invoice.student_id == student_id)
    if status:
        query = query.filter(models.Invoice.status == status)
    
    total = query.count()
    items = query.order_by(models.Invoice.issue_date.desc()).offset(skip).limit(limit).all()
    
    return {"items": items, "total": total}


@db_invoice_router.get("/{invoice_id}", response_model=schemas.Invoice)
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@db_invoice_router.put("/{invoice_id}", response_model=schemas.Invoice)
def update_invoice(invoice_id: int, invoice_update: schemas.InvoiceUpdate, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    for field, value in invoice_update.dict(exclude_unset=True).items():
        setattr(invoice, field, value)
    
    db.commit()
    db.refresh(invoice)
    return invoice


@db_invoice_router.delete("/{invoice_id}")
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    db.delete(invoice)
    db.commit()
    return {"message": "Invoice deleted successfully"}


@db_invoice_router.get("/{invoice_id}/pdf")
def generate_invoice_pdf(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Create PDF buffer
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Header
    p.setFont("Helvetica-Bold", 24)
    p.drawString(50, height - 50, "INVOICE")
    p.setFont("Helvetica", 12)
    p.drawString(50, height - 80, f"Invoice Number: {invoice.invoice_number}")
    p.drawString(50, height - 100, f"Date: {invoice.issue_date}")
    p.drawString(50, height - 120, f"Due Date: {invoice.due_date}")
    
    # Student Info
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, height - 160, "Student Information")
    p.setFont("Helvetica", 12)
    p.drawString(50, height - 180, f"Name: {invoice.student.name}")
    p.drawString(50, height - 200, f"Roll Number: {invoice.student.roll_number}")
    p.drawString(50, height - 220, f"Class: {invoice.student.class_}")
    
    # Items Table
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, height - 260, "Fee Details")
    p.setFont("Helvetica", 12)
    
    # Table Header
    y = height - 290
    p.drawString(50, y, "Description")
    p.drawString(300, y, "Amount")
    p.line(50, y - 5, 550, y - 5)
    
    # Table Content
    y -= 30
    total = 0
    for item in invoice.items:
        p.drawString(50, y, item.description)
        amount = f"₹{item.amount:,.2f}"
        p.drawRightString(550, y, amount)
        total += item.amount
        y -= 20
    
    # Total
    p.line(50, y - 5, 550, y - 5)
    p.setFont("Helvetica-Bold", 12)
    p.drawString(300, y - 25, "Total:")
    p.drawRightString(550, y - 25, f"₹{total:,.2f}")
    
    # Status
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, y - 65, f"Status: {invoice.status.upper()}")
    
    # Footer
    p.setFont("Helvetica", 10)
    p.drawString(50, 50, "This is a computer-generated invoice and does not require a signature.")
    
    p.save()
    buffer.seek(0)
    
    return Response(
        content=buffer.getvalue(),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=invoice-{invoice.invoice_number}.pdf"
        }
    )