import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RegistroPromedioRead } from "@/types/api";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const TZ = import.meta.env.VITE_TIMEZONE as string | undefined;
const LOCALE = "es-CL";

/** Ensure the date string is treated as UTC when no offset is present. */
function toUtcDate(dateStr: string): Date {
	// If the string has no timezone info (no Z, no +HH:mm, no -HH:mm), append Z
	const hasOffset = /[Z+-]\d*$/.test(dateStr.trim()) || dateStr.endsWith("Z");
	return new Date(hasOffset ? dateStr : `${dateStr}Z`);
}

export function formatDate(dateStr: string): string {
	return toUtcDate(dateStr).toLocaleString(LOCALE, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		timeZone: TZ,
	});
}

export function formatTimeTick(dateStr: string): string {
	return toUtcDate(dateStr).toLocaleTimeString(LOCALE, {
		hour: "2-digit",
		minute: "2-digit",
		timeZone: TZ,
	});
}

/**
 * Merges readings from multiple sensors by averaging temperatura and humedad
 * for each shared timestamp bucket. Returns points sorted chronologically.
 */
export function mergeByTimestamp(
	data: RegistroPromedioRead[]
): { fecha_hora: string; temperatura: number; humedad: number }[] {
	const buckets = new Map<
		string,
		{ tempSum: number; humSum: number; count: number }
	>();

	for (const r of data) {
		const existing = buckets.get(r.fecha_hora);
		if (existing) {
			existing.tempSum += Number(r.temperatura);
			existing.humSum += Number(r.humedad);
			existing.count += 1;
		} else {
			buckets.set(r.fecha_hora, {
				tempSum: Number(r.temperatura),
				humSum: Number(r.humedad),
				count: 1,
			});
		}
	}

	return Array.from(buckets.entries())
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([fecha_hora, { tempSum, humSum, count }]) => ({
			fecha_hora,
			temperatura: Number((tempSum / count).toFixed(2)),
			humedad: Number((humSum / count).toFixed(2)),
		}));
}
