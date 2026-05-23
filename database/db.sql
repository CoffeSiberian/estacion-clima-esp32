CREATE TABLE ESTACION (
    id CHAR(36) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    ubicacion VARCHAR(255) NOT NULL
);

CREATE TABLE SENSOR (
    id CHAR(36) PRIMARY KEY,
    tipo VARCHAR(255) NOT NULL,

    -- Última lectura en vivo (sobrescrita en cada post desde el ESP32)
    ultima_temperatura DECIMAL(10, 2) NULL,
    ultima_humedad DECIMAL(10, 2) NULL,
    ultima_fecha_hora DATETIME NULL,

    fk_estacion CHAR(36),
    FOREIGN KEY (fk_estacion) REFERENCES ESTACION(id)
);

CREATE TABLE REGISTRO (
    id CHAR(36) PRIMARY KEY,
    temperatura DECIMAL(10, 2) NOT NULL,
    humedad DECIMAL(10, 2) NOT NULL,
    fecha_hora DATETIME NOT NULL,

    fk_sensor CHAR(36),
    FOREIGN KEY (fk_sensor) REFERENCES SENSOR(id)
);

CREATE INDEX idx_registro_sensor_fecha ON REGISTRO (fk_sensor, fecha_hora);
CREATE INDEX idx_registro_fecha ON REGISTRO (fecha_hora);
