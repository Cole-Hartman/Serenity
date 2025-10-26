'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Howl, Howler } from 'howler'
import SerenityParticles from './SerenityParticles'

const audioSrc = '/audio/528HZ.mp3'

export default function SerenityPage() {
	const router = useRouter()
	const [hasPlayed, setHasPlayed] = useState(false)
	const soundRef = useRef<Howl | null>(null)

	// Start the sound ONLY after a guaranteed click gesture
	const startPlayback = () => {
		if (hasPlayed) return
		if (!soundRef.current) {
			// Create the Howl object after user gesture
			soundRef.current = new Howl({
				src: [audioSrc],
				loop: true,
				volume: 0.4,
				html5: true,
				autoplay: false,
			})
		}

		const sound = soundRef.current
		if (sound.playing()) return

		// Unlock AudioContext
		Howler.ctx.resume().then(() => {
			sound.play()
			sound.fade(0, 0.4, 1500)
			setHasPlayed(true)
		})
	}

	// Cleanup when actually leaving the page
	useEffect(() => {
		return () => {
			const sound = soundRef.current
			if (sound && sound.playing()) {
				sound.fade(0.4, 0, 1000)
				setTimeout(() => Howler.stop(), 1100)
			}
		}
	}, [])

	const handleNavigate = (path: string) => {
		const sound = soundRef.current
		if (sound && sound.playing()) {
			sound.fade(0.4, 0, 1000)
			setTimeout(() => {
				Howler.stop()
				router.push(path)
			}, 1100)
		} else {
			router.push(path)
		}
	}

	return (
		<main
			onClick={startPlayback}
			className="relative min-h-screen overflow-hidden flex items-center justify-center cursor-pointer"
		>
			{/* Gradient Layers */}
			<div
				className="fixed inset-0 -z-10"
				style={{
					background:
						'radial-gradient(1200px 800px at 20% 15%, #102b55 0%, #0c2448 40%, #0a1f40 60%, #081a36 100%)',
				}}
			/>
			<div
				className="fixed inset-0 -z-10 opacity-60"
				style={{
					background:
						'radial-gradient(900px 600px at 80% 85%, rgba(60,120,255,0.20) 0%, rgba(0,0,0,0) 60%)',
				}}
			/>

			<SerenityParticles />

			{!hasPlayed && (
				<div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
					<p className="text-gray-300 text-sm animate-pulse">
						Click anywhere to begin Serenity Mode 🌙
					</p>
				</div>
			)}

			{/* Navigation */}
			<div className="absolute top-4 right-4 flex gap-2">
				<button
					onClick={(e) => {
						e.stopPropagation()
						handleNavigate('/')
					}}
					className="text-xs text-gray-300 bg-transparent border border-gray-700 px-3 py-1 rounded-md hover:bg-white/10 hover:text-white transition-all duration-200 backdrop-blur-sm"
				>
					Home
				</button>
				<button
					onClick={(e) => {
						e.stopPropagation()
						handleNavigate('/dashboard')
					}}
					className="text-xs text-gray-300 bg-transparent border border-gray-700 px-3 py-1 rounded-md hover:bg-white/10 hover:text-white transition-all duration-200 backdrop-blur-sm"
				>
					Dashboard
				</button>
			</div>
		</main>
	)
}

