import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
	ChartLegendContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import type { RegistroPromedioRead } from "@/types/api";
import { formatDate, formatTimeTick } from "@/lib/utils";

const chartConfig: ChartConfig = {
	temperatura: {
		label: "Temperatura (°C)",
		color: "var(--chart-1)",
	},
	humedad: {
		label: "Humedad (%)",
		color: "var(--chart-2)",
	},
};

// Group by sensor and get latest reading for overview chart
function buildOverviewData(data: RegistroPromedioRead[]) {
	const byTime = new Map<
		string,
		{ fecha_hora: string; temperatura: number; humedad: number }
	>();

	for (const r of [...data].reverse()) {
		const existing = byTime.get(r.fecha_hora);
		if (!existing) {
			byTime.set(r.fecha_hora, {
				fecha_hora: r.fecha_hora,
				temperatura: Number(Number(r.temperatura).toFixed(2)),
				humedad: Number(Number(r.humedad).toFixed(2)),
			});
		}
	}

	return Array.from(byTime.values());
}

interface CombinedChartProps {
	data: RegistroPromedioRead[];
	loading?: boolean;
	title?: string;
	description?: string;
}

export function CombinedChart({
	data,
	loading = false,
	title = "Temperatura y Humedad",
	description,
}: CombinedChartProps) {
	const chartData = buildOverviewData(data);

	return (
		<Card>
			<CardHeader className="pb-4">
				<CardTitle className="text-base">{title}</CardTitle>
				{description && (
					<CardDescription className="text-xs">{description}</CardDescription>
				)}
			</CardHeader>
			<CardContent>
				{loading ? (
					<Skeleton className="h-56 w-full" />
				) : chartData.length === 0 ? (
					<div className="text-muted-foreground flex h-56 items-center justify-center text-sm">
						Sin datos disponibles
					</div>
				) : (
					<ChartContainer config={chartConfig} className="h-56 w-full">
						<LineChart data={chartData}>
							<CartesianGrid strokeDasharray="3 3" vertical={false} />
							<XAxis
								dataKey="fecha_hora"
								tickFormatter={formatTimeTick}
								tick={{ fontSize: 10 }}
								interval="preserveStartEnd"
								minTickGap={40}
							/>
							<YAxis
								yAxisId="temp"
								orientation="left"
								domain={["auto", "auto"]}
								tick={{ fontSize: 10 }}
								width={36}
								unit="°"
							/>
							<YAxis
								yAxisId="hum"
								orientation="right"
								domain={[0, 100]}
								tick={{ fontSize: 10 }}
								width={36}
								unit="%"
							/>
							<ChartTooltip
								content={
									<ChartTooltipContent
										labelFormatter={(label) => formatDate(label)}
									/>
								}
							/>
							<ChartLegend content={<ChartLegendContent />} />
							<Line
								yAxisId="temp"
								type="monotone"
								dataKey="temperatura"
								stroke="var(--chart-1)"
								strokeWidth={2}
								dot={false}
								activeDot={{ r: 4 }}
							/>
							<Line
								yAxisId="hum"
								type="monotone"
								dataKey="humedad"
								stroke="var(--chart-2)"
								strokeWidth={2}
								dot={false}
								activeDot={{ r: 4 }}
							/>
						</LineChart>
					</ChartContainer>
				)}
			</CardContent>
		</Card>
	);
}
