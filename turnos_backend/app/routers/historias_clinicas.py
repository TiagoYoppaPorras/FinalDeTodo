from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date

from app.database import get_db
from app.models.historia_clinica import HistoriaClinica
from app.models.paciente import Paciente
from app.models.kinesiologo import Kinesiologo
from app.schemas.historia_clinica_schema import (
    HistoriaClinicaCreate,
    HistoriaClinicaUpdate,
    HistoriaClinicaOut
)

router = APIRouter(prefix="/historias-clinicas", tags=["Historias Clínicas"])


# ==========================================
# LISTAR TODAS LAS HISTORIAS
# ==========================================
@router.get("/", response_model=List[HistoriaClinicaOut])
def listar_historias(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Listar todas las historias clínicas con paginación"""
    historias = (
        db.query(HistoriaClinica)
        .options(
            joinedload(HistoriaClinica.paciente).joinedload(Paciente.user),
            joinedload(HistoriaClinica.kinesiologo).joinedload(Kinesiologo.user)
        )
        .offset(skip)
        .limit(limit)
        .all()
    )
    return historias


# ==========================================
# OBTENER HISTORIAS DE UN PACIENTE
# ==========================================
@router.get("/paciente/{paciente_id}", response_model=List[HistoriaClinicaOut])
def obtener_historias_paciente(
    paciente_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtener todas las historias clínicas de un paciente
    Ordenadas por fecha más reciente primero
    """
    # Verificar que el paciente existe
    paciente = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    
    historias = (
        db.query(HistoriaClinica)
        .options(
            joinedload(HistoriaClinica.kinesiologo).joinedload(Kinesiologo.user)
        )
        .filter(HistoriaClinica.paciente_id == paciente_id)
        .order_by(HistoriaClinica.fecha_consulta.desc())
        .all()
    )
    
    return historias


# ==========================================
# OBTENER UNA HISTORIA POR ID
# ==========================================
@router.get("/{historia_id}", response_model=HistoriaClinicaOut)
def obtener_historia(
    historia_id: int,
    db: Session = Depends(get_db)
):
    """Obtener una historia clínica específica"""
    historia = (
        db.query(HistoriaClinica)
        .options(
            joinedload(HistoriaClinica.paciente).joinedload(Paciente.user),
            joinedload(HistoriaClinica.kinesiologo).joinedload(Kinesiologo.user)
        )
        .filter(HistoriaClinica.id == historia_id)
        .first()
    )
    
    if not historia:
        raise HTTPException(status_code=404, detail="Historia clínica no encontrada")
    
    return historia


# ==========================================
# CREAR NUEVA HISTORIA CLÍNICA
# ==========================================
@router.post("/", response_model=HistoriaClinicaOut, status_code=201)
def crear_historia(
    historia_data: HistoriaClinicaCreate,
    db: Session = Depends(get_db)
):
    """Crear una nueva historia clínica"""
    
    # Validar que el paciente existe
    paciente = db.query(Paciente).filter(Paciente.id == historia_data.paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    
    # Validar que el kinesiólogo existe
    kinesiologo = db.query(Kinesiologo).filter(Kinesiologo.id == historia_data.kinesiologo_id).first()
    if not kinesiologo:
        raise HTTPException(status_code=404, detail="Kinesiólogo no encontrado")
    
    # Crear la historia
    nueva_historia = HistoriaClinica(**historia_data.model_dump())
    
    db.add(nueva_historia)
    db.commit()
    db.refresh(nueva_historia)
    
    # Recargar con relaciones
    historia = (
        db.query(HistoriaClinica)
        .options(
            joinedload(HistoriaClinica.paciente).joinedload(Paciente.user),
            joinedload(HistoriaClinica.kinesiologo).joinedload(Kinesiologo.user)
        )
        .filter(HistoriaClinica.id == nueva_historia.id)
        .first()
    )
    
    return historia


# ==========================================
# ACTUALIZAR HISTORIA CLÍNICA
# ==========================================
@router.put("/{historia_id}", response_model=HistoriaClinicaOut)
def actualizar_historia(
    historia_id: int,
    historia_data: HistoriaClinicaUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar una historia clínica existente"""
    
    historia = db.query(HistoriaClinica).filter(HistoriaClinica.id == historia_id).first()
    
    if not historia:
        raise HTTPException(status_code=404, detail="Historia clínica no encontrada")
    
    # Actualizar solo los campos proporcionados
    update_data = historia_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(historia, field, value)
    
    db.commit()
    db.refresh(historia)
    
    # Recargar con relaciones
    historia = (
        db.query(HistoriaClinica)
        .options(
            joinedload(HistoriaClinica.paciente).joinedload(Paciente.user),
            joinedload(HistoriaClinica.kinesiologo).joinedload(Kinesiologo.user)
        )
        .filter(HistoriaClinica.id == historia_id)
        .first()
    )
    
    return historia


# ==========================================
# ELIMINAR HISTORIA CLÍNICA
# ==========================================
@router.delete("/{historia_id}", status_code=204)
def eliminar_historia(
    historia_id: int,
    db: Session = Depends(get_db)
):
    """Eliminar una historia clínica"""
    
    historia = db.query(HistoriaClinica).filter(HistoriaClinica.id == historia_id).first()
    
    if not historia:
        raise HTTPException(status_code=404, detail="Historia clínica no encontrada")
    
    db.delete(historia)
    db.commit()
    
    return None


# ==========================================
# ESTADÍSTICAS DE UN PACIENTE
# ==========================================
@router.get("/paciente/{paciente_id}/estadisticas")
def obtener_estadisticas_paciente(
    paciente_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtener estadísticas básicas del historial del paciente
    (cantidad de consultas, última consulta, etc.)
    """
    
    paciente = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    
    historias = (
        db.query(HistoriaClinica)
        .filter(HistoriaClinica.paciente_id == paciente_id)
        .order_by(HistoriaClinica.fecha_consulta.desc())
        .all()
    )
    
    if not historias:
        return {
            "total_consultas": 0,
            "ultima_consulta": None,
            "primera_consulta": None
        }
    
    return {
        "total_consultas": len(historias),
        "ultima_consulta": historias[0].fecha_consulta,
        "primera_consulta": historias[-1].fecha_consulta,
        "peso_actual": historias[0].peso if historias[0].peso else None,
        "presion_actual": historias[0].presion_arterial if historias[0].presion_arterial else None
    }
