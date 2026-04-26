import { useState, useEffect, useRef, useCallback } from "react";

interface UseApiState<T> {
	data: T | null;
	loading: boolean;
	error: boolean;
	refresh: () => void;
}

export function useApi<T>(
	fetcher: () => Promise<T>,
	deps: unknown[] = [],
	interval: number = 60_000
): UseApiState<T> {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const fetchData = useCallback(async () => {
		setLoading(true);
		setError(false);
		try {
			const result = await fetcher();
			setData(result);
		} catch {
			setError(true);
		} finally {
			setLoading(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);

	useEffect(() => {
		fetchData();

		timerRef.current = setInterval(fetchData, interval);
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [fetchData, interval]);

	return { data, loading, error, refresh: fetchData };
}
