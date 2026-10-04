from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# El fichié SQLite mte3ek bech yet-sna3 hna
SQLALCHEMY_DATABASE_URL = "sqlite:///./bio_dna.db"

# El engine elli bech i-kallem el base
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Function bech n-7ellou w n-sakkrou el connection
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()