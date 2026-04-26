import { useApi } from "@/hooks/useApi";
import { getSensores } from "@/lib/api";
import type { SensorRead } from "@/types/api";

export function useSensores() {
	return useApi<SensorRead[]>(getSensores, []);
}
