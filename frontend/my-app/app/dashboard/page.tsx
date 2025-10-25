import BrainStressDemo from '../components/brainModel'
import EEGChart from '../components/EEGChart'

export default function DashboardPage() {
	return (
		<main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
			<h1 className="text-2xl font-semibold mb-6">Serenity EEG Dashboard</h1>
			<EEGChart />
			<BrainStressDemo />
		</main>
	)
}
