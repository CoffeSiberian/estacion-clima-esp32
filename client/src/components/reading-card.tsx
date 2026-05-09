import { Skeleton } from "@/components/ui/skeleton";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	IconTemperature,
	IconDroplet,
	IconMapPin,
	IconArrowDown,
	IconArrowUp,
} from "@tabler/icons-react";
import type { RegistroPromedioRead, MinMaxRead } from "@/types/api";
import { formatDate, formatTimeTick } from "@/lib/utils";

interface ReadingCardProps {
	registro: RegistroPromedioRead;
	minMax?: MinMaxRead;
}

export function ReadingCard({ registro, minMax }: ReadingCardProps) {
	const temp = Number(registro.temperatura).toFixed(1);
	const hum = Number(registro.humedad).toFixed(1);

	return (
		<Card className="flex flex-col gap-2">
			<CardHeader className="pb-2">
				<div className="flex items-start justify-between gap-2">
					<CardTitle className="text-base leading-tight">
						{registro.estacion_nombre}
					</CardTitle>
					<Badge variant="secondary" className="shrink-0 text-xs">
						{registro.sensor_tipo}
					</Badge>
				</div>
				<CardDescription className="flex items-center gap-1 text-xs">
					<IconMapPin className="size-3" />
					{formatDate(registro.fecha_hora)}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				<div className="grid grid-cols-2 gap-3">
					<div className="flex flex-col gap-1">
						<span className="text-muted-foreground flex items-center gap-1 text-xs">
							<IconTemperature className="size-3.5" />
							Temperatura
						</span>
						<span className="text-2xl font-bold tabular-nums">{temp}°C</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-muted-foreground flex items-center gap-1 text-xs">
							<IconDroplet className="size-3.5" />
							Humedad
						</span>
						<span className="text-2xl font-bold tabular-nums">{hum}%</span>
					</div>
				</div>
				{minMax && (
					<>
						<div className="border-t" />
						<div className="mx-4 flex justify-between gap-3">
							<div className="flex flex-col gap-0.5">
								<span className="text-muted-foreground flex items-center gap-1 text-xs">
									<IconArrowDown className="size-3.5 text-blue-500" />
									Mín 24h
								</span>
								<span className="text-sm font-semibold tabular-nums">
									{Number(minMax.temp_min).toFixed(1)}°C
								</span>
								<span className="text-muted-foreground text-xs tabular-nums">
									{formatTimeTick(minMax.temp_min_hora)}
								</span>
							</div>
							<div className="flex flex-col gap-0.5">
								<span className="text-muted-foreground flex items-center gap-1 text-xs">
									<IconArrowUp className="size-3.5 text-red-500" />
									Máx 24h
								</span>
								<span className="text-sm font-semibold tabular-nums">
									{Number(minMax.temp_max).toFixed(1)}°C
								</span>
								<span className="text-muted-foreground text-xs tabular-nums">
									{formatTimeTick(minMax.temp_max_hora)}
								</span>
							</div>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}

export function ReadingCardSkeleton() {
	return (
		<Card className="flex flex-col gap-2">
			<CardHeader className="pb-2">
				<Skeleton className="h-5 w-3/4" />
				<Skeleton className="h-3 w-1/2" />
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				<div className="grid grid-cols-2 gap-3">
					<div className="flex flex-col gap-1">
						<Skeleton className="h-3 w-16" />
						<Skeleton className="h-8 w-20" />
					</div>
					<div className="flex flex-col gap-1">
						<Skeleton className="h-3 w-16" />
						<Skeleton className="h-8 w-20" />
					</div>
				</div>
				<div className="border-t" />
				<div className="grid grid-cols-2 gap-3">
					<div className="flex flex-col gap-0.5">
						<Skeleton className="h-3 w-14" />
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-3 w-10" />
					</div>
					<div className="flex flex-col gap-0.5">
						<Skeleton className="h-3 w-14" />
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-3 w-10" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
