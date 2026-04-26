from datetime import datetime
from decimal import Decimal
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ListaRespuesta(BaseModel, Generic[T]):
    respuesta: list[T]


class EstacionCreate(BaseModel):
    nombre: str
    ubicacion: str


class EstacionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    nombre: str
    ubicacion: str


class SensorCreate(BaseModel):
    tipo: str
    fk_estacion: str


class SensorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    tipo: str
    fk_estacion: str


class RegistroCreate(BaseModel):
    temperatura: Decimal
    humedad: Decimal
    fecha_hora: datetime
    fk_sensor: str


class RegistroRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    temperatura: Decimal
    humedad: Decimal
    fecha_hora: datetime
    fk_sensor: str

class RegistroPost(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    temperatura: Decimal
    humedad: Decimal
    fk_sensor: str


class RegistroPromedioRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    fk_sensor: str
    fecha_hora: datetime
    temperatura: Decimal
    humedad: Decimal
