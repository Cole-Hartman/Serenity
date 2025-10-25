'use client'

import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MoodSummaryBox() {
	const [selected, setSelected] = useState('12h')
	const [response, setResponse] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

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
		<div className="w-full h-full bg-neutral-950 rounded-xl p-4 shadow-md border border-neutral-800 flex flex-col">
			<h2 className="text-lg text-gray-200 mb-3">Mood Summary & Recommendations</h2>

			{/* Time Range Buttons */}
			<div className="flex flex-wrap gap-2 mb-3">
				{timeOptions.map((opt) => (
					<button
						key={opt}
						onClick={() => fetchMoodSummary(opt)}
						className={`px-3 py-1 rounded-md text-sm transition-colors ${selected === opt
							? 'bg-purple-600 text-white'
							: 'bg-neutral-800 text-gray-400 hover:bg-neutral-700'
							}`}
					>
						{opt}
					</button>
				))}
			</div>

			{/* Scrollable Markdown Output */}
			<div
				className="
					flex-1 overflow-y-auto rounded-lg bg-neutral-900 p-5
					text-gray-200 border border-neutral-800 custom-scroll
					prose prose-invert max-w-none
					prose-headings:mt-4 prose-headings:mb-2
					prose-p:my-2 prose-p:leading-relaxed
					prose-ul:pl-6 prose-li:my-1
				"
			>
				{loading && (
					<p className="text-gray-500">
						Analyzing EEG data for past {selected}...
					</p>
				)}

				{!loading && response && (
					<ReactMarkdown remarkPlugins={[remarkGfm]}>
						{response}
					</ReactMarkdown>
				)}

				{!loading && !response && (
					<p className="text-gray-500">
						Select a time range to generate insights.
					</p>
				)}
			</div>
		</div>
	)
}

