from typing import Optional, List
from fastapi import FastAPI, Response, status, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from sqlalchemy.orm import Session
from loguru import logger
from app import models, schemas, utils
from app.database import engine, get_db
from .routers import assets, attendance, audit, auth, employees, fee_payments, fees, grants, invoices, ledger, payroll, purchages, reports, salaries, students, transactions, users

# Configure Loguru logger
logger.add("app.log", rotation="500 MB", level="INFO")

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Educational Financial Management System",
    description="API for managing educational institution finances",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )



app.include_router(users.db_user_router)
app.include_router(students.db_student_router)
app.include_router(employees.db_employee_router)
app.include_router(fees.db_fee_router)
app.include_router(fee_payments.db_payment_router)
app.include_router(invoices.db_invoice_router)
app.include_router(salaries.db_salary_router)
app.include_router(attendance.db_attendance_router)
app.include_router(payroll.db_payroll_router)
app.include_router(transactions.db_transaction_router)
app.include_router(ledger.db_ledger_router)
app.include_router(assets.db_asset_router)
app.include_router(purchages.db_purchase_router)
app.include_router(grants.db_grant_router)
app.include_router(reports.db_report_router)
app.include_router(audit.db_audit_router)






