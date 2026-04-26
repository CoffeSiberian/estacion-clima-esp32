import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardView } from "@/views/DashboardView";
import { HistorialView } from "@/views/HistorialView";
import { IconCloud } from "@tabler/icons-react";

export function App() {
	return (
		<div className="bg-background text-foreground min-h-svh">
			{/* Header */}
			<header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur-sm">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
					<div className="flex items-center gap-2">
						<IconCloud className="text-primary size-5" />
						<span className="font-semibold tracking-tight">Estación Clima</span>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-muted-foreground hidden text-xs sm:block">
							Presiona{" "}
							<kbd className="rounded border px-1 font-mono text-xs">d</kbd>{" "}
							para cambiar tema
						</span>
						<ThemeToggle />
					</div>
				</div>
			</header>

			{/* Main */}
			<main className="mx-auto max-w-5xl px-4 py-6">
				<Tabs defaultValue="dashboard">
					<TabsList className="mb-6 w-full sm:w-auto">
						<TabsTrigger value="dashboard" className="flex-1 sm:flex-none">
							Dashboard
						</TabsTrigger>
						<TabsTrigger value="historial" className="flex-1 sm:flex-none">
							Historial
						</TabsTrigger>
					</TabsList>

					<TabsContent value="dashboard">
						<DashboardView />
					</TabsContent>

					<TabsContent value="historial">
						<HistorialView />
					</TabsContent>
				</Tabs>
			</main>
		</div>
	);
}

export default App;
