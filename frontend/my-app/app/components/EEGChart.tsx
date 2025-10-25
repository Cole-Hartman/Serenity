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
	const [visibleRange, setVisibleRange] = useState(60 * 5) // default: 5 minutes
	const [rangeUnit, setRangeUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days'>('minutes')
	const [mode, setMode] = useState<'live' | 'past'>('live')

	// --- Fetch initial + stream data ---
	useEffect(() => {
		const fetchInitial = async () => {
			const { data: rows, error } = await supabase
				.from('brain_data')
				.select('*')
				.order('id', { ascending: false })
				.limit(5000)

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

		const channel = supabase
			.channel('brain_data_stream')
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'brain_data' },
				(payload) => {
					const record = payload.new as any
					const ts = new Date(record.created_at ?? Date.now()).getTime()
					setData((prev) => [
						...prev.slice(-5000),
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

	// --- Time range computation ---
	const now = Date.now()

	// convert visibleRange to milliseconds depending on the unit
	const rangeMs = (() => {
		switch (rangeUnit) {
			case 'seconds':
				return visibleRange * 1000
			case 'minutes':
				return visibleRange * 60 * 1000
			case 'hours':
				return visibleRange * 60 * 60 * 1000
			case 'days':
				return visibleRange * 24 * 60 * 60 * 1000
			default:
				return visibleRange * 1000
		}
	})()

	const minTime = now - rangeMs
	const filtered = data.filter((d) => d.timestamp >= minTime)

	// --- Helper for label ---
	function formatRangeLabel() {
		switch (rangeUnit) {
			case 'seconds':
				return `${visibleRange}s`
			case 'minutes':
				return `${visibleRange}m`
			case 'hours':
				return `${visibleRange}h`
			case 'days':
				return `${visibleRange}d`
		}
	}

	return (
		<div className="w-full h-full flex flex-col bg-neutral-950 rounded-xl border border-neutral-800 p-3">
			{/* Header */}
			<div className="flex justify-between items-center mb-2">
				<h2 className="text-sm text-gray-300">EEG Activity (α / β / Ratio)</h2>
				<div className="flex gap-2">
					<button
						onClick={() => setMode('live')}
						className={`px-2 py-1 text-xs rounded-md ${mode === 'live'
								? 'bg-purple-600 text-white'
								: 'bg-neutral-800 text-gray-400'
							}`}
					>
						Live
					</button>
					<button
						onClick={() => setMode('past')}
						className={`px-2 py-1 text-xs rounded-md ${mode === 'past'
								? 'bg-purple-600 text-white'
								: 'bg-neutral-800 text-gray-400'
							}`}
					>
						Past
					</button>
				</div>
			</div>

			{/* Chart */}
			<div className="flex-1 flex items-center justify-center overflow-hidden">
				<LineChart
					data={filtered}
					style={{
						width: '100%',
						maxWidth: '450px',
						maxHeight: '70vh',
						aspectRatio: 1.6,
					}}
					margin={{ top: 8, right: 12, bottom: 20, left: 0 }}
				>
					<CartesianGrid strokeDasharray="3 3" stroke="#333" />
					<XAxis
						type="number"
						dataKey="timestamp"
						domain={['dataMin', 'dataMax']}
						tickFormatter={(t) =>
							new Date(t).toLocaleTimeString('en-US', {
								hour12: false,
								hour: '2-digit',
								minute: '2-digit',
							})
						}
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
						labelFormatter={(label) =>
							new Date(label as number).toLocaleTimeString()
						}
						contentStyle={{ backgroundColor: '#111', border: 'none' }}
						formatter={(value: number, name) => [
							value.toFixed(3),
							name === 'beta_alpha_ratio'
								? 'β/α Ratio'
								: name.charAt(0).toUpperCase() + name.slice(1),
						]}
					/>
					<Legend />
					<Line
						yAxisId="left"
						type="monotone"
						dataKey="alpha"
						stroke="#7b61ff"
						dot={false}
						strokeWidth={2}
						name="Alpha"
					/>
					<Line
						yAxisId="left"
						type="monotone"
						dataKey="beta"
						stroke="#00ffa3"
						dot={false}
						strokeWidth={2}
						name="Beta"
					/>
					<Line
						yAxisId="left"
						type="monotone"
						dataKey="beta_alpha_ratio"
						stroke="#ff7300"
						dot={false}
						strokeWidth={2}
						name="β/α Ratio"
					/>
				</LineChart>
			</div>

			{/* Range Controls */}
			<div className="flex flex-col items-center mt-2 text-gray-300">
				<label className="mb-1 text-xs">
					Visible Range: {formatRangeLabel()}
				</label>

				<input
					type="range"
					min="1"
					max={
						rangeUnit === 'seconds'
							? 300
							: rangeUnit === 'minutes'
								? 120
								: rangeUnit === 'hours'
									? 48
									: 7
					}
					step="1"
					value={visibleRange}
					onChange={(e) => setVisibleRange(Number(e.target.value))}
					className="w-2/3 accent-purple-500 mb-2"
				/>

				{/* Unit Toggle */}
				<div className="flex gap-2 text-xs">
					{(['seconds', 'minutes', 'hours', 'days'] as const).map((u) => (
						<button
							key={u}
							onClick={() => setRangeUnit(u)}
							className={`px-2 py-1 rounded-md ${rangeUnit === u
									? 'bg-purple-600 text-white'
									: 'bg-neutral-800 text-gray-400 hover:bg-neutral-700'
								}`}
						>
							{u[0].toUpperCase() + u.slice(1)}
						</button>
					))}
				</div>
			</div>
		</div>
	)
}

