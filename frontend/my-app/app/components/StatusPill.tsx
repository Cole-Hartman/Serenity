'use client'

import React from 'react'

export type StressLevel = 'low' | 'moderate' | 'high'

export default function StatusPill({
  level,
  ba = 0,
  bt = 0,
  className = '',
}: {
  level: StressLevel
  ba?: number
  bt?: number
  className?: string
}) {
  // Visual styling for each stress level
  const levelStyles = {
    low: {
      bg: 'bg-green-600/20',
      text: 'text-green-200',
      border: 'border-green-600',
      label: 'Relaxed',
    },
    moderate: {
      bg: 'bg-yellow-600/20',
      text: 'text-yellow-200',
      border: 'border-yellow-600',
      label: 'Alert',
    },
    high: {
      bg: 'bg-red-600/20',
      text: 'text-red-200',
      border: 'border-red-600',
      label: 'Stressed',
    },
  }

  const style = levelStyles[level]

  return (
    <div
      className={[
        'text-xs px-2 py-1 rounded-md border select-none',
        style.bg,
        style.text,
        style.border,
        className,
      ].join(' ')}
      title={`β/α avg: ${ba.toFixed(2)} • β/θ avg: ${bt.toFixed(2)}`}
      aria-live="polite"
      role="status"
    >
      Status: {style.label}
    </div>
  )
}
