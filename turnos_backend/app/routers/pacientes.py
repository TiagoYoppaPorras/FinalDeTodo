from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from pydantic import EmailStr, ValidationError, TypeAdapter
from app.database import get_db
from app.core.crud import paciente_crud
from app.schemas.paciente_schema import PacienteCreate, PacienteUpdate, PacienteOut
from app.models.user import User
from app.models.paciente import Paciente
from app.models.role import Role

router = APIRouter(
    prefix="/pacientes",
    tags=["Pacientes"]
)

# ─────────────────────────────────────────────
# 🛡️ Validaciones Auxiliares
# ─────────────────────────────────────────────
def validar_formato_email(email: str):
    """Valida manualmente que el email tenga formato correcto"""
    try:
        TypeAdapter(EmailStr).validate_python(email)
    except ValidationError:
        raise HTTPException(status_code=400, detail="El formato del email no es válido (falta @ o dominio).")

def verificar_dni_existente(db: Session, dni: str, exclude_id: int = None):
    """Lanza excepción si el DNI ya existe en otro paciente"""
    if not dni: return
    
    query = db.query(Paciente).filter(Paciente.dni == dni)
    if exclude_id:
        query = query.filter(Paciente.id != exclude_id)
        
    if query.first():
        raise HTTPException(
            status_code=400, 
            detail=f"El DNI {dni} ya está registrado en el sistema."
        )

# ─────────────────────────────────────────────
# 📋 Endpoints
# ─────────────────────────────────────────────

@router.get("/usuarios-disponibles", response_model=list[dict])
def obtener_usuarios_disponibles(db: Session = Depends(get_db)):
    usuarios_con_rol = (
        db.query(User).join(User.roles)
        .filter(Role.name == "paciente")
        .options(joinedload(User.roles)).all()
    )
    usuarios_disponibles = []
    for user in usuarios_con_rol:
        tiene_perfil = db.query(Paciente).filter(Paciente.user_id == user.id).first()
        if not tiene_perfil:
            usuarios_disponibles.append({
                "id": user.id, "nombre": user.nombre, "email": user.email
            })
    return usuarios_disponibles

@router.get("/", response_model=list[PacienteOut])
def listar_pacientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return paciente_crud.get_multi(db, skip=skip, limit=limit)

# ➕ Crear paciente (perfil solo)
@router.post("/", response_model=PacienteOut, status_code=201)
def crear_paciente(paciente: PacienteCreate, db: Session = Depends(get_db)):
    # 1. Validar si el usuario existe
    user = db.query(User).filter(User.id == paciente.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # 2. Validar que no tenga perfil ya
    if db.query(Paciente).filter(Paciente.user_id == paciente.user_id).first():
        raise HTTPException(status_code=400, detail="Este usuario ya tiene un perfil de paciente creado.")

    # 3. Validar DNI duplicado
    if paciente.dni:
        verificar_dni_existente(db, paciente.dni)

    return paciente_crud.create(db, paciente)

# 🆕 Crear paciente COMPLETO (Usuario + Perfil)
@router.post("/con-usuario", response_model=PacienteOut, status_code=201)
def crear_paciente_con_usuario(paciente_data: dict, db: Session = Depends(get_db)):
    from app.models.user import User
    from app.models.paciente import Paciente
    from app.core.security import get_password_hash
    from app.models.role import Role
    from app.models.user_role import UserRole
    
    # 1. Limpieza y VALIDACIÓN MANUAL DE EMAIL
    if "email" not in paciente_data or not paciente_data["email"]:
        raise HTTPException(status_code=400, detail="El email es obligatorio")

    email_limpio = paciente_data["email"].strip().lower()
    
    # 🛑 BLOQUEO DE EMAIL INVÁLIDO
    validar_formato_email(email_limpio)

    dni_limpio = paciente_data.get("dni", "").replace(".", "").strip()
    nombre_limpio = paciente_data["nombre"].strip().title() # ✨ Capitalizar Nombre

    # 2. Validar unicidad (Email y DNI)
    if db.query(User).filter(User.email == email_limpio).first():
        raise HTTPException(status_code=400, detail=f"El email {email_limpio} ya está en uso")
    
    if dni_limpio:
        verificar_dni_existente(db, dni_limpio)

    # 3. Crear Usuario
    nuevo_usuario = User(
        nombre=nombre_limpio,
        email=email_limpio,
        password_hash=get_password_hash(paciente_data["password"]),
        activo=True
    )
    db.add(nuevo_usuario)
    db.flush() 
    
    # 4. Asignar rol
    rol_paciente = db.query(Role).filter(Role.name == "paciente").first()
    if not rol_paciente:
        raise HTTPException(status_code=500, detail="Rol 'paciente' no encontrado")
    
    user_role = UserRole(user_id=nuevo_usuario.id, role_id=rol_paciente.id)
    db.add(user_role)
    
    # 5. Crear Perfil Paciente
    nuevo_paciente = Paciente(
        user_id=nuevo_usuario.id,
        dni=dni_limpio,
        telefono=paciente_data.get("telefono"),
        obra_social=paciente_data.get("obra_social", "").title(), # ✨ Capitalizar Obra Social
        historial_medico=paciente_data.get("historial_medico"),
        direccion=paciente_data.get("direccion", "").title()
    )
    db.add(nuevo_paciente)
    
    db.commit()
    db.refresh(nuevo_paciente)
    return nuevo_paciente

@router.get("/{paciente_id}", response_model=PacienteOut)
def obtener_paciente(paciente_id: int, db: Session = Depends(get_db)):
    return paciente_crud.get_or_404(db, paciente_id)

# ✏️ Actualizar con validación de duplicados
@router.put("/{paciente_id}", response_model=PacienteOut)
def actualizar_paciente(paciente_id: int, paciente: PacienteUpdate, db: Session = Depends(get_db)):
    db_paciente = paciente_crud.get(db, paciente_id)
    if not db_paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    # Si intentan cambiar el DNI, verificamos que el NUEVO dni no pertenezca a OTRO usuario
    if paciente.dni and paciente.dni != db_paciente.dni:
        verificar_dni_existente(db, paciente.dni, exclude_id=paciente_id)

    return paciente_crud.update(db, paciente_id, paciente)

@router.delete("/{paciente_id}")
def eliminar_paciente(paciente_id: int, db: Session = Depends(get_db)):
    deleted = paciente_crud.delete(db, paciente_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    return {"message": "Paciente eliminado correctamente"}