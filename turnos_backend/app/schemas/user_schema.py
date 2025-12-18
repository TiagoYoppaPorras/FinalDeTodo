from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
import re

# ─────────────────────────────────────────────
# 🛡️ Función de Validación Reutilizable
# ─────────────────────────────────────────────
def validar_password_fuerte(v: str) -> str:
    """Valida reglas de complejidad de contraseña"""
    if len(v) < 8:
        raise ValueError('La contraseña debe tener al menos 8 caracteres.')
    if not re.search(r"\d", v):
        raise ValueError('La contraseña debe contener al menos un número.')
    if not re.search(r"[A-Z]", v):
        raise ValueError('La contraseña debe contener al menos una letra mayúscula.')
    return v

# --- Schema para Roles ---
class RoleOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

# --- Schema Base para Usuarios ---
class UserBase(BaseModel):
    nombre: str
    email: EmailStr # 🔒 Valida formato de email automáticamente
    activo: Optional[bool] = True

class UserCreate(UserBase):
    password: str

    # ✅ Aplicamos la validación al crear
    @field_validator('password')
    def password_must_be_strong(cls, v):
        return validar_password_fuerte(v)

class UserUpdate(BaseModel):
    """Schema para actualizar usuario (todos los campos opcionales)"""
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    activo: Optional[bool] = None
    password: Optional[str] = None 

    # ✅ Aplicamos la validación al actualizar (solo si enviaron password)
    @field_validator('password')
    def password_must_be_strong(cls, v):
        if v: 
            return validar_password_fuerte(v)
        return v

    class Config:
        from_attributes = True

class UserOut(UserBase):
    id: int
    roles: List[RoleOut] = []

    class Config:
        from_attributes = True