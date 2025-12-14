from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from datetime import date, timedelta, datetime
from typing import Optional, List
from app.database import get_db

# MODELOS
from app.models.turno import Turno
from app.models.paciente import Paciente
from app.models.kinesiologo import Kinesiologo

# SCHEMAS
from app.schemas.turno_schema import TurnoCreate, TurnoUpdate, TurnoOut


router = APIRouter(
    prefix="/turnos",
    tags=["Turnos"]
)

# ─────────────────────────────────────────────
# 🧠 Validar superposición de horarios
# ─────────────────────────────────────────────
def validar_superposicion(
    turno_data: TurnoCreate | TurnoUpdate,
    db: Session,
    exclude_id: Optional[int] = None
) -> bool:
    """Valida si un turno se superpone con otros existentes"""
    query = db.query(Turno).filter(
        Turno.kinesiologo_id == turno_data.kinesiologo_id,
        Turno.fecha == turno_data.fecha,
        Turno.hora_inicio < turno_data.hora_fin,
        Turno.hora_fin > turno_data.hora_inicio
    )

    if exclude_id:
        query = query.filter(Turno.id != exclude_id)

    return query.first() is not None


# ─────────────────────────────────────────────
# ➕ Crear turno
# ─────────────────────────────────────────────
@router.post("/", response_model=TurnoOut, status_code=201)
def crear_turno(turno: TurnoCreate, db: Session = Depends(get_db)):
    """Crear un nuevo turno con validación de superposición"""
    if validar_superposicion(turno, db):
        raise HTTPException(
            status_code=400,
            detail="El turno se superpone con otro existente"
        )

    nuevo_turno = Turno(**turno.dict())
    db.add(nuevo_turno)
    db.commit()
    db.refresh(nuevo_turno)
    return nuevo_turno


# ─────────────────────────────────────────────
# 📋 Listar turnos con filtros y eager loading
# ─────────────────────────────────────────────
@router.get("/", response_model=List[TurnoOut])
def listar_turnos(
    db: Session = Depends(get_db),

    # Filtros
    fecha: Optional[date] = Query(None),
    desde: Optional[date] = Query(None),
    hasta: Optional[date] = Query(None),
    estado: Optional[str] = Query(None),
    kinesiologo_id: Optional[int] = Query(None),
    paciente_id: Optional[int] = Query(None),

    # Paginación
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500)
):
    """
    Obtener lista de turnos con filtros opcionales y eager loading
    """

    query = db.query(Turno).options(
        joinedload(Turno.paciente).joinedload(Paciente.user),
        joinedload(Turno.kinesiologo).joinedload(Kinesiologo.user),
        joinedload(Turno.servicio),
        joinedload(Turno.sala)
    )

    if fecha:
        query = query.filter(Turno.fecha == fecha)
    if desde:
        query = query.filter(Turno.fecha >= desde)
    if hasta:
        query = query.filter(Turno.fecha <= hasta)
    if estado:
        query = query.filter(Turno.estado == estado)
    if kinesiologo_id:
        query = query.filter(Turno.kinesiologo_id == kinesiologo_id)
    if paciente_id:
        query = query.filter(Turno.paciente_id == paciente_id)

    return (
        query
        .order_by(Turno.fecha.asc(), Turno.hora_inicio.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# ─────────────────────────────────────────────
# 📅 Turnos próximos (7 días)
# ─────────────────────────────────────────────
@router.get("/proximos", response_model=List[TurnoOut])
def turnos_proximos(db: Session = Depends(get_db)):
    hoy = date.today()
    hasta = hoy + timedelta(days=7)

    return (
        db.query(Turno)
        .filter(Turno.fecha.between(hoy, hasta))
        .order_by(Turno.fecha.asc(), Turno.hora_inicio.asc())
        .all()
    )


# ─────────────────────────────────────────────
# 🔍 Obtener turno por ID
# ─────────────────────────────────────────────
@router.get("/{turno_id}", response_model=TurnoOut)
def obtener_turno(turno_id: int, db: Session = Depends(get_db)):
    turno = db.query(Turno).filter(Turno.id == turno_id).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    return turno


# ─────────────────────────────────────────────
# ✏️ Actualizar turno
# ─────────────────────────────────────────────
@router.put("/{turno_id}", response_model=TurnoOut)
def actualizar_turno(
    turno_id: int,
    turno: TurnoUpdate,
    db: Session = Depends(get_db)
):
    turno_existente = db.query(Turno).filter(Turno.id == turno_id).first()
    if not turno_existente:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    if turno.fecha and turno.hora_inicio and turno.hora_fin:
        temp_turno = TurnoCreate(
            fecha=turno.fecha,
            hora_inicio=turno.hora_inicio,
            hora_fin=turno.hora_fin,
            kinesiologo_id=turno.kinesiologo_id or turno_existente.kinesiologo_id,
            paciente_id=turno.paciente_id or turno_existente.paciente_id,
            estado=turno.estado or turno_existente.estado
        )

        if validar_superposicion(temp_turno, db, exclude_id=turno_id):
            raise HTTPException(
                status_code=400,
                detail="El turno se superpone con otro existente"
            )

    for field, value in turno.dict(exclude_unset=True).items():
        setattr(turno_existente, field, value)

    db.commit()
    db.refresh(turno_existente)
    return turno_existente


# ─────────────────────────────────────────────
# ⚙️ Cambiar estado
# ─────────────────────────────────────────────
@router.patch("/{turno_id}/estado")
def cambiar_estado(
    turno_id: int,
    estado: str = Query(...),
    db: Session = Depends(get_db)
):
    turno = db.query(Turno).filter(Turno.id == turno_id).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    turno.estado = estado
    db.commit()

    return {
        "message": f"El estado del turno #{turno_id} fue actualizado a '{estado}'."
    }


# ─────────────────────────────────────────────
# ❌ Eliminar turno
# ─────────────────────────────────────────────
@router.delete("/{turno_id}")
def eliminar_turno(turno_id: int, db: Session = Depends(get_db)):
    turno = db.query(Turno).filter(Turno.id == turno_id).first()
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")

    db.delete(turno)
    db.commit()

    return {"message": f"Turno #{turno_id} eliminado correctamente."}


@router.get("/calendario/", response_model=list[TurnoOut])
def obtener_turnos_calendario(
    fecha_inicio: date,
    fecha_fin: date,
    kinesiologo_id: Optional[int] = None,
    sala_id: Optional[int] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Obtener turnos en un rango de fechas para vista de calendario.
    """
    
    # Query base
    query = db.query(Turno).options(
        joinedload(Turno.paciente).joinedload(Paciente.user),
        joinedload(Turno.kinesiologo).joinedload(Kinesiologo.user),
        joinedload(Turno.servicio),
        joinedload(Turno.sala)
    ).filter(
        Turno.fecha >= fecha_inicio,
        Turno.fecha <= fecha_fin
    )
    
    # Filtros opcionales
    if kinesiologo_id:
        query = query.filter(Turno.kinesiologo_id == kinesiologo_id)
    
    if sala_id:
        query = query.filter(Turno.sala_id == sala_id)
    
    if estado:
        query = query.filter(Turno.estado == estado)
    
    # Ordenar por fecha y hora
    turnos = query.order_by(Turno.fecha, Turno.hora_inicio).all()
    
    return turnos


@router.put("/{turno_id}/mover", response_model=TurnoOut)
def mover_turno(
    turno_id: int,
    nueva_fecha: date,
    nueva_hora_inicio: str,
    nueva_hora_fin: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Mover un turno a una nueva fecha/hora (para drag & drop)
    """
    
    turno = db.query(Turno).filter(Turno.id == turno_id).first()
    
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    
    # Actualizar fecha y hora
    turno.fecha = nueva_fecha
    turno.hora_inicio = nueva_hora_inicio
    
    if nueva_hora_fin:
        turno.hora_fin = nueva_hora_fin
    
    db.commit()
    db.refresh(turno)
    
    # Recargar con relaciones
    turno = (
        db.query(Turno)
        .options(
            joinedload(Turno.paciente).joinedload(Paciente.user),
            joinedload(Turno.kinesiologo).joinedload(Kinesiologo.user),
            joinedload(Turno.servicio),
            joinedload(Turno.sala)
        )
        .filter(Turno.id == turno_id)
        .first()
    )
    
    return turno