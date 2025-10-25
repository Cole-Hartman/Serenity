import BrainStressDemo from '../components/brainModel'
import EEGChart from '../components/EEGChart'

export default function DashboardPage() {
	return (
		<main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
			<h1 className="text-2xl font-semibold mb-6">Serenity EEG Dashboard</h1>

			<div className="flex flex-row items-start justify-center gap-8 w-full max-w-6xl">
				<div className="flex-1">
					<EEGChart />
				</div>
				<div className="flex-1 flex items-center justify-center">
					<BrainStressDemo />
				</div>
			</div>
		</main>
	)
}

