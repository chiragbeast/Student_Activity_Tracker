import { useEffect } from 'react'
import * as FramerMotion from 'framer-motion'
import './SpotlightBackground.css'

const randomInRange = (min, max) => min + Math.random() * (max - min)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const Spotlight = ({ className, range = 120, delay = 0 }) => {
  const controls = FramerMotion.useAnimationControls()

  useEffect(() => {
    let cancelled = false

    const runRandomMotion = async () => {
      if (delay > 0) {
        await sleep(delay * 1000)
      }

      while (!cancelled) {
        await controls.start({
          x: randomInRange(-range, range),
          y: randomInRange(-range, range),
          rotate: randomInRange(-20, 20),
          transition: {
            duration: randomInRange(6.5, 11.5),
            ease: 'easeInOut',
          },
        })
      }
    }

    runRandomMotion()

    return () => {
      cancelled = true
    }
  }, [controls, delay, range])

  return <FramerMotion.motion.div className={`spotlight ${className}`} animate={controls} />
}

export default function SpotlightBackground({ children, className = '' }) {
  return (
    <div className={`spotlight-container ${className}`}>
      <div className="spotlight-overlay" aria-hidden="true">
        <Spotlight className="spotlight-left" range={130} delay={0} />
        <Spotlight className="spotlight-mid" range={150} delay={0.8} />
        <Spotlight className="spotlight-right" range={140} delay={1.6} />
      </div>

      <div className="spotlight-content">{children}</div>
    </div>
  )
}
