import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const OPTIONS = [
	{ label: "Hoy (1 día)", value: 1 },
	{ label: "3 días", value: 3 },
	{ label: "1 semana", value: 7 },
	{ label: "2 semanas", value: 14 },
	{ label: "1 mes", value: 30 },
	{ label: "3 meses", value: 90 },
];

interface DaysFilterProps {
	value: number;
	onChange: (days: number) => void;
}

export function DaysFilter({ value, onChange }: DaysFilterProps) {
	return (
		<Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
			<SelectTrigger className="w-40">
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{OPTIONS.map((opt) => (
					<SelectItem key={opt.value} value={String(opt.value)}>
						{opt.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
