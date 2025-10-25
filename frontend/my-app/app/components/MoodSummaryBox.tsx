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
		<div className="w-full bg-neutral-950 rounded-xl p-4 shadow-md border border-neutral-800">
			<h2 className="text-lg text-gray-200 mb-3">Mood Summary & Recommendations</h2>

			{/* Time Range Buttons */}
			<div className="flex flex-wrap gap-2 mb-4">
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

			{/* Markdown Output */}
			<div
				className="
          bg-neutral-900 rounded-lg p-6 min-h-[160px] text-gray-200
          prose prose-invert max-w-none
          prose-headings:mt-5 prose-headings:mb-3
          prose-p:my-3 prose-p:leading-relaxed
          prose-li:my-1 prose-ul:list-disc prose-ul:pl-6
        "
			>
				{loading && <p className="text-gray-500">Analyzing EEG data for past {selected}...</p>}

				{!loading && response && (
					<ReactMarkdown remarkPlugins={[remarkGfm]}>
						{response}
					</ReactMarkdown>
				)}

				{!loading && !response && (
					<p className="text-gray-500">Select a time range to generate insights.</p>
				)}
			</div>
		</div>
	)
}

