from pydantic import BaseModel, EmailStr
from typing import Optional, List

class RoleOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True  # <--- Cambiado

class UserBase(BaseModel):
    nombre: str
    email: EmailStr
    activo: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    """Schema para actualizar usuario (todos los campos opcionales)"""
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    activo: Optional[bool] = None
    password: Optional[str] = None  # Si se proporciona, hashear antes de guardar

    class Config:
        from_attributes = True  # <--- Cambiado

class UserOut(UserBase):
    id: int
    roles: List[RoleOut] = []

    class Config:
        from_attributes = True  # <--- Cambiado