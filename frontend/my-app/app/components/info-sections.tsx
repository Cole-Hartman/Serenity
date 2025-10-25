"use client"

import { motion } from "framer-motion"
import { Brain, Heart, Waves } from "lucide-react"

const sections = [
  {
    icon: Brain,
    title: "How it Works",
    description:
      "Serenity connects to your Muse EEG headband to monitor real-time brain activity. Our AI analyzes stress patterns and automatically triggers calming visuals and soundscapes tailored to your needs.",
  },
  {
    icon: Heart,
    title: "Why it Helps",
    description:
      "Autistic individuals often experience sensory overload and heightened stress. Serenity provides immediate, personalized interventions that help restore calm, improve focus, and reduce anxiety in the moment.",
  },
  {
    icon: Waves,
    title: "Primary Brain Waves to Track",
    description:
      "We monitor Alpha waves (relaxation), Beta waves (active thinking), Theta waves (meditation), and Delta waves (deep rest) to understand your mental state and provide the most effective calming response.",
  },
]

export default function InfoSections() {
  return (
    <div className="w-full bg-white py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="flex flex-col items-center text-center"
            >
              {/* Icon with gradient background */}
              <motion.div
                className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-indigo-100 via-purple-100 to-sky-100"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <section.icon className="w-12 h-12 text-purple-600" strokeWidth={1.5} />
              </motion.div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h3>

              {/* Description */}
              <p className="text-gray-600 leading-relaxed">{section.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
