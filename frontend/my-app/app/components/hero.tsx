"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Brain, Sparkles } from "lucide-react"
import Image from "next/image"

export default function Hero() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-sky-500">
      {/* Animated background elements */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 20,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "reverse",
        }}
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex items-center justify-center gap-6 mb-4"
        >
          <Image
            src="/serenity-logo.png"
            alt="Serenity Logo"
            width={112}
            height={112}
            className="w-24 h-24 md:w-28 md:h-28"
          />
          <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold text-white tracking-tight">Serenity</h1>
        </motion.div>

        {/* Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl text-white/90 mb-8 font-light">
            Live Autism Stress Detection & Relaxation Experience
          </h2>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <p className="text-lg md:text-xl text-white/80 mb-12 max-w-2xl leading-relaxed">
            Serenity uses EEG data from the Muse headband to detect stress patterns in autistic individuals and generate
            live visuals and calming sounds to restore focus and reduce anxiety. Built for accessibility, empathy, and
            innovation.
          </p>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-6 mb-16"
        >
          <Link href="/dashboard">
            <motion.button
              className="group relative px-8 py-4 bg-white text-purple-600 rounded-xl font-semibold text-lg flex items-center gap-3 overflow-hidden shadow-2xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"
                initial={false}
              />
              <span className="relative z-10 group-hover:text-white transition-colors flex items-center gap-3">
                <Brain className="w-5 h-5" />
                Open Dashboard
              </span>
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100"
                animate={{
                  boxShadow: [
                    "0 0 0px rgba(255,255,255,0)",
                    "0 0 20px rgba(255,255,255,0.5)",
                    "0 0 0px rgba(255,255,255,0)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                }}
              />
            </motion.button>
          </Link>

          <Link href="/serenity">
            <motion.button
              className="group relative px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl font-semibold text-lg flex items-center gap-3 overflow-hidden shadow-2xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                initial={false}
              />
              <span className="relative z-10 flex items-center gap-3">
                <Sparkles className="w-5 h-5" />
                Enter Serenity Mode
              </span>
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100"
                animate={{
                  boxShadow: [
                    "0 0 0px rgba(255,255,255,0)",
                    "0 0 30px rgba(255,255,255,0.3)",
                    "0 0 0px rgba(255,255,255,0)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                }}
              />
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="absolute bottom-8 left-0 right-0 text-center"
      >
        <p className="text-white/70 text-sm md:text-base">Built at Cal Hacks 12.0 • by Team Serenity</p>
      </motion.footer>
    </div>
  )
}
