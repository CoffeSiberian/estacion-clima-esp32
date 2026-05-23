# estacion-clima-esp32

Estación meteorológica IoT de extremo a extremo. Un ESP32 con sensor de
temperatura/humedad publica lecturas a una API FastAPI, que las persiste en
MySQL y las expone — agregadas y cacheadas — a un dashboard web React.

## Arquitectura

```
┌──────────┐  POST /registros/      ┌─────────────────┐  GET /public/*   ┌───────────────┐
│  ESP32   │  (cada ~10s, header    │  FastAPI + MySQL │  (cacheado 60s,  │  Dashboard    │
│ AHT21 /  │ ─── "pass") ─────────► │  SQLModel        │ ──────────────►  │  React + Vite │
│ AM2302   │  {temp, hum, fk_sensor}│                  │  agregados       │  + recharts   │
└──────────┘                        └─────────────────┘                  └───────────────┘
```

Tres componentes, cada uno en su carpeta:

| Componente | Carpeta   | Rol                                                        |
| ---------- | --------- | ---------------------------------------------------------- |
| Firmware   | `esp32/`  | Lee el sensor y postea lecturas a la API cada 10s.         |
| Backend    | raíz      | API REST, persistencia, agregación y caché.               |
| Cliente    | `client/` | Dashboard web que consume los endpoints públicos.          |

## Stack

- **Backend**: FastAPI 0.136 · SQLModel (SQLAlchemy 2.0) · uvicorn · MySQL
  (`mysql-connector-python`) · bcrypt · python-dotenv.
- **Cliente**: React 19 · Vite · TypeScript · Tailwind CSS 4 · shadcn/ui ·
  Radix UI · recharts.
- **Firmware**: Arduino C++ para ESP32 (`WiFi`, `HTTPClient`, `ArduinoJson`,
  `Adafruit_AHTX0`, `DHT`).
- **Deploy**: Docker (multi-stage) + Docker Compose.

## Estructura

```
.
├── main.py                # App FastAPI; crea tablas al arrancar, registra routers
├── config.py              # INTERVALO_HISTORICO_MINUTOS (intervalo de histórico)
├── routes/
│   ├── route.py           # CRUD privado (estaciones, sensores, registros) — auth
│   └── public.py          # Lecturas públicas agregadas + cacheadas (prefijo /public)
├── database/
│   ├── model.py           # Modelos SQLModel: Estacion, Sensor, Registro
│   ├── schema.py          # Esquemas Pydantic de entrada/salida
│   ├── database.py        # Engine y dependencia get_session
│   └── db.sql             # Esquema canónico (MySQL)
├── utils/
│   ├── auth.py            # Validación de contraseña por header (bcrypt)
│   └── cache.py           # Caché en memoria con TTL de 60s
├── esp32/esp32.ino        # Firmware del microcontrolador
├── client/                # Dashboard React (ver client/)
├── Dockerfile             # Imagen de producción (builder + runner no-root)
└── docker-compose.yml     # Servicio api, expone 2020:8000
```

## Modelo de datos

Tres tablas (ver `database/db.sql` / `database/model.py`), PK UUID `CHAR(36)`:

- **`ESTACION`** — estación física: `nombre`, `ubicacion`.
- **`SENSOR`** — sensor ligado a una estación (`fk_estacion`). Guarda además la
  **última lectura en vivo** (`ultima_temperatura`, `ultima_humedad`,
  `ultima_fecha_hora`), sobrescrita en cada POST.
- **`REGISTRO`** — **histórico** de lecturas (`temperatura`, `humedad`,
  `fecha_hora`, `fk_sensor`). Indexado por `(fk_sensor, fecha_hora)` y `fecha_hora`.

**Lectura en vivo vs. histórico**: el ESP32 postea cada ~10s. Cada POST actualiza
la lectura en vivo del `SENSOR`, pero al histórico `REGISTRO` solo se persiste una
fila cuando pasó `INTERVALO_HISTORICO_MINUTOS` (default 5 min) desde el último
registro. Así los datos "en vivo" son frescos sin inflar el histórico. La
respuesta del POST incluye `historico_guardado: bool`.

## Backend — setup

```bash
# 1. Entorno virtual
python3 -m venv venv
source venv/bin/activate

# 2. Dependencias
pip install -r requirements.txt

# 3. Variables de entorno
cp .env.example .env   # y edita los valores
```

Variables (`.env`):

| Variable                      | Descripción                                            |
| ----------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`                | Cadena MySQL, ej. `mysql+mysqlconnector://user:pass@host:3306/estacion_clima` |
| `HASHED_PASSWORD`             | Hash bcrypt de la contraseña de la API (ver abajo)     |
| `CORS_ORIGINS`                | Orígenes permitidos, separados por coma                |
| `INTERVALO_HISTORICO_MINUTOS` | Minutos entre filas guardadas en `REGISTRO` (default 5)|

Generar el hash bcrypt para `HASHED_PASSWORD`:

```bash
python -c "import bcrypt; print(bcrypt.hashpw(b'tu-contrasena', bcrypt.gensalt()).decode())"
```

Levantar el servidor de desarrollo:

```bash
uvicorn main:app --reload
# o con host/puerto:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Docs interactivas auto-generadas en `/docs` (Swagger) y `/redoc`.

## Endpoints

**Privados** (`routes/route.py`) — requieren header `pass: <contraseña>`:

| Método   | Ruta                            | Descripción                          |
| -------- | ------------------------------- | ------------------------------------ |
| `POST`   | `/estaciones/`                  | Crear estación                       |
| `GET`    | `/estaciones/`                  | Listar estaciones (`skip`, `limit`)  |
| `GET`    | `/estaciones/{id}`              | Obtener estación                     |
| `DELETE` | `/estaciones/{id}`              | Eliminar estación                    |
| `POST`   | `/sensores/`                    | Crear sensor                         |
| `GET`    | `/sensores/`                    | Listar sensores (`estacion_id`)      |
| `GET`    | `/sensores/{id}`                | Obtener sensor                       |
| `DELETE` | `/sensores/{id}`                | Eliminar sensor                      |
| `POST`   | `/registros/`                   | Ingerir lectura (lo usa el ESP32)    |
| `GET`    | `/registros/`                   | Listar registros (`sensor_id`, paginado) |
| `GET`    | `/registros/{id}`               | Obtener registro                     |
| `GET`    | `/sensores/{id}/registros`      | Registros de un sensor               |

**Públicos** (`routes/public.py`, prefijo `/public`) — sin auth, cacheados 60s:

| Método | Ruta                               | Descripción                                       |
| ------ | ---------------------------------- | ------------------------------------------------- |
| `GET`  | `/public/sensores/`                | Listar sensores                                   |
| `GET`  | `/public/registros/`               | Promedios en buckets de 10 min (`sensor_id`, `days`) |
| `GET`  | `/public/registros/ultimos/`       | Última lectura en vivo por sensor                 |
| `GET`  | `/public/registros/minmax/`        | Mín/máx de temperatura en las últimas 24h         |
| `GET`  | `/public/sensores/{id}/registros`  | Promedios de un sensor (`days`)                   |

## Cliente — setup

```bash
cd client
pnpm install
cp .env.example .env   # configura VITE_API_URL y VITE_TIMEZONE
pnpm dev               # servidor de desarrollo (Vite)
pnpm build             # build de producción
```

Variables (`client/.env`):

| Variable        | Descripción                                  |
| --------------- | -------------------------------------------- |
| `VITE_API_URL`  | URL base de la API (ej. `http://localhost:8000`) |
| `VITE_TIMEZONE` | Zona horaria para mostrar fechas (ej. `America/Santiago`) |

El dashboard ofrece vistas de Dashboard e Historial, gráficos combinados de
temperatura/humedad, selector de sensor, filtro de rango de días y tema
claro/oscuro.

## Firmware ESP32

Editar `esp32/esp32.ino` antes de flashear:

- `TIPO_SENSOR` — `1` para AHT21 (I2C, SDA=21/SCL=22) o `2` para AM2302/DHT22
  (`PIN_AM2302`, default pin 4).
- `ssid` / `password` — credenciales WiFi.
- `serverUrl` — endpoint `POST /registros/` de tu API.
- `apiPass` — la contraseña de la API (texto plano; debe coincidir con el hash
  de `HASHED_PASSWORD`).
- `fk_sensor` — UUID del sensor (créalo primero vía `POST /sensores/`).

Librerías Arduino requeridas: `ArduinoJson`, `Adafruit AHTX0`, `DHT sensor
library` (`WiFi`, `HTTPClient`, `Wire` vienen con el core ESP32). El firmware
postea cada 10s, reconecta el WiFi automáticamente y reinicia tras 20 intentos
fallidos.

> ⚠️ No subas credenciales reales (WiFi, `apiPass`) al control de versiones.
> Si ya las commiteaste, rótalas.

## Deploy con Docker

```bash
pnpm web:up        # build + up en segundo plano
pnpm web:logs      # seguir logs de la api
pnpm web:rebuild   # rebuild sin caché
pnpm web:down      # detener
```

El contenedor `estacion-clima-api` expone el puerto **2020 → 8000** y lee la
configuración desde `.env`.
