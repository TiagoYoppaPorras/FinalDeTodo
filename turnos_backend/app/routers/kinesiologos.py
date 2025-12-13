from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.crud import kinesiologo_crud
from app.schemas.kinesiologo_schema import KinesiologoCreate, KinesiologoUpdate, KinesiologoOut

router = APIRouter(
    prefix="/kinesiologos",
    tags=["Kinesiologos"]
)

@router.get("/", response_model=list[KinesiologoOut])
def listar_kinesiologos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return kinesiologo_crud.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=KinesiologoOut, status_code=201)
def crear_kinesiologo(kinesiologo: KinesiologoCreate, db: Session = Depends(get_db)):
    return kinesiologo_crud.create(db, kinesiologo)

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
