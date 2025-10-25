'use client'

import EEGChart from '../components/EEGChart'
import EEGBarSummary from '../components/EEGBarSummary'
import EEGMoodRadar from '../components/EEGMoodRadar'
import BrainStressDemo from '../components/brainModel'
import MoodSummaryBox from '../components/MoodSummaryBox'

export default function DashboardPage() {
	return (
		<main className="min-h-screen bg-black text-white flex flex-col items-center justify-start p-8">
			{/* Header */}
			<header className="w-full max-w-6xl mb-10">
				<h1 className="text-3xl font-semibold tracking-tight mb-2">
					Serenity EEG Dashboard
				</h1>
				<p className="text-gray-400 text-sm">
					Real-time and historical visualization of brainwave activity and inferred mood states.
				</p>
			</header>

			{/* Top Charts Section */}
			<section className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
				<div className="flex flex-col justify-center">
					<EEGChart />
				</div>
				<div className="flex flex-col justify-center">
					<EEGBarSummary />
				</div>
			</section>

			{/* Mood Radar */}
			<section className="w-full max-w-6xl mb-10">
				<EEGMoodRadar />
				<MoodSummaryBox />
			</section>

			{/* 3D Brain Visualization */}
			<section className="w-full max-w-5xl flex flex-col items-center justify-center mt-4">
				<h2 className="text-xl font-medium mb-4">3D Brain Visualization</h2>
				<div className="w-full h-[500px] bg-neutral-950 rounded-xl p-4 border border-neutral-800 flex items-center justify-center">
					<BrainStressDemo />
				</div>
			</section>

			{/* Footer */}
			<footer className="text-gray-500 text-xs mt-10 mb-4 text-center">
				Data streamed from Supabase • Charts powered by Recharts • Built with Next.js 16
			</footer>
		</main>
	)
}

