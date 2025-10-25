'use client'

import React, { useEffect, useState } from 'react'
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from 'recharts'
import { supabase } from '@/lib/supabaseClient'

interface EEGSample {
	timestamp: number
	alpha: number
	beta: number
	beta_alpha_ratio: number
}

export default function EEGChart() {
	const [data, setData] = useState<EEGSample[]>([])
	const [visibleRange, setVisibleRange] = useState(60) // seconds

	useEffect(() => {
		const fetchInitial = async () => {
			const { data: rows, error } = await supabase
				.from('brain_data')
				.select('*')
				.order('id', { ascending: false })
				.limit(1000)

			if (error) {
				console.error('Supabase error:', error)
				return
			}

			if (rows?.length) {
				const formatted = rows.reverse().map((r) => ({
					timestamp: new Date(r.created_at ?? Date.now()).getTime(),
					alpha: r.alpha ?? 0,
					beta: r.beta ?? 0,
					beta_alpha_ratio: r.beta_alpha_ratio ?? 0,
				}))
				setData(formatted)
			}
		}

		fetchInitial()

		// Live updates
		const channel = supabase
			.channel('brain_data_stream')
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'brain_data' },
				(payload) => {
					const record = payload.new as any
					const ts = new Date(record.created_at ?? Date.now()).getTime()
					setData((prev) => [
						...prev.slice(-500),
						{
							timestamp: ts,
							alpha: record.alpha ?? 0,
							beta: record.beta ?? 0,
							beta_alpha_ratio: record.beta_alpha_ratio ?? 0,
						},
					])
				}
			)
			.subscribe()

		return () => {
			supabase.removeChannel(channel)
		}
	}, [])

	// Compute visible window
	const now = Date.now()
	const minTime = now - visibleRange * 1000
	const filtered = data.filter((d) => d.timestamp >= minTime)

	return (
		<div className="w-full bg-neutral-950 rounded-xl p-4 shadow-md border border-neutral-800">
			<h2 className="text-lg text-gray-200 mb-2">Live EEG (Alpha / Beta / Ratio)</h2>

			<ResponsiveContainer width="100%" height={400}>
				<LineChart
					data={filtered}
					margin={{ top: 8, right: 16, bottom: 24, left: 48 }}
				>
					<CartesianGrid strokeDasharray="3 3" stroke="#333" />
					<XAxis
						type="number"
						dataKey="timestamp"
						domain={['dataMin', 'dataMax']}
						tickFormatter={(t) => new Date(t).toLocaleTimeString('en-US', { hour12: false }).slice(3, 8)}
						stroke="#666"
					/>
					<YAxis
						yAxisId="left"
						type="number"
						domain={['auto', 'auto']}
						tickFormatter={(v) => v.toFixed(2)}
						stroke="#666"
					/>
					<Tooltip
						labelFormatter={(label) => new Date(label as number).toLocaleTimeString()}
						contentStyle={{ backgroundColor: '#111', border: 'none' }}
						formatter={(value: number, name) => [
							value.toFixed(3),
							name === 'beta_alpha_ratio' ? 'β/α Ratio' : name.charAt(0).toUpperCase() + name.slice(1),
						]}
					/>
					<Legend />

					<Line yAxisId="left" type="monotone" dataKey="alpha" stroke="#7b61ff" dot={false} strokeWidth={2} name="Alpha" />
					<Line yAxisId="left" type="monotone" dataKey="beta" stroke="#00ffa3" dot={false} strokeWidth={2} name="Beta" />
					<Line yAxisId="left" type="monotone" dataKey="beta_alpha_ratio" stroke="#ff7300" dot={false} strokeWidth={2} name="β/α Ratio" />
				</LineChart>
			</ResponsiveContainer>

			{/* Range Slider */}
			<div className="flex flex-col items-center mt-4 text-gray-300">
				<label className="mb-2 text-sm">
					Visible Time Range: {visibleRange}s
				</label>
				<input
					type="range"
					min="10"
					max="300"
					step="10"
					value={visibleRange}
					onChange={(e) => setVisibleRange(Number(e.target.value))}
					className="w-2/3 accent-purple-500"
				/>
			</div>
		</div>
	)
}
