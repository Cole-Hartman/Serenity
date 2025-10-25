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
	const [visibleRange, setVisibleRange] = useState(60)
	const [mode, setMode] = useState<'live' | 'past'>('live')
	const [timeWindow, setTimeWindow] = useState('1h') // '10m', '30m', '1h', '6h', '12h', '24h', '3d', '7d'

	useEffect(() => {
		let channel: any

		const fetchInitial = async () => {
			if (mode === 'live') {
				// Fetch most recent data
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

				// Subscribe for live inserts
				channel = supabase
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
			} else {
				// Fetch past data based on selected window
				const now = new Date()
				let start = new Date(now)
				switch (timeWindow) {
					case '10m':
						start.setMinutes(now.getMinutes() - 10)
						break
					case '30m':
						start.setMinutes(now.getMinutes() - 30)
						break
					case '1h':
						start.setHours(now.getHours() - 1)
						break
					case '6h':
						start.setHours(now.getHours() - 6)
						break
					case '12h':
						start.setHours(now.getHours() - 12)
						break
					case '24h':
						start.setDate(now.getDate() - 1)
						break
					case '3d':
						start.setDate(now.getDate() - 3)
						break
					case '7d':
						start.setDate(now.getDate() - 7)
						break
				}

				const { data: rows, error } = await supabase
					.from('brain_data')
					.select('*')
					.gte('created_at', start.toISOString())
					.order('created_at', { ascending: true })

				if (error) {
					console.error('Supabase error:', error)
					return
				}

				if (rows?.length) {
					const formatted = rows.map((r) => ({
						timestamp: new Date(r.created_at ?? Date.now()).getTime(),
						alpha: r.alpha ?? 0,
						beta: r.beta ?? 0,
						beta_alpha_ratio: r.beta_alpha_ratio ?? 0,
					}))
					setData(formatted)
				}
			}
		}

		fetchInitial()
		return () => {
			if (channel) supabase.removeChannel(channel)
		}
	}, [mode, timeWindow])

	const now = Date.now()
	const minTime = now - visibleRange * 1000
	const filtered = mode === 'live' ? data.filter((d) => d.timestamp >= minTime) : data

	return (
		<div className="w-full bg-neutral-950 rounded-xl p-4 shadow-md border border-neutral-800">
			<div className="flex flex-col sm:flex-row items-center justify-between mb-3">
				<h2 className="text-lg text-gray-200 mb-2 sm:mb-0">
					EEG Activity (Alpha / Beta / Ratio)
				</h2>

				<div className="flex items-center gap-2">
					<button
						onClick={() => setMode('live')}
						className={`px-3 py-1 rounded-md text-sm ${mode === 'live'
							? 'bg-purple-600 text-white'
							: 'bg-neutral-800 text-gray-400'
							}`}
					>
						Live
					</button>
					<button
						onClick={() => setMode('past')}
						className={`px-3 py-1 rounded-md text-sm ${mode === 'past'
							? 'bg-purple-600 text-white'
							: 'bg-neutral-800 text-gray-400'
							}`}
					>
						Past
					</button>

					{mode === 'past' && (
						<select
							value={timeWindow}
							onChange={(e) => setTimeWindow(e.target.value)}
							className="bg-neutral-900 text-gray-300 text-sm rounded-md px-2 py-1 border border-neutral-700"
						>
							<option value="10m">Last 10 m</option>
							<option value="30m">Last 30 m</option>
							<option value="1h">Last 1 h</option>
							<option value="6h">Last 6 h</option>
							<option value="12h">Last 12 h</option>
							<option value="24h">Last 24 h</option>
							<option value="3d">Last 3 d</option>
							<option value="7d">Last 7 d</option>
						</select>
					)}
				</div>
			</div>

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
						tickFormatter={(t) =>
							new Date(t)
								.toLocaleTimeString('en-US', { hour12: false })
								.slice(3, 8)
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
			</ResponsiveContainer>

			{mode === 'live' && (
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
			)}
		</div>
	)
}

