export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(req: Request) {
	const { range } = await req.json()

	const timeMap: Record<string, number> = {
		'6h': 6,
		'12h': 12,
		'24h': 24,
		'3d': 72,
		'7d': 168,
	}

	const hours = timeMap[range] ?? 12
	const now = new Date()
	const start = new Date(now)
	start.setHours(now.getHours() - hours)

	// Fetch EEG data
	const { data: rows, error } = await supabase
		.from('brain_data')
		.select('alpha,beta,beta_alpha_ratio,created_at')
		.gte('created_at', start.toISOString())
		.order('created_at', { ascending: true })

	if (error || !rows?.length) {
		return NextResponse.json({ text: `No EEG data available for the past ${range}.` })
	}

	// Compute averages
	const avg = (key: 'alpha' | 'beta' | 'beta_alpha_ratio') =>
		rows.reduce((sum, r) => sum + (r[key] ?? 0), 0) / rows.length

	const alpha = avg('alpha')
	const beta = avg('beta')
	const ratio = avg('beta_alpha_ratio')

	const apiKey = process.env.ANTHROPIC_API_KEY
	if (!apiKey) {
		return NextResponse.json({ text: 'Server missing Anthropic API key.' })
	}

	const prompt = `
You are a neuroscience mood coach.

EEG summary for the past ${range}:
- Avg Alpha: ${alpha.toFixed(3)}
- Avg Beta: ${beta.toFixed(3)}
- Avg Beta/Alpha Ratio: ${ratio.toFixed(3)}

1. Briefly describe the most likely mood or cognitive state represented by these readings.
2. Give 2 concise, practical recommendations to help regulate or optimize the user's state (e.g., breathing, focus, rest, hydration).

Respond in Markdown under 150 words.
`

	async function callClaude(model: string) {
		const res = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
			},
			body: JSON.stringify({
				model,
				max_tokens: 250,
				messages: [{ role: 'user', content: prompt }],
			}),
		})
		if (!res.ok) throw new Error(`Claude API error ${res.status}`)
		const data = await res.json()
		return data?.content?.[0]?.text ?? 'No response text.'
	}

	try {
		const text = await callClaude('claude-sonnet-4-5-20250929')
		return NextResponse.json({ text })
	} catch {
		const fallback = await callClaude('claude-haiku-4-5-20251001').catch(() =>
			'Unable to retrieve summary from Claude.'
		)
		return NextResponse.json({ text: fallback })
	}
}

