from sqlalchemy import Column, Integer, String, Float
from database import Base    
#Ajout de la table user 
from sqlalchemy import Column, Integer, String, Float
from database import Base

class DNASequence(Base):
    __tablename__ = "sequences"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String)
    patient_id = Column(String)
    age = Column(Integer)
    sample_status = Column(String, default="Active")
    sequence = Column(String)
    length = Column(Integer)
    gc_content = Column(Float)
    quality_score = Column(String)
    reliability = Column(String)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    fullName = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)