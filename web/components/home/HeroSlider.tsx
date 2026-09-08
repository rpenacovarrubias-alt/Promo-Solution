'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

const SLIDES = ['/hero.jpg', '/hero-2.jpg']
const INTERVAL_MS = 6000
const FADE_MS = 1000

/** Fondo del Hero — crossfade automático entre SLIDES. Vive aparte del resto
 *  del Hero (que sigue siendo Server Component) porque necesita estado/timer. */
export function HeroSlider() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      setActive(i => (i + 1) % SLIDES.length)
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      {SLIDES.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={i === 0}
          unoptimized
          className="object-cover ease-in-out"
          style={{
            opacity: i === active ? 1 : 0,
            transitionProperty: 'opacity',
            transitionDuration: `${FADE_MS}ms`,
          }}
        />
      ))}
    </>
  )
}
