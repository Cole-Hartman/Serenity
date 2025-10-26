'use client'

import React, { useEffect, useMemo, useState } from 'react'
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

/**
 * ============================================================================
 * STRESS DETECTION TUNING GUIDE
 * ============================================================================
 *
 * This component uses PRE-CALCULATED stress intensity from the backend to
 * ensure perfect alignment with the brain model's electrode colors.
 *
 * Backend (brainscan.py) calculates composite stress using:
 *   - 40% β/θ ratio (normalized 0.5-3.0 range)
 *   - 30% β power (normalized 0.05-0.35 range)
 *   - 20% β/α ratio (normalized 0.5-3.0 range)
 *   - Smoothing: 5-sample window for aggregate data
 *
 * Frontend (this file) applies:
 *   - 15-second rolling window averaging of pre-calculated stress
 *   - Threshold mapping to visual levels (Green/Yellow/Red)
 *   - Debouncing for level downgrades
 *
 * AVERAGING_WINDOW_MS:
 *   - Lower (10s): More responsive but noisier
 *   - Higher (30s): Smoother but slower to react
 *   - Recommended: 15-20 seconds
 *
 * DEBOUNCE_DOWN_MS:
 *   - Prevents rapid flickering when stress levels decrease
 *   - Higher = more stable but slower to show improvement
 *   - Recommended: 5-15 seconds
 *
 * STRESS_LOW_THRESHOLD (0.4):
 *   - Green → Yellow boundary
 *   - Matches electrode color coding in brainModel.tsx
 *
 * STRESS_HIGH_THRESHOLD (0.7):
 *   - Yellow → Red boundary
 *   - Matches electrode color coding in brainModel.tsx
 * ============================================================================
 */

const STRESS_CONFIG = {
  // Averaging window for stress calculation (milliseconds)
  AVERAGING_WINDOW_MS: 15_000,  // 15 seconds

  // Stress level thresholds (0-1 scale, matches brain model)
  STRESS_LOW_THRESHOLD: 0.4,    // Below = Green (Relaxed)
  STRESS_HIGH_THRESHOLD: 0.7,   // Above = Red (Stressed), between = Yellow (Alert)

  // Debouncing time for level downgrade (milliseconds)
  DEBOUNCE_DOWN_MS: 5000,       // 5 seconds
} as const

interface EEGSample {
  timestamp: number
  alpha: number
  beta: number
  theta: number
  beta_alpha_ratio: number
  beta_theta_ratio: number
  stress_intensity?: number  // Pre-calculated composite stress from backend (0-1 scale)
}

type MetricMode = 'alpha-beta' | 'theta-beta'
type StressLevel = 'low' | 'moderate' | 'high'

interface EEGChartProps {
  onStatusChange?: (
    level: StressLevel,
    details: {
      baAvg: number
      btAvg: number
      stressIntensity: number  // Composite stress (0-1 scale)
    }
  ) => void
}

/**
 * Convert composite stress intensity (0-1) to stress level
 * Matches brain model thresholds: <0.4 = Green, 0.4-0.7 = Yellow, >0.7 = Red
 *
 * Note: Stress is now calculated in the backend (brainscan.py) using composite formula:
 * - 40% β/θ ratio (normalized 0.5-3.0)
 * - 30% β power (normalized 0.05-0.35)
 * - 20% β/α ratio (normalized 0.5-3.0)
 */
function getStressLevel(stressIntensity: number): StressLevel {
  if (stressIntensity >= STRESS_CONFIG.STRESS_HIGH_THRESHOLD) return 'high'
  if (stressIntensity >= STRESS_CONFIG.STRESS_LOW_THRESHOLD) return 'moderate'
  return 'low'
}

export default function EEGChart({
  onStatusChange,
}: EEGChartProps = {}) {
  const [data, setData] = useState<EEGSample[]>([])
  const [visibleRange, setVisibleRange] = useState(60 * 5)
  const [rangeUnit, setRangeUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days'>('minutes')
  const [mode, setMode] = useState<'live' | 'past'>('live')
  const [metricMode, setMetricMode] = useState<MetricMode>('alpha-beta')

  // --- Fetch initial + stream data (unchanged) ---
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
          theta: r.theta ?? 0,
          beta_alpha_ratio: r.beta_alpha_ratio ?? 0,
          beta_theta_ratio: r.beta_theta_ratio ?? 0,
          stress_intensity: r.stress_intensity ?? 0,
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
              theta: record.theta ?? 0,
              beta_alpha_ratio: record.beta_alpha_ratio ?? 0,
              beta_theta_ratio: record.beta_theta_ratio ?? 0,
              stress_intensity: record.stress_intensity ?? 0,
            },
          ])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // --- Time range computation (unchanged) ---
  const now = Date.now()
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
  let filtered = data.filter((d) => d.timestamp >= minTime)

  // --- If no EEG data, show a flat baseline (unchanged) ---
  const noData = filtered.length === 0
  if (noData) {
    const now = Date.now()
    filtered = Array.from({ length: 50 }, (_, i) => ({
      timestamp: now - (50 - i) * 1000,
      alpha: 0,
      beta: 0,
      theta: 0,
      beta_alpha_ratio: 0,
      beta_theta_ratio: 0,
    }))
  }

  // --- Compute short-window averages & current stress level from pre-calculated backend stress ---
  const { baAvg, btAvg, stressIntensity, currentLevel } = useMemo(() => {
    const cutoff = Date.now() - STRESS_CONFIG.AVERAGING_WINDOW_MS  // Fresh timestamp
    const windowed = data.filter((d) => d.timestamp >= cutoff)

    if (!windowed.length) {
      return { baAvg: 0, btAvg: 0, stressIntensity: 0, currentLevel: 'low' as StressLevel }
    }

    // Calculate averages for display purposes
    const sumBA = windowed.reduce((acc, d) => acc + (d.beta_alpha_ratio ?? 0), 0)
    const sumBT = windowed.reduce((acc, d) => acc + (d.beta_theta_ratio ?? 0), 0)
    const sumStress = windowed.reduce((acc, d) => acc + (d.stress_intensity ?? 0), 0)

    const baAvg = sumBA / windowed.length
    const btAvg = sumBT / windowed.length

    // Use pre-calculated stress intensity from backend (already composite calculated)
    const intensity = sumStress / windowed.length

    // Convert intensity to stress level (matches brain model thresholds)
    const level = getStressLevel(intensity)

    return { baAvg, btAvg, stressIntensity: intensity, currentLevel: level }
  }, [data])

  // --- Debouncing logic for stress level changes ---
  const [displayLevel, setDisplayLevel] = useState<StressLevel>('low')
  const [lastLevelChange, setLastLevelChange] = useState(Date.now())

  useEffect(() => {
    const now = Date.now()
    const isDowngrade =
      (displayLevel === 'high' && currentLevel !== 'high') ||
      (displayLevel === 'moderate' && currentLevel === 'low')

    if (isDowngrade) {
      // Require debounce time before downgrading
      const timeSinceChange = now - lastLevelChange
      if (timeSinceChange >= STRESS_CONFIG.DEBOUNCE_DOWN_MS) {
        setDisplayLevel(currentLevel)
        setLastLevelChange(now)
      }
    } else {
      // Immediate upgrade (or same level)
      if (currentLevel !== displayLevel) {
        setDisplayLevel(currentLevel)
        setLastLevelChange(now)
      }
    }
  }, [currentLevel, displayLevel, lastLevelChange])

  // --- Notify parent when display level changes ---
  useEffect(() => {
    if (!onStatusChange) return

    onStatusChange(displayLevel, { baAvg, btAvg, stressIntensity })
  }, [displayLevel, baAvg, btAvg, stressIntensity, onStatusChange])

  // --- Helper for label (unchanged) ---
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
    <div
      className={
        [
          "w-full h-full flex flex-col bg-neutral-950 rounded-xl border p-3 relative",
          "border-neutral-800",
          // 3-level border animation: Green(none), Yellow(static), Red(pulsing)
          displayLevel === 'high' ? "ring-2 ring-red-500 animate-pulse" :
          displayLevel === 'moderate' ? "ring-2 ring-yellow-500" :
          "ring-0"
        ].filter(Boolean).join(' ')
      }
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm text-gray-300">EEG Activity</h2>
          <select
            value={metricMode}
            onChange={(e) => setMetricMode(e.target.value as MetricMode)}
            className="bg-neutral-900 text-gray-300 text-xs rounded-md px-2 py-1 border border-neutral-700"
          >
            <option value="alpha-beta">α / β / Ratio</option>
            <option value="theta-beta">θ / β / Ratio</option>
          </select>
        </div>
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
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {noData && (
          <p className="absolute text-xs text-gray-500 top-2 right-4 italic z-10">
            No live data — displaying flat baseline
          </p>
        )}

        <LineChart
          data={filtered}
          style={{ width: '100%', maxWidth: '450px', maxHeight: '70vh', aspectRatio: 1.6 }}
          margin={{ top: 8, right: 12, bottom: 20, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            type="number"
            dataKey="timestamp"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(t) =>
              new Date(t).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
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
            labelFormatter={(label) => new Date(label as number).toLocaleTimeString()}
            contentStyle={{ backgroundColor: '#111', border: 'none' }}
            formatter={(value: number, name) => {
              const nameStr = String(name)
              const displayName = nameStr === 'beta_alpha_ratio' || nameStr === 'beta_theta_ratio'
                ? nameStr === 'beta_alpha_ratio' ? 'β/α Ratio' : 'β/θ Ratio'
                : nameStr.charAt(0).toUpperCase() + nameStr.slice(1)
              return [value.toFixed(3), displayName]
            }}
          />
          <Legend />
          {metricMode === 'alpha-beta' ? (
            <>
              <Line yAxisId="left" type="monotone" dataKey="alpha" stroke={'#7b61ff'} dot={false} strokeWidth={2} name="Alpha (α)" />
              <Line yAxisId="left" type="monotone" dataKey="beta" stroke={'#00ffa3'} dot={false} strokeWidth={2} name="Beta (β)" />
              <Line yAxisId="left" type="monotone" dataKey="beta_alpha_ratio" stroke={'#ff7300'} dot={false} strokeWidth={2} name="β/α Ratio" />
            </>
          ) : (
            <>
              <Line yAxisId="left" type="monotone" dataKey="theta" stroke={'#7b61ff'} dot={false} strokeWidth={2} name="Theta (θ)" />
              <Line yAxisId="left" type="monotone" dataKey="beta" stroke={'#00ffa3'} dot={false} strokeWidth={2} name="Beta (β)" />
              <Line yAxisId="left" type="monotone" dataKey="beta_theta_ratio" stroke={'#ff7300'} dot={false} strokeWidth={2} name="β/θ Ratio" />
            </>
          )}
        </LineChart>
      </div>

      {/* Range Controls (unchanged) */}
      <div className="flex flex-col items-center mt-2 text-gray-300">
        <label className="mb-1 text-xs">Visible Range: {formatRangeLabel()}</label>
        <input
          type="range"
          min="1"
          max={rangeUnit === 'seconds' ? 300 : rangeUnit === 'minutes' ? 120 : rangeUnit === 'hours' ? 48 : 7}
          step="1"
          value={visibleRange}
          onChange={(e) => setVisibleRange(Number(e.target.value))}
          className="w-2/3 accent-purple-500 mb-2"
        />
        <div className="flex gap-2 text-xs">
          {(['seconds', 'minutes', 'hours', 'days'] as const).map((u) => (
            <button
              key={u}
              onClick={() => setRangeUnit(u)}
              className={`px-2 py-1 rounded-md ${rangeUnit === u ? 'bg-purple-600 text-white' : 'bg-neutral-800 text-gray-400 hover:bg-neutral-700'}`}
            >
              {u[0].toUpperCase() + u.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
