"use client"

import SerenityParticles from "./SerenityParticles"

export default function SerenityPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Gradient backdrop */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 800px at 20% 15%, #102b55 0%, #0c2448 40%, #0a1f40 60%, #081a36 100%)",
        }}
      />
      {/* Subtle second layer for depth */}
      <div
        className="fixed inset-0 -z-10 opacity-60"
        style={{
          background:
            "radial-gradient(900px 600px at 80% 85%, rgba(60,120,255,0.20) 0%, rgba(0,0,0,0) 60%)",
        }}
      />

      {/* Always-on, slow, playful shapes */}
      <SerenityParticles />
    </main>
  )
}
