from typing import Optional
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlmodel import Session, select

from database.database import get_session
from database.model import Estacion, Sensor, Registro
from database.schema import SensorRead, RegistroPromedioRead, ListaRespuesta
import utils.cache as cache

router = APIRouter()

# SENSORES

@router.get("/sensores/", response_model=ListaRespuesta[SensorRead])
def list_sensores_public(session: Session = Depends(get_session)):
    key = "pub:sensores"
    cached = cache.get(key)

    if cached is not None:
        return {"respuesta": cached}
    
    sensores = session.exec(select(Sensor)).all()
    data = [s.model_dump() for s in sensores]
    cache.set(key, data)

    return {"respuesta": data}

# REGISTROS

@router.get("/registros/", response_model=ListaRespuesta[RegistroPromedioRead])
def list_registros_public(
    sensor_id: Optional[str] = None,
    days: int = Query(default=7, ge=1, le=7),
    session: Session = Depends(get_session),
):
    key = f"pub:registros:{sensor_id}:{days}"
    cached = cache.get(key)

    if cached is not None:
        return {"respuesta": cached}

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    bucket = func.from_unixtime(
        func.floor(func.unix_timestamp(Registro.fecha_hora) / 600) * 600
    ).label("fecha_hora")

    stmt = (
        select(
            Registro.fk_sensor,
            Sensor.tipo.label("sensor_tipo"),
            Estacion.id.label("estacion_id"),
            Estacion.nombre.label("estacion_nombre"),
            bucket,
            func.avg(Registro.temperatura).label("temperatura"),
            func.avg(Registro.humedad).label("humedad"),
        )
        .join(Sensor, Registro.fk_sensor == Sensor.id)
        .join(Estacion, Sensor.fk_estacion == Estacion.id)
        .where(Registro.fecha_hora >= cutoff)
        .group_by(Registro.fk_sensor, Sensor.tipo, Estacion.id, Estacion.nombre, bucket)
        .order_by(bucket.desc())
    )
    if sensor_id:
        stmt = stmt.where(Registro.fk_sensor == sensor_id)

    rows = session.execute(stmt).all()
    data = [
        {
            "fk_sensor": r.fk_sensor,
            "sensor_tipo": r.sensor_tipo,
            "estacion_id": r.estacion_id,
            "estacion_nombre": r.estacion_nombre,
            "fecha_hora": r.fecha_hora,
            "temperatura": r.temperatura,
            "humedad": r.humedad,
        }
        for r in rows
    ]
    cache.set(key, data)

    return {"respuesta": data}

@router.get("/sensores/{sensor_id}/registros", response_model=ListaRespuesta[RegistroPromedioRead])
def get_registros_sensor_public(
    sensor_id: str,
    days: int = Query(default=7, ge=1, le=7),
    session: Session = Depends(get_session),
):
    if not session.get(Sensor, sensor_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor no encontrado")

    key = f"pub:sensor:{sensor_id}:registros:{days}"
    cached = cache.get(key)
    if cached is not None:
        return {"respuesta": cached}

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    bucket = func.from_unixtime(
        func.floor(func.unix_timestamp(Registro.fecha_hora) / 600) * 600
    ).label("fecha_hora")

    rows = session.execute(
        select(
            Registro.fk_sensor,
            Sensor.tipo.label("sensor_tipo"),
            Estacion.id.label("estacion_id"),
            Estacion.nombre.label("estacion_nombre"),
            bucket,
            func.avg(Registro.temperatura).label("temperatura"),
            func.avg(Registro.humedad).label("humedad"),
        )
        .join(Sensor, Registro.fk_sensor == Sensor.id)
        .join(Estacion, Sensor.fk_estacion == Estacion.id)
        .where(Registro.fecha_hora >= cutoff, Registro.fk_sensor == sensor_id)
        .group_by(Registro.fk_sensor, Sensor.tipo, Estacion.id, Estacion.nombre, bucket)
        .order_by(bucket.desc())
    ).all()
    data = [
        {
            "fk_sensor": r.fk_sensor,
            "sensor_tipo": r.sensor_tipo,
            "estacion_id": r.estacion_id,
            "estacion_nombre": r.estacion_nombre,
            "fecha_hora": r.fecha_hora,
            "temperatura": r.temperatura,
            "humedad": r.humedad,
        }
        for r in rows
    ]
    cache.set(key, data)

    return {"respuesta": data}
