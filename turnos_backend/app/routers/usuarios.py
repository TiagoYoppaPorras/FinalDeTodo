from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.crud import user_crud
from app.core.security import get_password_hash
from app.schemas.user_schema import UserCreate, UserUpdate, UserOut
from app.models.user import User

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.get("/", response_model=list[UserOut])
def listar_usuarios(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return user_crud.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=UserOut, status_code=201)
def crear_usuario(user: UserCreate, db: Session = Depends(get_db)):
    # Hashear password antes de crear
    user_dict = user.dict()
    user_dict['password_hash'] = get_password_hash(user_dict.pop('password'))
    from app.models.user import User
    db_user = User(**user_dict)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/{user_id}", response_model=UserOut)
def obtener_usuario(user_id: int, db: Session = Depends(get_db)):
    return user_crud.get_or_404(db, user_id)

@router.put("/{user_id}", response_model=UserOut)
def actualizar_usuario(user_id: int, user: UserUpdate, db: Session = Depends(get_db)):
    db_user = user_crud.get(db, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    update_data = user.dict(exclude_unset=True)
    
    # Si se actualiza el password, hashearlo
    if 'password' in update_data:
        update_data['password_hash'] = get_password_hash(update_data.pop('password'))
    
    for field, value in update_data.items():
        setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}")
def eliminar_usuario(user_id: int, db: Session = Depends(get_db)):
    deleted = user_crud.delete(db, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"message": "Usuario eliminado correctamente"}
