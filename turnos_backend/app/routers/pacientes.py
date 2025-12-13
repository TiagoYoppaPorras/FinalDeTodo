from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.crud import paciente_crud
from app.schemas.paciente_schema import PacienteCreate, PacienteUpdate, PacienteOut

router = APIRouter(
    prefix="/pacientes",
    tags=["Pacientes"]
)

# 📋 Listar pacientes con paginación
@router.get("/", response_model=list[PacienteOut])
def listar_pacientes(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Obtener lista de pacientes con paginación"""
    return paciente_crud.get_multi(db, skip=skip, limit=limit)


# ➕ Crear paciente
@router.post("/", response_model=PacienteOut, status_code=201)
def crear_paciente(paciente: PacienteCreate, db: Session = Depends(get_db)):
    """Crear un nuevo paciente"""
    return paciente_crud.create(db, paciente)


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
