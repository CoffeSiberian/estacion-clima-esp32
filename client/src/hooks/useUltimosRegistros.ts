import { useApi } from "@/hooks/useApi";
import { getUltimosRegistros } from "@/lib/api";
import type { RegistroPromedioRead } from "@/types/api";

export function useUltimosRegistros() {
	return useApi<RegistroPromedioRead[]>(getUltimosRegistros, []);
}
