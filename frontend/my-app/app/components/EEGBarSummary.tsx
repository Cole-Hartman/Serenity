'use client'

import React, { useEffect, useState } from 'react'
import {
	BarChart,
	Bar,
	Cell,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts'
import { supabase } from '@/lib/supabaseClient'

interface EEGSample {
	alpha: number
	beta: number
	theta: number
	beta_alpha_ratio: number
	beta_theta_ratio: number
	created_at: string
}

export default function EEGBarSummary() {
	const [data, setData] = useState<{ name: string; value: number }[]>([])
	const [mode, setMode] = useState<'live' | 'past'>('live')
	const [timeWindow, setTimeWindow] = useState('1h')
	const [noData, setNoData] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let channel: any

		const fetchData = async () => {
			try {
				setError(null)

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

				let query = supabase
					.from('brain_data')
					.select('alpha,beta,theta,beta_alpha_ratio,beta_theta_ratio,created_at')
					.order('created_at', { ascending: true })

				if (mode === 'past') {
					query = query.gte('created_at', start.toISOString())
				} else {
					query = query.limit(500).order('id', { ascending: false })
				}

				const { data: rows, error: queryError } = await query

				if (queryError) {
					console.error('Supabase error:', queryError)
					setError(`Database error: ${queryError.message}`)
					setNoData(true)
					return
				}

				if (!rows || rows.length === 0) {
					setNoData(true)
					// Set placeholder data with all zeros for visual consistency
					setData([
						{ name: 'Alpha (α)', value: 0 },
						{ name: 'Theta (θ)', value: 0 },
						{ name: 'Beta (β)', value: 0 },
						{ name: 'β/α Ratio', value: 0 },
						{ name: 'β/θ Ratio', value: 0 },
					])
					return
				}

				// Valid data found
				setNoData(false)

				// compute averages
				const avg = (key: keyof EEGSample) =>
					rows.reduce((sum, r) => sum + (r[key] ?? 0), 0) / rows.length

				setData([
					{ name: 'Alpha (α)', value: avg('alpha') },
					{ name: 'Theta (θ)', value: avg('theta') },
					{ name: 'Beta (β)', value: avg('beta') },
					{ name: 'β/α Ratio', value: avg('beta_alpha_ratio') },
					{ name: 'β/θ Ratio', value: avg('beta_theta_ratio') },
				])
			} catch (err) {
				console.error('Error fetching EEG data:', err)
				setError('Failed to load EEG data')
				setNoData(true)
			}
		}

		fetchData()

		if (mode === 'live') {
			channel = supabase
				.channel('brain_data_summary')
				.on(
					'postgres_changes',
					{ event: 'INSERT', schema: 'public', table: 'brain_data' },
					() => fetchData()
				)
				.subscribe()
		}

		return () => {
			if (channel) supabase.removeChannel(channel)
		}
	}, [mode, timeWindow])

	return (
		<div className="w-full bg-neutral-950 rounded-xl p-4 shadow-md border border-neutral-800">
			<div className="flex flex-col sm:flex-row items-center justify-between mb-3">
				<h2 className="text-lg text-gray-200 mb-2 sm:mb-0">
					EEG Summary View (Averages)
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

			<div className="relative">
				{/* Error/No Data Overlay */}
				{(noData || error) && (
					<div className="absolute inset-0 flex items-center justify-center z-10 bg-neutral-950/80 rounded-lg">
						<div className="text-center">
							{error ? (
								<>
									<p className="text-red-400 text-sm mb-2">⚠️ {error}</p>
								</>
							) : (
								<>
									<p className="text-gray-400 text-sm mb-2">No EEG data available</p>
									<p className="text-gray-500 text-xs italic">
										{mode === 'live'
											? 'Waiting for live data stream...'
											: `No data found for the selected time period`}
									</p>
								</>
							)}
						</div>
					</div>
				)}

				<ResponsiveContainer width="100%" height={300}>
					<BarChart data={data} margin={{ top: 8, right: 16, bottom: 60, left: 16 }}>
						<CartesianGrid strokeDasharray="3 3" stroke="#333" />
						<XAxis
							dataKey="name"
							stroke="#666"
							angle={-35}
							textAnchor="end"
							interval={0}
						/>
						<YAxis stroke="#666" tickFormatter={(v) => v.toFixed(2)} />
						<Tooltip
							contentStyle={{ backgroundColor: '#111', border: 'none', color: '#fff' }}
							labelStyle={{ color: '#fff', fontWeight: 'bold' }}
							cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
							content={({ active, payload }) => {
								if (active && payload && payload.length) {
									const dataIndex = data.findIndex(d => d.name === payload[0].payload.name)
									const colors = noData
										? ['#7b61ff', '#7b61ff', '#00ffa3', '#ff7300', '#ff7300']
										: ['#7b61ff', '#7b61ff', '#00ffa3', '#ff7300', '#ff7300']
									const color = colors[dataIndex] || '#fff'

									return (
										<div style={{ backgroundColor: '#111', padding: '8px 12px', border: 'none', borderRadius: '4px' }}>
											<p style={{ color: '#fff', margin: 0, marginBottom: '4px', fontWeight: 'bold' }}>
												{payload[0].payload.name}
											</p>
											<p style={{ color: color, margin: 0, fontSize: '14px' }}>
												{payload[0].value.toFixed(3)}
											</p>
										</div>
									)
								}
								return null
							}}
						/>
						<Bar dataKey="value" barSize={50} radius={[8, 8, 0, 0]} name="">
							{data.map((_, index) => {
								const colors = noData
									? ['#7b61ff33', '#3b82f633', '#00ffa333', '#ff730033', '#fbbf2433']
									: ['#7b61ff', '#7b61ff', '#00ffa3', '#ff7300', '#ff7300']
								return <Cell key={`cell-${index}`} fill={colors[index]} />
							})}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</div>

			<p className="text-center text-gray-400 text-sm mt-2">
				{mode === 'live'
					? 'Averages of latest EEG samples (auto-refreshing)'
					: `Averages for the past ${timeWindow.replace('m', ' minutes').replace('h', ' hours').replace('d', ' days')}`}
			</p>
		</div>
	)
}
