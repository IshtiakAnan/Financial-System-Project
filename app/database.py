from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker



server = 'DESKTOP-C76SKG4'
database = 'FinancialManagementSystem'
username = 'hp'
password = '52368'
driver = 'ODBC Driver 18 for SQL Server'

connection_string = f'mssql+pyodbc://@{server}/{database}?driver={driver}&TrustServerCertificate=yes'
# Use the same connection string for SQLALCHEMY_DATABASE_URL
SQLALCHEMY_DATABASE_URL = connection_string

engine = create_engine(connection_string)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
