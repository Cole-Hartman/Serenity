'use client'

import { useRouter } from 'next/navigation'
import SerenityParticles from './SerenityParticles'

export default function SerenityPage() {
	const router = useRouter()

	return (
		<main className="relative min-h-screen overflow-hidden">
			{/* Gradient backdrop */}
			<div
				className="fixed inset-0 -z-10"
				style={{
					background:
						'radial-gradient(1200px 800px at 20% 15%, #102b55 0%, #0c2448 40%, #0a1f40 60%, #081a36 100%)',
				}}
			/>
			{/* Subtle second layer for depth */}
			<div
				className="fixed inset-0 -z-10 opacity-60"
				style={{
					background:
						'radial-gradient(900px 600px at 80% 85%, rgba(60,120,255,0.20) 0%, rgba(0,0,0,0) 60%)',
				}}
			/>

			{/* Always-on, slow, playful shapes */}
			<SerenityParticles />

			{/* Navigation Buttons */}
			<div className="absolute top-4 right-4 flex gap-2">
				<button
					onClick={() => router.push('/')}
					className="text-xs text-gray-300 bg-transparent border border-gray-700 px-3 py-1 rounded-md hover:bg-white/10 hover:text-white transition-all duration-200 backdrop-blur-sm"
				>
					Home
				</button>
				<button
					onClick={() => router.push('/dashboard')}
					className="text-xs text-gray-300 bg-transparent border border-gray-700 px-3 py-1 rounded-md hover:bg-white/10 hover:text-white transition-all duration-200 backdrop-blur-sm"
				>
					Dashboard
				</button>
			</div>
		</main>
	)
}

