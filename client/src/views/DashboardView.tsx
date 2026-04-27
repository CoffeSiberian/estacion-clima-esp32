import { useState } from "react";
import { IconRefresh, IconAlertCircle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ReadingCard, ReadingCardSkeleton } from "@/components/reading-card";
import { CombinedChart } from "@/components/charts/combined-chart";
import { SensorSelect } from "@/components/sensor-select";
import { DaysFilter } from "@/components/days-filter";
import { useUltimosRegistros } from "@/hooks/useUltimosRegistros";
import { useRegistros } from "@/hooks/useRegistros";
import { useSensores } from "@/hooks/useSensores";

export function DashboardView() {
	const [chartSensorId, setChartSensorId] = useState<string>("all");
	const [chartDays, setChartDays] = useState<number>(1);

	const {
		data: ultimos,
		loading: loadingUltimos,
		error: errorUltimos,
		refresh: refreshUltimos,
	} = useUltimosRegistros();

	const { data: sensores } = useSensores();

	const activeSensorId = chartSensorId === "all" ? undefined : chartSensorId;

	const { data: registros, loading: loadingRegistros } = useRegistros(
		activeSensorId,
		chartDays
	);

	const estacionNombres: Record<string, string> = Object.fromEntries(
		(ultimos ?? []).map((r) => [r.fk_sensor, r.estacion_nombre])
	);

	const chartDescription = `${chartDays} día${chartDays !== 1 ? "s" : ""} · intervalos de 10 min`;

	return (
		<div className="flex flex-col gap-6">
			{/* Header row */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold">Estado actual</h2>
					<p className="text-muted-foreground text-sm">
						Última lectura por sensor
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={refreshUltimos}
					disabled={loadingUltimos}
					className="gap-1.5"
				>
					<IconRefresh
						className={`size-4 ${loadingUltimos ? "animate-spin" : ""}`}
					/>
					Actualizar
				</Button>
			</div>

			{/* Error state */}
			{errorUltimos && (
				<div className="border-destructive/50 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border px-4 py-3 text-sm">
					<IconAlertCircle className="size-4 shrink-0" />
					No se pudo conectar con el servidor. Reintentando en 60 segundos.
				</div>
			)}

			{/* Reading cards grid */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{loadingUltimos && !ultimos
					? Array.from({ length: 3 }).map((_, i) => (
							<ReadingCardSkeleton key={i} />
						))
					: [...(ultimos ?? [])]
							.sort(
								(a, b) =>
									a.estacion_nombre.localeCompare(b.estacion_nombre) ||
									a.sensor_tipo.localeCompare(b.sensor_tipo)
							)
							.map((r) => <ReadingCard key={r.fk_sensor} registro={r} />)}
			</div>

			{/* Overview chart with filters */}
			<div className="flex flex-col gap-3">
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h3 className="text-sm font-semibold">Resumen general</h3>
						<p className="text-muted-foreground text-xs">
							Temperatura y humedad combinadas
						</p>
					</div>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<SensorSelect
							sensores={sensores ?? []}
							value={chartSensorId}
							onChange={setChartSensorId}
							estacionNombres={estacionNombres}
						/>
						<DaysFilter value={chartDays} onChange={setChartDays} />
					</div>
				</div>
				<CombinedChart
					data={registros ?? []}
					loading={loadingRegistros}
					title="Resumen general"
					description={chartDescription}
				/>
			</div>
		</div>
	);
}
