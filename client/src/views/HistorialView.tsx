import { useState } from "react";
import { IconAlertCircle } from "@tabler/icons-react";
import { SensorSelect } from "@/components/sensor-select";
import { DaysFilter } from "@/components/days-filter";
import { TemperaturaChart } from "@/components/charts/temperatura-chart";
import { HumedadChart } from "@/components/charts/humedad-chart";
import { CombinedChart } from "@/components/charts/combined-chart";
import { useSensores } from "@/hooks/useSensores";
import { useRegistros } from "@/hooks/useRegistros";

export function HistorialView() {
	const [sensorId, setSensorId] = useState<string>("all");
	const [days, setDays] = useState<number>(7);

	const { data: sensores } = useSensores();

	const activeSensorId = sensorId === "all" ? undefined : sensorId;

	const {
		data: registros,
		loading,
		error,
	} = useRegistros(activeSensorId, days);

	const estacionNombres: Record<string, string> = Object.fromEntries(
		(registros ?? []).map((r) => [r.fk_sensor, r.estacion_nombre])
	);

	const selectedSensor = sensores?.find((s) => s.id === sensorId);
	const selectedEstacion =
		sensorId !== "all" ? estacionNombres[sensorId] : undefined;
	const chartDescription = `${days} día${days !== 1 ? "s" : ""} · intervalos de 10 min${
		selectedEstacion
			? ` · ${selectedEstacion}${selectedSensor ? ` (${selectedSensor.tipo})` : ""}`
			: ""
	}`;

	return (
		<div className="flex flex-col gap-6">
			{/* Filters */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg font-semibold">Historial</h2>
					<p className="text-muted-foreground text-sm">
						Datos históricos por sensor
					</p>
				</div>
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					<SensorSelect
						sensores={sensores ?? []}
						value={sensorId}
						onChange={setSensorId}
						estacionNombres={estacionNombres}
					/>
					<DaysFilter value={days} onChange={setDays} />
				</div>
			</div>

			{/* Error */}
			{error && (
				<div className="border-destructive/50 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border px-4 py-3 text-sm">
					<IconAlertCircle className="size-4 shrink-0" />
					No se pudo cargar el historial. Reintentando en 60 segundos.
				</div>
			)}

			{/* Charts */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<TemperaturaChart
					data={registros ?? []}
					loading={loading}
					title="Temperatura"
					description={chartDescription}
				/>
				<HumedadChart
					data={registros ?? []}
					loading={loading}
					title="Humedad"
					description={chartDescription}
				/>
			</div>

			<CombinedChart
				data={registros ?? []}
				loading={loading}
				title="Temperatura y Humedad combinadas"
				description={chartDescription}
			/>
		</div>
	);
}
