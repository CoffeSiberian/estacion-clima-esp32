export interface ListaRespuesta<T> {
	respuesta: T[];
}

export interface SensorRead {
	id: string;
	tipo: string;
	fk_estacion: string;
}

export interface RegistroPromedioRead {
	fk_sensor: string;
	sensor_tipo: string;
	estacion_id: string;
	estacion_nombre: string;
	fecha_hora: string;
	temperatura: number;
	humedad: number;
}
