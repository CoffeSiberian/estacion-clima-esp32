import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const OPTIONS = [
	{ label: "1 día", value: 1 },
	{ label: "3 días", value: 3 },
	{ label: "7 días", value: 7 },
];

interface DaysFilterProps {
	value: number;
	onChange: (days: number) => void;
}

export function DaysFilter({ value, onChange }: DaysFilterProps) {
	return (
		<div className="bg-muted flex gap-1 rounded-lg border p-1">
			{OPTIONS.map((opt) => (
				<Button
					key={opt.value}
					size="sm"
					variant="ghost"
					onClick={() => onChange(opt.value)}
					className={cn(
						"flex-1 text-xs font-medium transition-colors",
						value === opt.value && "bg-background text-foreground shadow-sm"
					)}
				>
					{opt.label}
				</Button>
			))}
		</div>
	);
}
