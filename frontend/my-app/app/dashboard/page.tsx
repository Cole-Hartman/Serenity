'use client'

import { useRouter } from 'next/navigation'
import EEGChart from '../components/EEGChart'
import EEGBarSummary from '../components/EEGBarSummary'
import EEGMoodRadar from '../components/EEGMoodRadar'
import BrainStressDemo from '../components/brainModel'
import MoodSummaryBox from '../components/MoodSummaryBox'

export default function DashboardPage() {
	const router = useRouter()

	return (
		<main className="h-screen w-screen bg-black text-white flex flex-col items-center overflow-hidden">
			{/* Header */}
			<header className="relative w-full max-w-7xl px-4 pt-4 pb-2 flex flex-col">
				{/* Back to Home Button */}
				<button
					onClick={() => router.push('/')}
					className="absolute top-4 left-4 bg-neutral-900 hover:bg-purple-600 text-gray-300 hover:text-white text-xs px-3 py-1 rounded-md border border-neutral-700 transition-colors"
				>
					← Back to Home
				</button>

				<h1 className="text-3xl font-semibold tracking-tight mb-1 text-center">
					Serenity EEG Dashboard
				</h1>
				<p className="text-gray-400 text-sm text-center">
					Real-time and historical visualization of brainwave activity and inferred mood states.
				</p>
			</header>

			{/* Dashboard Grid */}
			<div
				className="
					w-full max-w-7xl flex-1
					grid grid-cols-3 gap-4
					grid-rows-[minmax(0,55%)_minmax(0,35%)]
					px-4
					overflow-hidden
				"
			>
				{/* Row 1 */}
				<div className="col-span-1 flex">
					<EEGChart />
				</div>
				<div className="col-span-1 flex">
					<EEGBarSummary />
				</div>
				<div className="col-span-1 flex">
					<EEGMoodRadar />
				</div>

				{/* Row 2 */}
				<div className="col-span-1 flex">
					<BrainStressDemo />
				</div>
				<div className="col-span-2 flex">
					<MoodSummaryBox />
				</div>
			</div>

			{/* Footer */}
			<footer className="text-gray-500 text-xs text-center opacity-70 mb-1">
				Serenity EEG Dashboard
			</footer>
		</main>
	)
}
