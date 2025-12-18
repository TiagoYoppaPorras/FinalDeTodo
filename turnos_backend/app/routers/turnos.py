from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from datetime import date, timedelta, datetime, time
from typing import Optional, List
from app.database import get_db

# MODELOS
from app.models.turno import Turno
from app.models.paciente import Paciente
from app.models.kinesiologo import Kinesiologo
from app.models.servicio import Servicio

# SCHEMAS
from app.schemas.turno_schema import TurnoCreate, TurnoUpdate, TurnoOut

router = APIRouter(
    prefix="/turnos",
    tags=["Turnos"]
)

# ─────────────────────────────────────────────
# 🛡️ Validaciones Auxiliares (NUEVO)
# ─────────────────────────────────────────────

def validar_reglas_horarias(fecha_turno: date, hora_inicio: time):
    """
    Centraliza las validaciones de negocio:
    1. No fines de semana.
    2. No horarios fuera de rango (22hs a 08hs).
    3. No fechas pasadas.
    """
    
    # 1. Validar Fines de Semana (Sábado=5, Domingo=6)
    if fecha_turno.weekday() >= 5:
        raise HTTPException(
            status_code=400, 
            detail="No se pueden agendar turnos los fines de semana (Sábados y Domingos)."
        )

    # 2. Validar Rango Horario (08:00 a 22:00)
    # Si es menor a las 8 AM o mayor/igual a las 22 PM
    if hora_inicio < time(8, 0) or hora_inicio >= time(22, 0):
        raise HTTPException(
            status_code=400, 
            detail="El horario de atención es de 08:00 a 22:00 hs."
        )

    # 3. Validar Fecha Pasada
    # Combinamos fecha y hora para comparar con 'ahora'
    ahora = datetime.now()
    turno_datetime = datetime.combine(fecha_turno, hora_inicio)
    
    if turno_datetime < ahora:
        raise HTTPException(
            status_code=400, 
            detail="No se pueden agendar turnos en el pasado."
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
    
    # Si no hay kinesiólogo asignado (solicitud de paciente), no validamos superposición de profesional
    if not turno_data.kinesiologo_id:
        return False

    query = db.query(Turno).filter(
        Turno.kinesiologo_id == turno_data.kinesiologo_id,
        Turno.fecha == turno_data.fecha,
        Turno.hora_inicio < turno_data.hora_fin,
        Turno.hora_fin > turno_data.hora_inicio,
        Turno.estado != "cancelado" # IMPORTANTE: Ignorar turnos cancelados al validar superposición
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

    # 🛑 1. Validaciones Generales (Fin de semana, hora, pasado)
    validar_reglas_horarias(turno.fecha, turno.hora_inicio)

    # 2. Calcular hora_fin si no viene o si es igual a inicio, basándonos en el servicio
    if turno.servicio_id and (not turno.hora_fin or turno.hora_fin == turno.hora_inicio):
        servicio = db.query(Servicio).filter(Servicio.id == turno.servicio_id).first()
        if servicio:
            # Convertir hora_inicio a datetime para sumar minutos
            dummy_date = datetime.combine(date.today(), turno.hora_inicio)
            fin_dt = dummy_date + timedelta(minutes=servicio.duracion_minutos)
            turno.hora_fin = fin_dt.time()
        else:
             # Default fallback si no hay servicio (30 min)
            dummy_date = datetime.combine(date.today(), turno.hora_inicio)
            fin_dt = dummy_date + timedelta(minutes=30)
            turno.hora_fin = fin_dt.time()

    # 🛑 3. Validar superposición (Aquí es donde evitamos sobre turnos por ahora)
    if validar_superposicion(turno, db):
        raise HTTPException(
            status_code=400,
            detail="El turno se superpone con otro existente para este kinesiólogo"
        )

    nuevo_turno = Turno(**turno.model_dump()) 
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

    # 🛑 Si se intenta cambiar fecha u hora, validamos reglas primero
    if turno.fecha or turno.hora_inicio:
        fecha_a_validar = turno.fecha if turno.fecha else turno_existente.fecha
        hora_a_validar = turno.hora_inicio if turno.hora_inicio else turno_existente.hora_inicio
        validar_reglas_horarias(fecha_a_validar, hora_a_validar)

    if turno.fecha and turno.hora_inicio and turno.hora_fin:
        # Aseguramos un ID para validar, si no hay kine nuevo, usamos el existente
        kine_check = turno.kinesiologo_id if turno.kinesiologo_id is not None else turno_existente.kinesiologo_id
        
        temp_turno = TurnoCreate(
            fecha=turno.fecha,
            hora_inicio=turno.hora_inicio,
            hora_fin=turno.hora_fin,
            kinesiologo_id=kine_check,
            paciente_id=turno.paciente_id or turno_existente.paciente_id,
            estado=turno.estado or turno_existente.estado or "pendiente",
            servicio_id=turno_existente.servicio_id # Necesario para el schema aunque no se use en validación
        )

        if validar_superposicion(temp_turno, db, exclude_id=turno_id):
            raise HTTPException(
                status_code=400,
                detail="El turno se superpone con otro existente"
            )

    for field, value in turno.model_dump(exclude_unset=True).items():
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
    nueva_hora_inicio: str, # Recibimos string, lo convertimos dentro
    nueva_hora_fin: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Mover un turno a una nueva fecha/hora (para drag & drop)
    """
    
    turno = db.query(Turno).filter(Turno.id == turno_id).first()
    
    if not turno:
        raise HTTPException(status_code=404, detail="Turno no encontrado")
    
    # Convertir strings de hora a objetos time para validaciones
    try:
        # Intentamos parsear HH:MM o HH:MM:SS
        if len(nueva_hora_inicio) == 5:
            hora_inicio_obj = datetime.strptime(nueva_hora_inicio, "%H:%M").time()
        else:
            hora_inicio_obj = datetime.strptime(nueva_hora_inicio, "%H:%M:%S").time()
            
        if nueva_hora_fin:
            if len(nueva_hora_fin) == 5:
                hora_fin_obj = datetime.strptime(nueva_hora_fin, "%H:%M").time()
            else:
                hora_fin_obj = datetime.strptime(nueva_hora_fin, "%H:%M:%S").time()
        else:
             # Si no viene hora fin, mantenemos la duración original del turno
             duracion_actual = datetime.combine(date.min, turno.hora_fin) - datetime.combine(date.min, turno.hora_inicio)
             hora_fin_obj = (datetime.combine(date.today(), hora_inicio_obj) + duracion_actual).time()

    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de hora inválido")

    # 🛑 1. Validar reglas de negocio (finde, hora, pasado)
    validar_reglas_horarias(nueva_fecha, hora_inicio_obj)

    # 🛑 2. Validar Superposición al mover (Drag & Drop)
    # Creamos un objeto temporal simular un TurnoUpdate
    temp_turno = TurnoCreate(
        fecha=nueva_fecha,
        hora_inicio=hora_inicio_obj,
        hora_fin=hora_fin_obj,
        kinesiologo_id=turno.kinesiologo_id,
        paciente_id=turno.paciente_id,
        servicio_id=turno.servicio_id,
        estado=turno.estado
    )

    if validar_superposicion(temp_turno, db, exclude_id=turno_id):
        raise HTTPException(
            status_code=400, 
            detail="No se puede mover aquí: el horario está ocupado."
        )

    # Actualizar fecha y hora
    turno.fecha = nueva_fecha
    turno.hora_inicio = hora_inicio_obj
    turno.hora_fin = hora_fin_obj
    
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