'use client'

import React, { useEffect, useState } from 'react'
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
} from 'recharts'
import { supabase } from '@/lib/supabaseClient'

interface EEGSample {
	alpha: number
	beta: number
	beta_alpha_ratio: number
	created_at: string
}

export default function EEGBarSummary() {
	const [data, setData] = useState<{ name: string; value: number }[]>([])
	const [mode, setMode] = useState<'live' | 'past'>('live')
	const [timeWindow, setTimeWindow] = useState('1h')

	useEffect(() => {
		let channel: any

		const fetchData = async () => {
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
				.select('alpha,beta,beta_alpha_ratio,created_at')
				.order('created_at', { ascending: true })

			if (mode === 'past') {
				query = query.gte('created_at', start.toISOString())
			} else {
				query = query.limit(500).order('id', { ascending: false })
			}

			const { data: rows, error } = await query
			if (error) {
				console.error('Supabase error:', error)
				return
			}
			if (!rows?.length) return

			// compute averages
			const avg = (key: keyof EEGSample) =>
				rows.reduce((sum, r) => sum + (r[key] ?? 0), 0) / rows.length

			setData([
				{ name: 'Alpha', value: avg('alpha') },
				{ name: 'Beta', value: avg('beta') },
				{ name: 'β/α Ratio', value: avg('beta_alpha_ratio') },
			])
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

			<ResponsiveContainer width="100%" height={300}>
				<BarChart data={data} margin={{ top: 8, right: 16, bottom: 24, left: 16 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="#333" />
					<XAxis dataKey="name" stroke="#666" />
					<YAxis stroke="#666" tickFormatter={(v) => v.toFixed(2)} />
					<Tooltip
						contentStyle={{ backgroundColor: '#111', border: 'none' }}
						formatter={(value: number) => value.toFixed(3)}
					/>
					<Legend />
					<Bar dataKey="value" fill="#7b61ff" barSize={60} radius={[8, 8, 0, 0]} />
				</BarChart>
			</ResponsiveContainer>

			<p className="text-center text-gray-400 text-sm mt-2">
				{mode === 'live'
					? 'Averages of latest EEG samples (auto-refreshing)'
					: `Averages for the past ${timeWindow.replace('m', ' minutes').replace('h', ' hours').replace('d', ' days')}`}
			</p>
		</div>
	)
}
