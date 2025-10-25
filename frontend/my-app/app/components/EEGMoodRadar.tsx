'use client'

import React, { useEffect, useState } from 'react'
import {
	Radar,
	RadarChart,
	PolarGrid,
	PolarAngleAxis,
	PolarRadiusAxis,
	Tooltip,
	ResponsiveContainer,
} from 'recharts'
import { supabase } from '@/lib/supabaseClient'

interface MoodData {
	mood: string
	value: number
}

export default function EEGMoodRadar() {
	const [data, setData] = useState<MoodData[]>([])
	const [visibleDays, setVisibleDays] = useState(1) // number of days to look back

	useEffect(() => {
		const fetchData = async () => {
			const now = new Date()
			const start = new Date(now)
			start.setDate(now.getDate() - visibleDays)

			const { data: rows, error } = await supabase
				.from('brain_data')
				.select('alpha,beta,beta_alpha_ratio,created_at')
				.gte('created_at', start.toISOString())
				.order('created_at', { ascending: true })

			if (error || !rows?.length) {
				console.error('Supabase error:', error)
				setData([])
				return
			}

			// Categorize data into mood buckets
			const moodBuckets = {
				Relaxed: [] as number[],
				Focused: [] as number[],
				Alert: [] as number[],
				Stressed: [] as number[],
				Anxious: [] as number[],
			}

			rows.forEach((r) => {
				const ratio = r.beta_alpha_ratio ?? 0
				if (ratio < 0.8) moodBuckets.Relaxed.push(ratio)
				else if (ratio < 1.1) moodBuckets.Focused.push(ratio)
				else if (ratio < 1.4) moodBuckets.Alert.push(ratio)
				else if (ratio < 1.8) moodBuckets.Stressed.push(ratio)
				else moodBuckets.Anxious.push(ratio)
			})

			// Compute average ratio intensity per mood
			const chartData: MoodData[] = Object.entries(moodBuckets).map(
				([mood, arr]) => ({
					mood,
					value: arr.length
						? (arr.reduce((a, b) => a + b, 0) / arr.length) * 100
						: 0,
				})
			)

			setData(chartData)
		}

		fetchData()
	}, [visibleDays])

	return (
		<div className="w-full bg-neutral-950 rounded-xl p-4 shadow-md border border-neutral-800 flex flex-col items-center">
			<h2 className="text-lg text-gray-200 mb-4">
				Mood Distribution Radar (Past {visibleDays} Day{visibleDays > 1 ? 's' : ''})
			</h2>

			<ResponsiveContainer width="100%" height={400}>
				<RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
					<PolarGrid stroke="#333" />
					<PolarAngleAxis dataKey="mood" tick={{ fill: '#aaa', fontSize: 12 }} />
					<PolarRadiusAxis angle={30} domain={[0, 250]} tick={{ fill: '#666' }} />
					<Tooltip
						contentStyle={{
							backgroundColor: '#111',
							border: 'none',
							color: '#eee',
						}}
						formatter={(v: number) => v.toFixed(2)}
					/>
					<Radar
						name="Mood Intensity"
						dataKey="value"
						stroke="#7b61ff"
						fill="#7b61ff"
						fillOpacity={0.5}
					/>
				</RadarChart>
			</ResponsiveContainer>

			{/* Slider control */}
			<div className="flex flex-col items-center mt-6 text-gray-300">
				<label className="mb-2 text-sm">
					Visible Data Window: {visibleDays} day{visibleDays > 1 ? 's' : ''}
				</label>
				<input
					type="range"
					min="1"
					max="30"
					step="1"
					value={visibleDays}
					onChange={(e) => setVisibleDays(Number(e.target.value))}
					className="w-2/3 accent-purple-500"
				/>
				<p className="text-xs text-gray-500 mt-2">
					Adjusts how many past days of EEG data are analyzed for mood distribution.
				</p>
			</div>
		</div>
	)
}

