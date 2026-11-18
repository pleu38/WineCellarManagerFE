import { useEffect } from 'react'
import ChateauMark from './ChateauMark'

/**
 * Intro courte inspirée de maison_des_vins_v14.html.
 * L'application est déjà montée derrière l'overlay pendant la séquence.
 */
export default function IntroScreen({ onFinish }) {
  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(onFinish, reducedMotion ? 0 : 2100)
    return () => window.clearTimeout(timer)
  }, [onFinish])

  return (
    <section className="intro-screen" aria-label="Bienvenue dans Maison des Vins" role="status">
      <div className="intro-halo" aria-hidden="true" />
      <div className="intro-content">
        <div className="intro-spark" aria-hidden="true">✦</div>
        <ChateauMark className="intro-castle" />
        <div className="intro-eyebrow">Collection privée</div>
        <h1 className="intro-title">MAISON <em>DES</em> VINS</h1>
        <div className="intro-rule" aria-hidden="true"><span /></div>
        <p className="intro-subtitle">Chaque bouteille raconte une histoire.</p>
      </div>
      <button className="intro-skip" type="button" onClick={onFinish}>
        Passer l'introduction ↗
      </button>
    </section>
  )
}
