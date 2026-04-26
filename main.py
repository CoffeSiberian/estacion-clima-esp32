from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlmodel import SQLModel

from database.database import engine
from routes.route import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    yield


app = FastAPI(title="Estación Clima ESP32", version="0.1.0", lifespan=lifespan)
app.include_router(router)
