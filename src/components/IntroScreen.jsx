import { useEffect } from 'react'
import { ArrowRight, Wine } from 'lucide-react'

/**
 * La scène d'ouverture reste volontairement sombre, quel que soit le thème choisi
 * pour l'application. Elle peut être passée et respecte la réduction des animations.
 */
export default function IntroScreen({ onFinish }) {
  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const timer = window.setTimeout(onFinish, reducedMotion ? 500 : 3800)
    return () => window.clearTimeout(timer)
  }, [onFinish])

  return (
    <section className="intro-screen" aria-label="Bienvenue dans la Vinothèque">
      <div className="intro-glow intro-glow-left" aria-hidden="true" />
      <div className="intro-glow intro-glow-right" aria-hidden="true" />
      <div className="intro-content">
        <div className="intro-seal" aria-hidden="true"><Wine size={42} strokeWidth={1.3} /></div>
        <div className="intro-eyebrow">Votre collection, votre histoire</div>
        <h1 className="intro-title">La <em>Vinothèque</em></h1>
        <p className="intro-subtitle">Chaque bouteille a une histoire à raconter.</p>
        <div className="intro-rule" aria-hidden="true"><span /></div>
        <button className="intro-enter" onClick={onFinish} type="button">
          Entrer dans ma cave <ArrowRight size={17} />
        </button>
        <button className="intro-skip" onClick={onFinish} type="button">
          Passer l'animation
        </button>
      </div>
      <div className="intro-progress" aria-hidden="true"><span /></div>
    </section>
  )
}
