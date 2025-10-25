"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

const slides = [
	{
		image: "/happy-autistic-child-learning-and-playing-with-col.jpg",
		title: "Every Child Deserves Understanding",
		message:
			"Children with autism experience the world in unique and beautiful ways. With patience, love, and support, they can thrive and reach their full potential.",
	},
	{
		image: "/autistic-teenager-connecting-with-friends--smiling.jpg",
		title: "Connection Knows No Boundaries",
		message:
			"Teens with autism form deep, meaningful friendships when given the space to be themselves. Inclusion and acceptance create communities where everyone belongs.",
	},
	{
		image: "/autistic-adult-working-successfully--confident-and.jpg",
		title: "Adults with Autism Thrive",
		message:
			"With the right support and understanding, adults with autism contribute incredible talents to our world. Their unique perspectives make our communities richer and more diverse.",
	},
	{
		image: "/family-embracing-autistic-child-with-love--warm-an.jpg",
		title: "Love Makes All the Difference",
		message:
			"Unconditional love, empathy, and understanding create safe spaces where individuals with autism can flourish. Every person deserves to be celebrated for who they are.",
	},
]

export default function AutismSlideshow() {
	const [currentSlide, setCurrentSlide] = useState(0)

	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentSlide((prev) => (prev + 1) % slides.length)
		}, 6000) // Change slide every 6 seconds

		return () => clearInterval(timer)
	}, [])

	return (
		<section className="relative py-20 px-4 overflow-hidden">
			{/* Background gradient accent */}
			<div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent pointer-events-none" />

			<div className="max-w-5xl mx-auto relative">
				{/* Section header */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="text-center mb-12"
				>
					<h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 bg-clip-text text-transparent mb-4">
						Understanding Through Empathy
					</h2>
					<p className="text-lg text-foreground/70 max-w-2xl mx-auto">
						Every individual with autism has a unique story, filled with strength, joy, and endless potential.
					</p>
				</motion.div>

				{/* Slideshow container */}
				<div className="relative">
					<AnimatePresence mode="wait">
						<motion.div
							key={currentSlide}
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							transition={{ duration: 0.8, ease: "easeInOut" }}
							className="relative"
						>
							{/* Image container */}
							<div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl mb-8">
								<Image
									src={slides[currentSlide].image || "/placeholder.svg"}
									alt={slides[currentSlide].title}
									fill
									className="object-cover"
									priority
								/>
								{/* Gradient overlay for better text readability */}
								<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
							</div>

							{/* Message container */}
							<div className="text-center space-y-4 px-4">
								<h3 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 bg-clip-text text-transparent">
									{slides[currentSlide].title}
								</h3>
								<p className="text-lg text-foreground/80 max-w-3xl mx-auto leading-relaxed">
									{slides[currentSlide].message}
								</p>
							</div>
						</motion.div>
					</AnimatePresence>

					{/* Slide indicators */}
					<div className="flex justify-center gap-2 mt-8">
						{slides.map((_, index) => (
							<button
								key={index}
								onClick={() => setCurrentSlide(index)}
								className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
										? "w-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500"
										: "w-2 bg-foreground/20 hover:bg-foreground/40"
									}`}
								aria-label={`Go to slide ${index + 1}`}
							/>
						))}
					</div>
				</div>

				{/* Call to action */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6, delay: 0.3 }}
					className="text-center mt-12"
				>
					<p className="text-xl font-medium bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-500 bg-clip-text text-transparent">
						Together, we can create a more inclusive and understanding world.
					</p>
				</motion.div>
			</div>
		</section>
	)
}
