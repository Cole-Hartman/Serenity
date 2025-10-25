import Hero from "./components/hero"
import InfoSections from "./components/info-sections"
import FloatingBrains from "./components/floating-brains"
import AutismSlideshow from "./components/autism-slideshow"

export default function HomePage() {
	return (
		<main className="min-h-screen">
			<FloatingBrains />
			<Hero />
			<InfoSections />
			<AutismSlideshow />
		</main>
	)
}
