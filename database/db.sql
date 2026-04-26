CREATE TABLE ESTACION (
    id CHAR(36) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    ubicacion VARCHAR(255) NOT NULL
);

CREATE TABLE SENSOR (
    id CHAR(36) PRIMARY KEY,
    tipo VARCHAR(255) NOT NULL,
  
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