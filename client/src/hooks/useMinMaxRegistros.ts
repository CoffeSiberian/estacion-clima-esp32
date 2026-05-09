import { useApi } from "@/hooks/useApi";
import { getMinMaxRegistros } from "@/lib/api";
import type { MinMaxRead } from "@/types/api";

export function useMinMaxRegistros() {
	return useApi<MinMaxRead[]>(getMinMaxRegistros, []);
}
