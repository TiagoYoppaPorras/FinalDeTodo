from pydantic import BaseModel
from typing import Optional
from app.schemas.user_schema import UserOut  # 👈 importa el esquema del usuario


class PacienteBase(BaseModel):
    dni: Optional[str] = None
    telefono: Optional[str] = None
    obra_social: Optional[str] = None
    historial_medico: Optional[str] = None
    direccion: Optional[str] = None


class PacienteCreate(PacienteBase):
    user_id: int


class PacienteUpdate(BaseModel):
    """Schema para actualizar paciente (todos los campos opcionales)"""
    dni: Optional[str] = None
    telefono: Optional[str] = None
    obra_social: Optional[str] = None
    historial_medico: Optional[str] = None
    direccion: Optional[str] = None

    class Config:
        orm_mode = True


class PacienteOut(PacienteBase):
    id: int
    user_id: int
    user: Optional[UserOut] = None  # 👈 ahora incluye el usuario completo

    class Config:
        orm_mode = True
