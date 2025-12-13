from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
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

# 🆕 Obtener usuarios disponibles (con rol paciente pero sin perfil)
@router.get("/usuarios-disponibles", response_model=list[dict])
def obtener_usuarios_disponibles(db: Session = Depends(get_db)):
    """
    Obtener usuarios que tienen rol 'paciente' pero NO tienen perfil de paciente creado.
    Útil para asociar un usuario existente a un perfil de paciente.
    """
    # Obtener usuarios con rol "paciente"
    usuarios_con_rol = (
        db.query(User)
        .join(User.roles)
        .filter(Role.name == "paciente")
        .options(joinedload(User.roles))
        .all()
    )
    
    # Filtrar solo los que NO tienen perfil de paciente
    usuarios_disponibles = []
    for user in usuarios_con_rol:
        # Verificar si ya tiene perfil de paciente
        tiene_perfil = db.query(Paciente).filter(Paciente.user_id == user.id).first()
        if not tiene_perfil:
            usuarios_disponibles.append({
                "id": user.id,
                "nombre": user.nombre,
                "email": user.email
            })
    
    return usuarios_disponibles

# 📋 Listar pacientes con paginación
@router.get("/", response_model=list[PacienteOut])
def listar_pacientes(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Obtener lista de pacientes con paginación"""
    return paciente_crud.get_multi(db, skip=skip, limit=limit)


# ➕ Crear paciente (asociar a usuario existente)
@router.post("/", response_model=PacienteOut, status_code=201)
def crear_paciente(paciente: PacienteCreate, db: Session = Depends(get_db)):
    """Crear un nuevo paciente asociado a un usuario existente"""
    return paciente_crud.create(db, paciente)


# 🆕 Crear paciente con usuario nuevo
@router.post("/con-usuario", response_model=PacienteOut, status_code=201)
def crear_paciente_con_usuario(
    paciente_data: dict, 
    db: Session = Depends(get_db)
):
    """
    Crear un paciente nuevo junto con su usuario.
    Útil cuando el usuario aún no existe en el sistema.
    """
    from app.models.user import User
    from app.models.paciente import Paciente
    from app.core.security import get_password_hash
    from app.models.role import Role
    from app.models.user_role import UserRole
    
    # 1. Verificar que el email no esté en uso
    email_existe = db.query(User).filter(User.email == paciente_data["email"]).first()
    if email_existe:
        raise HTTPException(
            status_code=400, 
            detail=f"El email {paciente_data['email']} ya está en uso"
        )
    
    # 2. Crear el usuario
    nuevo_usuario = User(
        nombre=paciente_data["nombre"],
        email=paciente_data["email"],
        password_hash=get_password_hash(paciente_data["password"]),
        activo=True
    )
    db.add(nuevo_usuario)
    db.flush()  # Para obtener el ID sin hacer commit aún
    
    # 3. Asignar rol "paciente"
    rol_paciente = db.query(Role).filter(Role.name == "paciente").first()
    if not rol_paciente:
        raise HTTPException(status_code=500, detail="Rol 'paciente' no encontrado en el sistema")
    
    user_role = UserRole(user_id=nuevo_usuario.id, role_id=rol_paciente.id)
    db.add(user_role)
    
    # 4. Crear el perfil de paciente
    nuevo_paciente = Paciente(
        user_id=nuevo_usuario.id,
        dni=paciente_data.get("dni"),
        telefono=paciente_data.get("telefono"),
        obra_social=paciente_data.get("obra_social"),
        historial_medico=paciente_data.get("historial_medico"),
        direccion=paciente_data.get("direccion")
    )
    db.add(nuevo_paciente)
    
    # 5. Hacer commit de todo
    db.commit()
    db.refresh(nuevo_paciente)
    
    return nuevo_paciente


# 🔍 Obtener paciente por ID
@router.get("/{paciente_id}", response_model=PacienteOut)
def obtener_paciente(paciente_id: int, db: Session = Depends(get_db)):
    """Obtener un paciente específico por ID"""
    return paciente_crud.get_or_404(db, paciente_id)


# ✏️ Actualizar paciente (NUEVO)
@router.put("/{paciente_id}", response_model=PacienteOut)
def actualizar_paciente(
    paciente_id: int, 
    paciente: PacienteUpdate, 
    db: Session = Depends(get_db)
):
    """Actualizar información de un paciente"""
    updated = paciente_crud.update(db, paciente_id, paciente)
    if not updated:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    return updated


# ❌ Eliminar paciente
@router.delete("/{paciente_id}")
def eliminar_paciente(paciente_id: int, db: Session = Depends(get_db)):
    """Eliminar un paciente"""
    deleted = paciente_crud.delete(db, paciente_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    return {"message": "Paciente eliminado correctamente"}
