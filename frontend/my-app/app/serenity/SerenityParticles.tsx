"use client"

import { useEffect, useMemo, useState } from "react"
import Particles, { initParticlesEngine } from "@tsparticles/react"
import type { ISourceOptions } from "@tsparticles/engine"
import { loadSlim } from "@tsparticles/slim"

export default function SerenityParticles() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => setReady(true))
  }, [])

  const options = useMemo<ISourceOptions>(() => ({
    autoPlay: true,
    fullScreen: { enable: true, zIndex: 0 },
    background: { color: { value: "transparent" } }, // gradient comes from page
    detectRetina: true,
    fpsLimit: 60,

    interactivity: {
      detectsOn: "window",
      events: {
        // hover gently "pulls" nearby shapes so you can move them around
        onHover: { enable: true, mode: ["attract", "bubble"] },
        // click adds exactly ONE new random shape
        onClick: { enable: true, mode: "push" },
        resize: { enable: true, delay: 0.25 },
        // optional depth effect when moving cursor
        parallax: { enable: true, force: 6, smooth: 10 },
      },
      modes: {
        // makes shapes follow your cursor softly (drag-ish)
        attract: {
          distance: 200,
          duration: 0.25,
          factor: 1,
          maxSpeed: 20,
          easing: "ease-out-quad",
        },
        bubble: { distance: 260, duration: 2.2, size: 64, opacity: 0.9, mix: false },
        // exactly 1 per click
        push: { quantity: 1 },
      },
    },

    particles: {
      number: { value: 70, density: { enable: true, area: 1400 } },

      // NO lines — just shapes
      links: { enable: false },

      // triangles, pentagons, octagons + squares & circles
      shape: {
        type: ["polygon", "square", "circle"],
        options: {
          polygon: [
            { sides: 3 }, // triangle
            { sides: 5 }, // pentagon
            { sides: 8 }, // octagon
          ] as any,
        },
      },

      // soothing but vivid palette
      color: { value: ["#ffd15e", "#7be495", "#5ec2ff", "#caa7ff", "#ff8aa4"] },

      // >>> WAY bigger + slow “breathing”
      size: {
        value: { min: 40, max: 90 }, // was ~18–34
        animation: { enable: true, speed: 0.12, minimumValue: 36, sync: false },
      },

      // slightly translucent so overlaps blend nicely
      opacity: {
        value: 0.7,
        animation: { enable: true, speed: 0.1, minimumValue: 0.45, sync: false },
      },

      // a bit faster but still calm
      move: {
        enable: true,
        speed: 0.26,               // was 0.12
        direction: "none",
        straight: false,
        outModes: { default: "out" },
        gravity: { enable: false },
        drift: 0,
      },
    },

    pauseOnBlur: true,
    pauseOnOutsideViewport: true,
    smooth: true,
  }), [])

  if (!ready) return null
  return <Particles id="serenity-particles" options={options} />
}
