from sqlalchemy import Column, Integer, Date, Time, String, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import enum

# 💡 Definición del Enum directamente arriba del modelo
class EstadoTurno(str, enum.Enum):
    pendiente = "pendiente"
    confirmado = "confirmado"
    cancelado = "cancelado"
    finalizado = "finalizado"
    completado = "completado"

class Turno(Base):
    __tablename__ = "turnos"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)
    estado = Column(Enum(EstadoTurno), default=EstadoTurno.pendiente)
    motivo = Column(Text, nullable=True)
    observaciones = Column(Text, nullable=True)

    paciente_id = Column(Integer, ForeignKey("pacientes.id", ondelete="CASCADE"))
    kinesiologo_id = Column(Integer, ForeignKey("kinesiologos.id", ondelete="CASCADE"))
    servicio_id = Column(Integer, ForeignKey("servicios.id", ondelete="CASCADE"))
    sala_id = Column(Integer, ForeignKey("salas.id", ondelete="CASCADE"))

    paciente = relationship("Paciente", back_populates="turnos")
    kinesiologo = relationship("Kinesiologo", back_populates="turnos")
    servicio = relationship("Servicio", back_populates="turnos")
    sala = relationship("Sala", back_populates="turnos")
    historia_clinica = relationship(
        "HistoriaClinica",
        back_populates="turno",
        uselist=False
    )
