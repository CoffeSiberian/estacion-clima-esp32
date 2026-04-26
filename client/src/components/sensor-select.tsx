import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { SensorRead } from "@/types/api";

interface SensorSelectProps {
	sensores: SensorRead[];
	value: string;
	onChange: (value: string) => void;
	/** Mapa sensorId → nombre de estación para las etiquetas */
	estacionNombres?: Record<string, string>;
}

export function SensorSelect({
	sensores,
	value,
	onChange,
	estacionNombres = {},
}: SensorSelectProps) {
	function label(s: SensorRead): string {
		const estacion = estacionNombres[s.id];
		return estacion ? `${estacion} (${s.tipo})` : s.tipo;
	}

	return (
		<Select value={value} onValueChange={onChange}>
			<SelectTrigger className="w-full sm:w-64">
				<SelectValue placeholder="Todos los sensores" />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value="all">Todos los sensores</SelectItem>
				{sensores.map((s) => (
					<SelectItem key={s.id} value={s.id}>
						{label(s)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
