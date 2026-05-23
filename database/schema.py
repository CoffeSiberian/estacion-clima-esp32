from datetime import datetime
from decimal import Decimal
from typing import Generic, Optional, TypeVar

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
    ultima_temperatura: Optional[Decimal] = None
    ultima_humedad: Optional[Decimal] = None
    ultima_fecha_hora: Optional[datetime] = None


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


class RegistroPostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    fk_sensor: str
    temperatura: Decimal
    humedad: Decimal
    fecha_hora: datetime
    historico_guardado: bool


class RegistroPromedioRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    fk_sensor: str
    sensor_tipo: str
    estacion_id: str
    estacion_nombre: str
    fecha_hora: datetime
    temperatura: Decimal
    humedad: Decimal


class MinMaxRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    fk_sensor: str
    sensor_tipo: str
    estacion_id: str
    estacion_nombre: str
    temp_min: Decimal
    temp_min_hora: datetime
    temp_max: Decimal
    temp_max_hora: datetime
