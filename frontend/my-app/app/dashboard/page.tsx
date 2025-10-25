'use client'

import EEGChart from '../components/EEGChart'
import EEGBarSummary from '../components/EEGBarSummary'
import EEGMoodRadar from '../components/EEGMoodRadar'
import BrainStressDemo from '../components/brainModel'
import MoodSummaryBox from '../components/MoodSummaryBox'

export default function DashboardPage() {
	return (
		<main className="h-screen w-screen bg-black text-white flex flex-col items-center overflow-hidden">
			{/* Header */}
			<header className="w-full max-w-7xl px-4 pt-4 pb-2">
				<h1 className="text-3xl font-semibold tracking-tight mb-1">
					Serenity EEG Dashboard
				</h1>
				<p className="text-gray-400 text-sm">
					Real-time and historical visualization of brainwave activity and inferred mood states.
				</p>
			</header>

			{/* Dashboard Grid */}
			<div
				className="
					w-full max-w-7xl flex-1
					grid grid-cols-3 gap-4
					grid-rows-[minmax(0,55%)_minmax(0,35%)]
					px-4 pb-2
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
				Data streamed from Supabase • Charts powered by Recharts • Built with Next.js 16
			</footer>
		</main>
	)
}

