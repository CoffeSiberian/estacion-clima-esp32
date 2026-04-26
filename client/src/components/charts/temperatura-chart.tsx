import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
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
};

interface TemperaturaChartProps {
	data: RegistroPromedioRead[];
	loading?: boolean;
	title?: string;
	description?: string;
}

export function TemperaturaChart({
	data,
	loading = false,
	title = "Temperatura",
	description,
}: TemperaturaChartProps) {
	const chartData = [...data].reverse().map((r) => ({
		fecha_hora: r.fecha_hora,
		temperatura: Number(Number(r.temperatura).toFixed(2)),
	}));

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
					<Skeleton className="h-48 w-full" />
				) : chartData.length === 0 ? (
					<div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
						Sin datos disponibles
					</div>
				) : (
					<ChartContainer config={chartConfig} className="h-48 w-full">
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
								domain={["auto", "auto"]}
								tick={{ fontSize: 10 }}
								width={36}
								unit="°"
							/>
							<ChartTooltip
								content={
									<ChartTooltipContent
										formatter={(value) => [`${value}°C`, "Temperatura"]}
										labelFormatter={(label) => formatDate(label)}
									/>
								}
							/>
							<Line
								type="monotone"
								dataKey="temperatura"
								stroke="var(--chart-1)"
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

// Re-export recharts primitives used in combined chart
export {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
};
