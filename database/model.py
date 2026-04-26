import uuid
from datetime import datetime
from decimal import Decimal

from sqlmodel import Field, SQLModel


class Estacion(SQLModel, table=True):
    __tablename__ = "ESTACION"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    nombre: str
    ubicacion: str


class Sensor(SQLModel, table=True):
    __tablename__ = "SENSOR"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    tipo: str
    fk_estacion: str = Field(foreign_key="ESTACION.id")


class Registro(SQLModel, table=True):
    __tablename__ = "REGISTRO"
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    temperatura: Decimal = Field(max_digits=10, decimal_places=2)
    humedad: Decimal = Field(max_digits=10, decimal_places=2)
    fecha_hora: datetime
    fk_sensor: str = Field(foreign_key="SENSOR.id")
