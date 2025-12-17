from pydantic import BaseModel
from typing import Optional
from app.schemas.user_schema import UserOut  # 👈 Importar el esquema del usuario


class KinesiologoBase(BaseModel):
    especialidad: Optional[str] = None
    matricula_profesional: Optional[str] = None


class KinesiologoCreate(KinesiologoBase):
    user_id: int
    matricula_profesional: str  # Requerido en creación


class KinesiologoUpdate(BaseModel):
    """Schema para actualizar kinesiólogo (todos los campos opcionales)"""
    especialidad: Optional[str] = None
    matricula_profesional: Optional[str] = None

    class Config:
        from_attributes = True


class KinesiologoOut(KinesiologoBase):
    id: int
    user_id: int
    user: Optional[UserOut] = None  # 👈 Incluir el usuario relacionado

    class Config:
        from_attributes = True
