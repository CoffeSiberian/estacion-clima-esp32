import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
