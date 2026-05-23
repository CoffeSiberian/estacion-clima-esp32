from typing import Optional
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlmodel import Session, select

from database.database import get_session
from database.model import Estacion, Sensor, Registro
from database.schema import SensorRead, RegistroPromedioRead, MinMaxRead, ListaRespuesta
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
    days: int = Query(default=7, ge=1, le=365),
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

@router.get("/registros/ultimos/", response_model=ListaRespuesta[RegistroPromedioRead])
def get_ultimos_registros_public(session: Session = Depends(get_session)):
    key = "pub:registros:ultimos"
    cached = cache.get(key)
    if cached is not None:
        return {"respuesta": cached}

    # Live real: leer la última lectura desde SENSOR (actualizada cada ~10s),
    # no el último histórico de REGISTRO (que solo se escribe cada 5 min).
    rows = session.execute(
        select(
            Sensor.id.label("fk_sensor"),
            Sensor.tipo.label("sensor_tipo"),
            Estacion.id.label("estacion_id"),
            Estacion.nombre.label("estacion_nombre"),
            Sensor.ultima_fecha_hora.label("fecha_hora"),
            Sensor.ultima_temperatura.label("temperatura"),
            Sensor.ultima_humedad.label("humedad"),
        )
        .join(Estacion, Sensor.fk_estacion == Estacion.id)
        .where(Sensor.ultima_fecha_hora.is_not(None))  # omitir sensores sin lectura aún
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


@router.get("/registros/minmax/", response_model=ListaRespuesta[MinMaxRead])
def get_minmax_registros_public(session: Session = Depends(get_session)):
    key = "pub:registros:minmax"
    cached = cache.get(key)
    if cached is not None:
        return {"respuesta": cached}

    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)

    min_subq = (
        select(Registro.fk_sensor, func.min(Registro.temperatura).label("min_temp"))
        .where(Registro.fecha_hora >= cutoff)
        .group_by(Registro.fk_sensor)
        .subquery()
    )
    min_rows = session.execute(
        select(Registro.fk_sensor, Registro.temperatura, func.min(Registro.fecha_hora).label("hora"))
        .join(min_subq, (Registro.fk_sensor == min_subq.c.fk_sensor) & (Registro.temperatura == min_subq.c.min_temp))
        .where(Registro.fecha_hora >= cutoff)
        .group_by(Registro.fk_sensor, Registro.temperatura)
    ).all()
    min_by_sensor = {r.fk_sensor: (r.temperatura, r.hora) for r in min_rows}

    max_subq = (
        select(Registro.fk_sensor, func.max(Registro.temperatura).label("max_temp"))
        .where(Registro.fecha_hora >= cutoff)
        .group_by(Registro.fk_sensor)
        .subquery()
    )
    max_rows = session.execute(
        select(Registro.fk_sensor, Registro.temperatura, func.min(Registro.fecha_hora).label("hora"))
        .join(max_subq, (Registro.fk_sensor == max_subq.c.fk_sensor) & (Registro.temperatura == max_subq.c.max_temp))
        .where(Registro.fecha_hora >= cutoff)
        .group_by(Registro.fk_sensor, Registro.temperatura)
    ).all()
    max_by_sensor = {r.fk_sensor: (r.temperatura, r.hora) for r in max_rows}

    sensor_rows = session.execute(
        select(Sensor.id, Sensor.tipo, Estacion.id.label("estacion_id"), Estacion.nombre.label("estacion_nombre"))
        .join(Estacion, Sensor.fk_estacion == Estacion.id)
        .where(Sensor.id.in_(list(min_by_sensor.keys())))
    ).all()

    data = []
    for s in sensor_rows:
        if s.id not in min_by_sensor or s.id not in max_by_sensor:
            continue
        min_temp, min_hora = min_by_sensor[s.id]
        max_temp, max_hora = max_by_sensor[s.id]
        data.append({
            "fk_sensor": s.id,
            "sensor_tipo": s.tipo,
            "estacion_id": s.estacion_id,
            "estacion_nombre": s.estacion_nombre,
            "temp_min": min_temp,
            "temp_min_hora": min_hora,
            "temp_max": max_temp,
            "temp_max_hora": max_hora,
        })
    cache.set(key, data)
    return {"respuesta": data}


@router.get("/sensores/{sensor_id}/registros", response_model=ListaRespuesta[RegistroPromedioRead])
def get_registros_sensor_public(
    sensor_id: str,
    days: int = Query(default=7, ge=1, le=365),
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
