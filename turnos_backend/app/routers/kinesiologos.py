from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import date
from typing import List, Optional
from pydantic import EmailStr, ValidationError, TypeAdapter

from app.database import get_db
from app.core.crud import kinesiologo_crud
from app.schemas.kinesiologo_schema import KinesiologoCreate, KinesiologoUpdate, KinesiologoOut
from app.models.user import User
from app.models.kinesiologo import Kinesiologo
from app.models.turno import Turno
from app.models.role import Role
from app.models.user_role import UserRole
from app.core.security import get_password_hash

router = APIRouter(
    prefix="/kinesiologos",
    tags=["Kinesiologos"]
)

# 🛡️ Validaciones Auxiliares
def validar_formato_email(email: str):
    try:
        TypeAdapter(EmailStr).validate_python(email)
    except ValidationError:
        raise HTTPException(status_code=400, detail="El formato del email no es válido.")

def verificar_matricula_existente(db: Session, matricula: str, exclude_id: Optional[int] = None):
    query = db.query(Kinesiologo).filter(Kinesiologo.matricula_profesional == matricula)
    if exclude_id:
        query = query.filter(Kinesiologo.id != exclude_id)
    if query.first():
        raise HTTPException(status_code=400, detail=f"La matrícula '{matricula}' ya está registrada.")

# ─────────────────────────────────────────────
# 📋 Endpoints
# ─────────────────────────────────────────────

@router.get("/usuarios-disponibles", response_model=list[dict])
def obtener_usuarios_disponibles(db: Session = Depends(get_db)):
    usuarios_con_rol = (
        db.query(User).join(User.roles)
        .filter(Role.name == "kinesiologo")
        .options(joinedload(User.roles)).all()
    )
    usuarios_disponibles = []
    for user in usuarios_con_rol:
        tiene_perfil = db.query(Kinesiologo).filter(Kinesiologo.user_id == user.id).first()
        if not tiene_perfil:
            usuarios_disponibles.append({
                "id": user.id, "nombre": user.nombre, "email": user.email
            })
    return usuarios_disponibles

@router.get("/", response_model=list[KinesiologoOut])
def listar_kinesiologos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return kinesiologo_crud.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=KinesiologoOut, status_code=201)
def crear_kinesiologo(kinesiologo: KinesiologoCreate, db: Session = Depends(get_db)):
    verificar_matricula_existente(db, kinesiologo.matricula_profesional)
    if kinesiologo.especialidad:
        kinesiologo.especialidad = kinesiologo.especialidad.title()
    return kinesiologo_crud.create(db, kinesiologo)

@router.post("/con-usuario", response_model=KinesiologoOut, status_code=201)
def crear_kinesiologo_con_usuario(kinesiologo_data: dict, db: Session = Depends(get_db)):
    if "email" not in kinesiologo_data or not kinesiologo_data["email"]:
        raise HTTPException(status_code=400, detail="El email es obligatorio")

    email_limpio = kinesiologo_data["email"].strip().lower()
    validar_formato_email(email_limpio)

    matricula_limpia = kinesiologo_data["matricula_profesional"].strip()

    if db.query(User).filter(User.email == email_limpio).first():
        raise HTTPException(status_code=400, detail=f"El email {email_limpio} ya está en uso")
    
    verificar_matricula_existente(db, matricula_limpia)

    nuevo_usuario = User(
        nombre=kinesiologo_data["nombre"].title(),
        email=email_limpio,
        password_hash=get_password_hash(kinesiologo_data["password"]),
        activo=True
    )
    db.add(nuevo_usuario)
    db.flush()
    
    rol_kine = db.query(Role).filter(Role.name == "kinesiologo").first()
    if not rol_kine: raise HTTPException(status_code=500, detail="Rol 'kinesiologo' no encontrado")
    
    db.add(UserRole(user_id=nuevo_usuario.id, role_id=rol_kine.id))
    
    nuevo_kinesiologo = Kinesiologo(
        user_id=nuevo_usuario.id,
        matricula_profesional=matricula_limpia,
        especialidad=kinesiologo_data.get("especialidad", "").title()
    )
    db.add(nuevo_kinesiologo)
    
    db.commit()
    db.refresh(nuevo_kinesiologo)
    return nuevo_kinesiologo

@router.get("/{kinesiologo_id}", response_model=KinesiologoOut)
def obtener_kinesiologo(kinesiologo_id: int, db: Session = Depends(get_db)):
    return kinesiologo_crud.get_or_404(db, kinesiologo_id)

@router.put("/{kinesiologo_id}", response_model=KinesiologoOut)
def actualizar_kinesiologo(kinesiologo_id: int, kinesiologo: KinesiologoUpdate, db: Session = Depends(get_db)):
    db_kine = kinesiologo_crud.get(db, kinesiologo_id)
    if not db_kine: raise HTTPException(status_code=404, detail="Kinesiólogo no encontrado")

    if kinesiologo.matricula_profesional and kinesiologo.matricula_profesional != db_kine.matricula_profesional:
        verificar_matricula_existente(db, kinesiologo.matricula_profesional, exclude_id=kinesiologo_id)

    if kinesiologo.especialidad:
        kinesiologo.especialidad = kinesiologo.especialidad.title()

    return kinesiologo_crud.update(db, kinesiologo_id, kinesiologo)

# 🛑 ELIMINACIÓN SEGURA
@router.delete("/{kinesiologo_id}")
def eliminar_kinesiologo(kinesiologo_id: int, db: Session = Depends(get_db)):
    kine = db.query(Kinesiologo).filter(Kinesiologo.id == kinesiologo_id).first()
    if not kine: raise HTTPException(status_code=404, detail="Kinesiólogo no encontrado")

    turnos_pendientes = db.query(Turno).filter(
        Turno.kinesiologo_id == kinesiologo_id,
        Turno.estado.in_(["pendiente", "confirmado"])
    ).count()

    if turnos_pendientes > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"No se puede eliminar: tiene {turnos_pendientes} turno(s) activos (pendientes/confirmados). Reasígnalos primero."
        )

    db.delete(kine)
    db.commit()
    return {"message": "Kinesiólogo eliminado correctamente"}