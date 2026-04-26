import { useApi } from "@/hooks/useApi";
import { getRegistros } from "@/lib/api";
import type { RegistroPromedioRead } from "@/types/api";

export function useRegistros(sensorId?: string, days: number = 7) {
	return useApi<RegistroPromedioRead[]>(
		() => getRegistros(sensorId, days),
		[sensorId, days]
	);
}
