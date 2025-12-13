from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Kinesiologo(Base):
    __tablename__ = "kinesiologos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    matricula_profesional = Column(String(50), unique=True, nullable=False)
    especialidad = Column(String(100))

    # 🔗 Relación inversa con User
    user = relationship("User", back_populates="kinesiologo")

    # 🔗 Relación con HorarioKinesiologo
    horarios = relationship("HorarioKinesiologo", back_populates="kinesiologo", cascade="all, delete-orphan")

    # 🔗 Relación con Turnos
    turnos = relationship("Turno", back_populates="kinesiologo", cascade="all, delete-orphan")
