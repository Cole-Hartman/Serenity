"use client"

import { motion } from "framer-motion"
import { Brain } from "lucide-react"

export default function FloatingBrains() {
	const brains = [
		{ id: 1, left: "5%", top: "15%", delay: 0, duration: 8 },
		{ id: 2, left: "85%", top: "25%", delay: 2, duration: 10 },
		{ id: 3, left: "10%", top: "60%", delay: 4, duration: 9 },
		{ id: 4, left: "90%", top: "70%", delay: 1, duration: 11 },
		{ id: 5, left: "15%", top: "85%", delay: 3, duration: 7 },
		{ id: 6, left: "80%", top: "50%", delay: 5, duration: 12 },
	]

	return (
		<div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
			{brains.map((brain) => (
				<motion.div
					key={brain.id}
					className="absolute"
					style={{
						left: brain.left,
						top: brain.top,
					}}
					animate={{
						y: [0, -30, 0],
						x: [0, 15, -15, 0],
						rotate: [0, 10, -10, 0],
						opacity: [0.1, 0.2, 0.1],
					}}
					transition={{
						duration: brain.duration,
						repeat: Number.POSITIVE_INFINITY,
						ease: "easeInOut",
						delay: brain.delay,
					}}
				>
					<Brain className="w-16 h-16 md:w-24 md:h-24 text-white/20" strokeWidth={1} />
				</motion.div>
			))}
		</div>
	)
}
