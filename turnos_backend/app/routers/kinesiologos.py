from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.core.crud import kinesiologo_crud
from app.schemas.kinesiologo_schema import KinesiologoCreate, KinesiologoUpdate, KinesiologoOut
from app.models.user import User
from app.models.kinesiologo import Kinesiologo
from app.models.role import Role

router = APIRouter(
    prefix="/kinesiologos",
    tags=["Kinesiologos"]
)

# 🆕 Obtener usuarios disponibles (con rol kinesiologo pero sin perfil)
@router.get("/usuarios-disponibles", response_model=list[dict])
def obtener_usuarios_disponibles(db: Session = Depends(get_db)):
    """
    Obtener usuarios que tienen rol 'kinesiologo' pero NO tienen perfil de kinesiólogo creado.
    Útil para asociar un usuario existente a un perfil de kinesiólogo.
    """
    # Obtener usuarios con rol "kinesiologo"
    usuarios_con_rol = (
        db.query(User)
        .join(User.roles)
        .filter(Role.name == "kinesiologo")
        .options(joinedload(User.roles))
        .all()
    )
    
    # Filtrar solo los que NO tienen perfil de kinesiólogo
    usuarios_disponibles = []
    for user in usuarios_con_rol:
        # Verificar si ya tiene perfil de kinesiólogo
        tiene_perfil = db.query(Kinesiologo).filter(Kinesiologo.user_id == user.id).first()
        if not tiene_perfil:
            usuarios_disponibles.append({
                "id": user.id,
                "nombre": user.nombre,
                "email": user.email
            })
    
    return usuarios_disponibles

@router.get("/", response_model=list[KinesiologoOut])
def listar_kinesiologos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return kinesiologo_crud.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=KinesiologoOut, status_code=201)
def crear_kinesiologo(kinesiologo: KinesiologoCreate, db: Session = Depends(get_db)):
    """Crear kinesiólogo asociado a usuario existente"""
    return kinesiologo_crud.create(db, kinesiologo)

# 🆕 Crear kinesiólogo con usuario nuevo
@router.post("/con-usuario", response_model=KinesiologoOut, status_code=201)
def crear_kinesiologo_con_usuario(
    kinesiologo_data: dict, 
    db: Session = Depends(get_db)
):
    """
    Crear un kinesiólogo nuevo junto con su usuario.
    Útil cuando el usuario aún no existe en el sistema.
    """
    from app.models.user import User
    from app.models.kinesiologo import Kinesiologo
    from app.core.security import get_password_hash
    from app.models.role import Role
    from app.models.user_role import UserRole
    
    # 1. Verificar que el email no esté en uso
    email_existe = db.query(User).filter(User.email == kinesiologo_data["email"]).first()
    if email_existe:
        raise HTTPException(
            status_code=400, 
            detail=f"El email {kinesiologo_data['email']} ya está en uso"
        )
    
    # 2. Crear el usuario
    nuevo_usuario = User(
        nombre=kinesiologo_data["nombre"],
        email=kinesiologo_data["email"],
        password_hash=get_password_hash(kinesiologo_data["password"]),
        activo=True
    )
    db.add(nuevo_usuario)
    db.flush()  # Para obtener el ID sin hacer commit aún
    
    # 3. Asignar rol "kinesiologo"
    rol_kinesiologo = db.query(Role).filter(Role.name == "kinesiologo").first()
    if not rol_kinesiologo:
        raise HTTPException(status_code=500, detail="Rol 'kinesiologo' no encontrado en el sistema")
    
    user_role = UserRole(user_id=nuevo_usuario.id, role_id=rol_kinesiologo.id)
    db.add(user_role)
    
    # 4. Crear el perfil de kinesiólogo
    nuevo_kinesiologo = Kinesiologo(
        user_id=nuevo_usuario.id,
        matricula_profesional=kinesiologo_data["matricula_profesional"],  # Obligatorio
        especialidad=kinesiologo_data.get("especialidad")
    )
    db.add(nuevo_kinesiologo)
    
    # 5. Hacer commit de todo
    db.commit()
    db.refresh(nuevo_kinesiologo)
    
    return nuevo_kinesiologo

@router.get("/{kinesiologo_id}", response_model=KinesiologoOut)
def obtener_kinesiologo(kinesiologo_id: int, db: Session = Depends(get_db)):
    return kinesiologo_crud.get_or_404(db, kinesiologo_id)

@router.put("/{kinesiologo_id}", response_model=KinesiologoOut)
def actualizar_kinesiologo(kinesiologo_id: int, kinesiologo: KinesiologoUpdate, db: Session = Depends(get_db)):
    updated = kinesiologo_crud.update(db, kinesiologo_id, kinesiologo)
    if not updated:
        raise HTTPException(status_code=404, detail="Kinesiólogo no encontrado")
    return updated

@router.delete("/{kinesiologo_id}")
def eliminar_kinesiologo(kinesiologo_id: int, db: Session = Depends(get_db)):
    deleted = kinesiologo_crud.delete(db, kinesiologo_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Kinesiólogo no encontrado")
    return {"message": "Kinesiólogo eliminado correctamente"}
