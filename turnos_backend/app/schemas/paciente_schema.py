from pydantic import BaseModel, field_validator
from typing import Optional
import re
from app.schemas.user_schema import UserOut

class PacienteBase(BaseModel):
    dni: Optional[str] = None
    telefono: Optional[str] = None
    obra_social: Optional[str] = None
    historial_medico: Optional[str] = None
    direccion: Optional[str] = None

    # 🛡️ VALIDACIÓN DE DNI: Solo números
    @field_validator('dni')
    def validar_dni(cls, v):
        if v is not None:
            # Eliminar puntos y espacios por si acaso
            clean_dni = v.replace(".", "").replace(" ", "").strip()
            if not clean_dni.isdigit():
                raise ValueError('El DNI debe contener solo números')
            if len(clean_dni) < 6 or len(clean_dni) > 10:
                raise ValueError('El DNI debe tener entre 6 y 10 dígitos')
            return clean_dni
        return v

    # 🛡️ VALIDACIÓN DE TELÉFONO: Limpieza básica
    @field_validator('telefono')
    def validar_telefono(cls, v):
        if v is not None:
            # Permitir +, -, espacios y números
            if not re.match(r'^[\d\+\-\s]+$', v):
                raise ValueError('El teléfono contiene caracteres inválidos')
            return v.strip()
        return v

    # 🛡️ CAPITALIZAR TEXTOS
    @field_validator('obra_social', 'direccion')
    def capitalizar_textos(cls, v):
        if v:
            return v.strip().title() # "OSDE BINARIO" -> "Osde Binario"
        return v

class PacienteCreate(PacienteBase):
    user_id: int

class PacienteUpdate(BaseModel):
    """Schema para actualizar paciente"""
    dni: Optional[str] = None
    telefono: Optional[str] = None
    obra_social: Optional[str] = None
    historial_medico: Optional[str] = None
    direccion: Optional[str] = None

    @field_validator('dni')
    def validar_dni(cls, v):
        if v is not None:
            clean_dni = v.replace(".", "").replace(" ", "").strip()
            if not clean_dni.isdigit():
                raise ValueError('El DNI debe contener solo números')
            return clean_dni
        return v

    class Config:
        from_attributes = True

class PacienteOut(PacienteBase):
    id: int
    user_id: int
    user: Optional[UserOut] = None

    class Config:
        from_attributes = True