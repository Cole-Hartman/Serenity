'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MoodSummaryBox() {
	const [selected, setSelected] = useState('12h')
	const [response, setResponse] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [isOpen, setIsOpen] = useState(false)

	const timeOptions = ['6h', '12h', '24h', '3d', '7d']

	async function fetchMoodSummary(range: string) {
		setSelected(range)
		setLoading(true)
		setResponse(null)

		try {
			const res = await fetch('/api/mood-summary', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ range }),
			})
			const data = await res.json()
			setResponse(data.text)
		} catch {
			setResponse('Error fetching summary.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
			{/* Compact dashboard box */}
			<div
				onClick={() => response && setIsOpen(true)}
				className="
					w-full bg-neutral-950 rounded-xl p-4 shadow-md border border-neutral-800
					cursor-pointer hover:border-purple-600 transition-colors
				"
			>
				<h2 className="text-lg text-gray-200 mb-3">
					Mood Summary & Recommendations
				</h2>

				{/* Time Range Buttons */}
				<div className="flex flex-wrap gap-2 mb-4">
					{timeOptions.map((opt) => (
						<button
							key={opt}
							onClick={(e) => {
								e.stopPropagation()
								fetchMoodSummary(opt)
							}}
							className={`px-3 py-1 rounded-md text-sm transition-colors ${selected === opt
								? 'bg-purple-600 text-white'
								: 'bg-neutral-800 text-gray-400 hover:bg-neutral-700'
								}`}
						>
							{opt}
						</button>
					))}
				</div>

				{/* Summary preview */}
				<div
					className="
						bg-neutral-900 rounded-lg p-4 min-h-[140px] text-gray-300 overflow-hidden
						prose prose-invert max-w-none flex items-center justify-center
					"
				>
					{/* Animated loading state */}
					{loading && (
						<div className="flex flex-col items-center justify-center space-y-2">
							<div className="flex space-x-1">
								<div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
								<div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
								<div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce" />
							</div>
							<p className="text-sm text-gray-400 mt-2">
								Generating insights from EEG data...
							</p>
						</div>
					)}

					{/* Preview or placeholder */}
					{!loading && response && (
						<p className="line-clamp-4 italic text-gray-300">
							Click to expand full analysis →
						</p>
					)}
					{!loading && !response && (
						<p className="text-gray-500">
							Select a time range to generate insights.
						</p>
					)}
				</div>
			</div>

			{/* Overlay modal */}
			{isOpen && (
				<div
					className="
						fixed inset-0 z-50 flex items-center justify-center
						bg-black/70 backdrop-blur-sm p-6
					"
					onClick={() => setIsOpen(false)}
				>
					<div
						className="
							bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl
							max-w-3xl w-full max-h-[85vh] overflow-y-auto p-8 relative
						"
						onClick={(e) => e.stopPropagation()}
					>
						<button
							onClick={() => setIsOpen(false)}
							className="
								absolute top-3 right-3 text-gray-400 hover:text-white
								text-sm font-medium
							"
						>
							✕
						</button>

						<h2 className="text-xl font-semibold text-white mb-4">
							Mood Summary & Recommendations ({selected})
						</h2>

						{loading && (
							<div className="flex flex-col items-center justify-center py-10 space-y-3">
								<div className="flex space-x-1">
									<div className="w-2.5 h-2.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
									<div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
									<div className="w-2.5 h-2.5 bg-purple-300 rounded-full animate-bounce" />
								</div>
								<p className="text-gray-400 text-sm">
									Generating detailed analysis...
								</p>
							</div>
						)}

						{!loading && response && (
							<ReactMarkdown
								remarkPlugins={[remarkGfm]}
								components={{
									p: ({ children }) => (
										<p className="my-3 leading-relaxed text-gray-200">{children}</p>
									),
									h3: ({ children }) => (
										<h3 className="text-lg font-semibold text-white mt-6 mb-3">
											{children}
										</h3>
									),
									li: ({ children }) => (
										<li className="ml-5 list-disc text-gray-300">{children}</li>
									),
								}}
							>
								{response}
							</ReactMarkdown>
						)}
					</div>
				</div>
			)}
		</>
	)
}

