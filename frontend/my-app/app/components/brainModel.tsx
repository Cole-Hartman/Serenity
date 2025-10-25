'use client'

import { useEffect, useRef } from 'react'

declare global {
	interface Window {
		BrainBrowser: any
	}
}

type RegionMode = 'global' | 'AF7' | 'AF8' | 'TP9' | 'TP10'

export default function BrainStressDemo() {
	const ref = useRef<HTMLDivElement>(null)

	useEffect(() => {
		function loadScript(url: string): Promise<void> {
			return new Promise((resolve, reject) => {
				const s = document.createElement('script')
				s.src = url
				s.async = true
				s.onload = () => resolve()
				s.onerror = () => {
					console.error('Failed to load:', url)
					reject(new Error(`Failed to load ${url}`))
				}
				document.body.appendChild(s)
			})
		}

		; (async () => {
			try {
				await loadScript('/brain/brainbrowser.surface-viewer.min.js')
				const BrainBrowser = window.BrainBrowser
				if (!BrainBrowser?.SurfaceViewer) return

				BrainBrowser.config.set('worker_dir', '/brain/workers/')
				BrainBrowser.config.set('model_types.mniobj.worker', 'mniobj.worker.js')
				BrainBrowser.config.set('intensity_data_types.txt.worker', 'text.intensity.worker.js')

				BrainBrowser.SurfaceViewer.start('brainbrowser-container', (viewer: any) => {
					viewer.render()
					viewer.loadColorMapFromURL('/brain/spectral.txt')
					viewer.loadModelFromURL('/brain/brain-surface.obj', {
						format: 'mniobj',
						complete: () => {
							viewer.loadIntensityDataFromURL('/brain/atlas-values.txt', {
								complete: () => {
									console.log('Brain visualization ready!')
									viewer.autorotate.x = true
									viewer.autorotate.y = true
									viewer.autorotate.z = false
								},
							})
						},
					})
				})
			} catch (e) {
				console.error(e)
			}
		})()
	}, [])

	return (
		<div
			id="brainbrowser-container"
			ref={ref}
			className="w-full h-full rounded-xl border border-neutral-800 overflow-hidden bg-neutral-950"
			style={{
				minHeight: '200px', // prevents collapse
				maxHeight: '100%', // ensures it never overflows its grid cell
			}}
		/>
	)
}

