from sqlalchemy import Column, Integer, String
from database import Base

class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, unique=True, index=True)
    type = Column(String)
    floor = Column(Integer)

class CleaningRecord(Base):
    __tablename__ = "cleaning_records"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, index=True) # YYYY-MM-DD
    room_id = Column(Integer, index=True) # storing ID, but for simplicity in prototype maybe strictly link? Let's use ID.
    bed_staff_id = Column(Integer, nullable=True)
    bath_staff_id = Column(Integer, nullable=True)
    towel_count = Column(Integer, default=0)
    status = Column(String, default="draft") # 'draft' or 'locked'

class MonthlyLock(Base):
    __tablename__ = "monthly_locks"

    id = Column(Integer, primary_key=True, index=True)
    year_month = Column(String, unique=True, index=True) # YYYY-MM
    is_locked = Column(Integer, default=0) # 0 for false, 1 for true

class DailyLock(Base):
    __tablename__ = "daily_locks"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, unique=True, index=True) # YYYY-MM-DD
    is_locked = Column(Integer, default=0) # 0 for false, 1 for true
