from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, constr, field_validator
from typing import Literal



# ================== Shared Schemas ==================

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class UserBase(BaseModel):
    username: str
    email: EmailStr

class StudentBase(BaseModel):
    name: str
    admission_no: str
    class_: str = Field(..., alias="class")
    section: str
    guardian_name: Optional[str]
    contact_info: Optional[dict]

class EmployeeBase(BaseModel):
    name: str
    designation: str
    department: str
    salary: Decimal


# ================== Create Schemas ==================

class RoleCreate(RoleBase):
    pass

class UserCreate(UserBase):
    password: str
    role_id: int

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        import re
        pattern = r'^(?=.*[0-9])(?=.*[a-zA-Z]).{8,}$'
        if not re.match(pattern, v):
            raise ValueError("Password must be at least 8 characters long and contain both letters and numbers.")
        return v

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"

class TokenData(BaseModel):
    id: Optional[str] = None

class RefreshToken(BaseModel):
    refresh_token: str

class StudentCreate(StudentBase):
    joined_date: date
    user_id: Optional[int]

class EmployeeCreate(EmployeeBase):
    join_date: date
    user_id: Optional[int]

class FeeCreate(BaseModel):
    name: str
    amount: Decimal
    due_date: date
    class_: str = Field(..., alias="class")
    is_recurring: bool

class FeePaymentCreate(BaseModel):
    student_id: int
    fee_id: int
    amount_paid: Decimal
    payment_date: date
    payment_method: str
    reference_no: Optional[str]
    status: str

class InvoiceCreate(BaseModel):
    student_id: int
    total_amount: Decimal
    issue_date: date
    due_date: date
    status: str

class InvoiceUpdate(BaseModel):
    student_id: Optional[int] = None
    total_amount: Optional[Decimal] = None
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    status: Optional[str] = None

class SalaryCreate(BaseModel):
    employee_id: int
    base_salary: Decimal
    bonus: Decimal
    deductions: Decimal
    net_salary: Decimal
    pay_date: date

class AttendanceCreate(BaseModel):
    employee_id: int
    date: date
    status: str

class PayrollCreate(BaseModel):
    employee_id: int
    month: str
    status: str
    processed_on: date

class TransactionCreate(BaseModel):
    type: str
    amount: Decimal
    date: date
    category: str
    reference_id: Optional[int]
    description: Optional[str]

class LedgerEntryCreate(BaseModel):
    debit_account: str
    credit_account: str
    amount: Decimal
    entry_date: date
    description: Optional[str]

class AssetCreate(BaseModel):
    name: str
    category: str
    purchase_date: date
    value: Decimal
    depreciation: Decimal
    current_value: Decimal

class PurchaseCreate(BaseModel):
    item_name: str
    vendor_name: str
    amount: Decimal
    purchase_date: date
    category: str

class GrantCreate(BaseModel):
    source: str
    amount: Decimal
    received_on: date
    purpose: Optional[str]
    linked_expense_id: Optional[int]

class ReportCreate(BaseModel):
    name: str
    created_by: int
    file_path: str
    report_type: str

class AuditLogCreate(BaseModel):
    user_id: int
    action: str
    table_name: str
    record_id: int
    timestamp: Optional[datetime] = None
    details: Optional[str]

# ================== Response Schemas ==================

class Role(RoleBase):
    id: int
    model_config = {
    "from_attributes": True
}


class User(UserBase):
    id: int
    role: Role
    model_config = {
    "from_attributes": True
}


class Student(StudentBase):
    id: int
    model_config = {
    "from_attributes": True
}


class Employee(EmployeeBase):
    id: int
    model_config = {
    "from_attributes": True
}


class Fee(FeeCreate):
    id: int
    model_config = {
    "from_attributes": True
}

class FeePayment(FeePaymentCreate):
    id: int
    model_config = {
    "from_attributes": True
}

class Invoice(InvoiceCreate):
    id: int
    model_config = {
    "from_attributes": True
}

class Salary(SalaryCreate):
    id: int
    model_config = {
    "from_attributes": True
}

class Attendance(AttendanceCreate):
    id: int
    model_config = {
    "from_attributes": True
}

class Payroll(PayrollCreate):
    id: int
    model_config = {
    "from_attributes": True
}

class Transaction(TransactionCreate):
    id: int
    model_config = {
    "from_attributes": True
}

class LedgerEntry(LedgerEntryCreate):
    id: int
    model_config = {
    "from_attributes": True
}

class Asset(AssetCreate):
    id: int
    model_config = {
    "from_attributes": True
}

class Purchase(PurchaseCreate):
    id: int
    model_config = {
    "from_attributes": True
}

class Grant(GrantCreate):
    id: int
    model_config = {
    "from_attributes": True
}

class Report(ReportCreate):
    id: int
    model_config = {
    "from_attributes": True
}

class AuditLog(AuditLogCreate):
    id: int
    model_config = {
    "from_attributes": True
}
