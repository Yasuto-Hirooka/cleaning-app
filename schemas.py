from pydantic import BaseModel

class StaffBase(BaseModel):
    name: str

class StaffCreate(StaffBase):
    pass

class Staff(StaffBase):
    id: int

    class Config:
        orm_mode = True

class RoomBase(BaseModel):
    number: str
    type: str
    floor: int

class RoomCreate(RoomBase):
    pass

class Room(RoomBase):
    id: int

    class Config:
        from_attributes = True

class CleaningRecordBase(BaseModel):
    date: str
    room_id: int
    bed_staff_id: int | None = None
    bath_staff_id: int | None = None
    towel_count: int = 0
    status: str = "draft"

class CleaningRecordCreate(CleaningRecordBase):
    pass

class CleaningRecord(CleaningRecordBase):
    id: int

    class Config:
        from_attributes = True

class MonthlyLockBase(BaseModel):
    year_month: str
    is_locked: int

class MonthlyLock(MonthlyLockBase):
    id: int

    class Config:
        from_attributes = True

class DailyLockBase(BaseModel):
    date: str
    is_locked: int

class DailyLock(DailyLockBase):
    id: int

    class Config:
        from_attributes = True

class DailyLockUpdate(BaseModel):
    is_locked: int
