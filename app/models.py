from sqlalchemy import DECIMAL, JSON, Column, Date, DateTime, ForeignKey, Integer, String, Boolean, Text, func, Index
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
from .database import Base

class SoftDeleteMixin:
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime, nullable=True)

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = datetime.utcnow()

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True)
    description = Column(Text)


class User(Base, SoftDeleteMixin):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True)
    email = Column(String(100), unique=True)
    hashed_password = Column(Text)
    role_id = Column(Integer, ForeignKey("roles.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    role = relationship("Role")

    # Add indexes for frequently queried fields
    __table_args__ = (
        Index('idx_user_email', 'email'),
        Index('idx_user_username', 'username'),
    )


class Student(Base, SoftDeleteMixin):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    admission_no = Column(String(100), unique=True)
    class_ = Column("class", String(100))
    section = Column(String(100))
    guardian_name = Column(String(100))
    contact_info = Column(JSON)
    joined_date = Column(Date)
    user_id = Column(Integer, ForeignKey("users.id"))

    # Add indexes for frequently queried fields
    __table_args__ = (
        Index('idx_student_admission_no', 'admission_no'),
        Index('idx_student_name', 'name'),
    )


class Employee(Base, SoftDeleteMixin):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    designation = Column(String(100))
    department = Column(String(100))
    join_date = Column(Date)
    salary = Column(DECIMAL)
    user_id = Column(Integer, ForeignKey("users.id"))

    # Add indexes for frequently queried fields
    __table_args__ = (
        Index('idx_employee_name', 'name'),
        Index('idx_employee_department', 'department'),
    )


class Fee(Base):
    __tablename__ = "fees"
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    amount = Column(DECIMAL)
    due_date = Column(Date)
    class_ = Column("class", String(100))
    is_recurring = Column(Boolean)


class FeePayment(Base):
    __tablename__ = "fee_payments"
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    fee_id = Column(Integer, ForeignKey("fees.id"))
    amount_paid = Column(DECIMAL)
    payment_date = Column(Date)
    payment_method = Column(String(100))
    reference_no = Column(String(100))
    status = Column(String(100))


class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    total_amount = Column(DECIMAL)
    issue_date = Column(Date)
    due_date = Column(Date)
    status = Column(String(100))


class Salary(Base):
    __tablename__ = "salaries"
    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    base_salary = Column(DECIMAL)
    bonus = Column(DECIMAL)
    deductions = Column(DECIMAL)
    net_salary = Column(DECIMAL)
    pay_date = Column(Date)


class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    date = Column(Date)
    status = Column(String(100))


class Payroll(Base):
    __tablename__ = "payroll"
    id = Column(Integer, primary_key=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    month = Column(String(100))
    status = Column(String(100))
    processed_on = Column(Date)


class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True)
    type = Column(String(100))
    amount = Column(DECIMAL)
    date = Column(Date)
    category = Column(String(100))
    reference_id = Column(Integer)
    description = Column(Text)


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"
    id = Column(Integer, primary_key=True)
    debit_account = Column(String(100))
    credit_account = Column(String(100))
    amount = Column(DECIMAL)
    entry_date = Column(Date)
    description = Column(Text)


class Asset(Base):
    __tablename__ = "assets"
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    category = Column(String(100))
    purchase_date = Column(Date)
    value = Column(DECIMAL)
    depreciation = Column(DECIMAL)
    current_value = Column(DECIMAL)


class Purchase(Base):
    __tablename__ = "purchases"
    id = Column(Integer, primary_key=True)
    item_name = Column(String(100))
    vendor_name = Column(String(100))
    amount = Column(DECIMAL)
    purchase_date = Column(Date)
    category = Column(String(100))


class Grant(Base):
    __tablename__ = "grants"
    id = Column(Integer, primary_key=True)
    source = Column(String(100))
    amount = Column(DECIMAL)
    received_on = Column(Date)
    purpose = Column(Text)
    linked_expense_id = Column(Integer)


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_on = Column(DateTime, default=datetime.utcnow)
    file_path = Column(String(255))
    report_type = Column(String(100))


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(100))
    table_name = Column(String(100))
    record_id = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(Text)