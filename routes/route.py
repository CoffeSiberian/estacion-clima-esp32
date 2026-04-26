from typing import Optional
from datetime import datetime, timezone

from utils.auth import validar_contrasena

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from database.database import get_session
from database.model import Estacion, Sensor, Registro
from database.schema import (
    EstacionCreate, EstacionRead,
    SensorCreate, SensorRead,
    RegistroRead, RegistroPost,
    ListaRespuesta
)

router = APIRouter()

#  ESTACION

@router.post("/estaciones/", response_model=EstacionRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(validar_contrasena)])
def create_estacion(estacion: EstacionCreate, session: Session = Depends(get_session)):
    db_estacion = Estacion(**estacion.model_dump())
    session.add(db_estacion)
    session.commit()
    session.refresh(db_estacion)
    return db_estacion

@router.get("/estaciones/", response_model=ListaRespuesta[EstacionRead], dependencies=[Depends(validar_contrasena)])
def list_estaciones(skip: int = 0, limit: int = 100, session: Session = Depends(get_session)):
    return {"respuesta": session.exec(select(Estacion).offset(skip).limit(limit)).all()}

@router.get("/estaciones/{estacion_id}", response_model=EstacionRead, dependencies=[Depends(validar_contrasena)])
def get_estacion(estacion_id: str, session: Session = Depends(get_session)):
    estacion = session.get(Estacion, estacion_id)
    if not estacion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estación no encontrada")
    return estacion

@router.delete("/estaciones/{estacion_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(validar_contrasena)])
def delete_estacion(estacion_id: str, session: Session = Depends(get_session)):
    estacion = session.get(Estacion, estacion_id)
    if not estacion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estación no encontrada")
    session.delete(estacion)
    session.commit()

# SENSOR

@router.post("/sensores/", response_model=SensorRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(validar_contrasena)])
def create_sensor(sensor: SensorCreate, session: Session = Depends(get_session)):
    if not session.get(Estacion, sensor.fk_estacion):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Estación no encontrada")
    db_sensor = Sensor(**sensor.model_dump())
    session.add(db_sensor)
    session.commit()
    session.refresh(db_sensor)
    return db_sensor

@router.get("/sensores/", response_model=ListaRespuesta[SensorRead], dependencies=[Depends(validar_contrasena)])
def list_sensores(estacion_id: Optional[str] = None, session: Session = Depends(get_session)):
    query = select(Sensor)
    if estacion_id:
        query = query.where(Sensor.fk_estacion == estacion_id)
    return {"respuesta": session.exec(query).all()}


@router.get("/sensores/{sensor_id}", response_model=SensorRead, dependencies=[Depends(validar_contrasena)])
def get_sensor(sensor_id: str, session: Session = Depends(get_session)):
    sensor = session.get(Sensor, sensor_id)
    if not sensor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor no encontrado")
    return sensor

@router.delete("/sensores/{sensor_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(validar_contrasena)])
def delete_sensor(sensor_id: str, session: Session = Depends(get_session)):
    sensor = session.get(Sensor, sensor_id)
    if not sensor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor no encontrado")
    session.delete(sensor)
    session.commit()

# REGISTRO

@router.post("/registros/", response_model=RegistroRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(validar_contrasena)])
def create_registro(registro: RegistroPost, session: Session = Depends(get_session)):
    if not session.get(Sensor, registro.fk_sensor):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor no encontrado")

    hora_utc = datetime.now(timezone.utc)
    db_registro = Registro(
        temperatura=registro.temperatura,
        humedad=registro.humedad,
        fecha_hora=hora_utc,
        fk_sensor=registro.fk_sensor
    )
    session.add(db_registro)
    session.commit()
    session.refresh(db_registro)
    return db_registro

@router.get("/registros/", response_model=ListaRespuesta[RegistroRead], dependencies=[Depends(validar_contrasena)])
def list_registros(
    sensor_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session)
):
    query = select(Registro).order_by(Registro.fecha_hora.desc())
    if sensor_id:
        query = query.where(Registro.fk_sensor == sensor_id)
    return {"respuesta": session.exec(query.offset(skip).limit(limit)).all()}

@router.get("/registros/{registro_id}", response_model=RegistroRead, dependencies=[Depends(validar_contrasena)])
def get_registro(registro_id: str, session: Session = Depends(get_session)):
    registro = session.get(Registro, registro_id)
    if not registro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro no encontrado")
    return registro

@router.get("/sensores/{sensor_id}/registros", response_model=ListaRespuesta[RegistroRead], dependencies=[Depends(validar_contrasena)])
def get_registros_by_sensor(
    sensor_id: str,
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
):
    if not session.get(Sensor, sensor_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor no encontrado")
    return {"respuesta": session.exec(
        select(Registro)
        .where(Registro.fk_sensor == sensor_id)
        .order_by(Registro.fecha_hora.desc())
        .offset(skip)
        .limit(limit)
    ).all()}
