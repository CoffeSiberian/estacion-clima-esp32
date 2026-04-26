import { dataGet } from "@/lib/dataFetch";
import type {
	ListaRespuesta,
	SensorRead,
	RegistroPromedioRead,
} from "@/types/api";

const BASE_URL = import.meta.env.VITE_API_URL as string;

async function parseJson<T>(res: Response | null): Promise<T | null> {
	if (!res || !res.ok) return null;
	return res.json() as Promise<T>;
}

export async function getSensores(): Promise<SensorRead[]> {
	const res = await dataGet(undefined, `${BASE_URL}/public/sensores/`);
	const data = await parseJson<ListaRespuesta<SensorRead>>(res);
	return data?.respuesta ?? [];
}

export async function getRegistros(
	sensorId?: string,
	days: number = 7
): Promise<RegistroPromedioRead[]> {
	const params = new URLSearchParams();
	if (sensorId) params.set("sensor_id", sensorId);
	params.set("days", String(days));
	const res = await dataGet(
		undefined,
		`${BASE_URL}/public/registros/?${params}`
	);
	const data = await parseJson<ListaRespuesta<RegistroPromedioRead>>(res);
	return data?.respuesta ?? [];
}

export async function getUltimosRegistros(): Promise<RegistroPromedioRead[]> {
	const res = await dataGet(undefined, `${BASE_URL}/public/registros/ultimos/`);
	const data = await parseJson<ListaRespuesta<RegistroPromedioRead>>(res);
	return data?.respuesta ?? [];
}

export async function getRegistrosSensor(
	sensorId: string,
	days: number = 7
): Promise<RegistroPromedioRead[]> {
	const params = new URLSearchParams({ days: String(days) });
	const res = await dataGet(
		undefined,
		`${BASE_URL}/public/sensores/${encodeURIComponent(sensorId)}/registros?${params}`
	);
	const data = await parseJson<ListaRespuesta<RegistroPromedioRead>>(res);
	return data?.respuesta ?? [];
}
