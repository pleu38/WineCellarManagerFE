/**
 * Symbole de tour de château utilisé par la maquette Maison des Vins.
 * Le caractère ♜ est présent dans le fichier HTML de référence.
 */
export default function ChateauMark({ className = '' }) {
  return <span className={['chateau-mark', className].filter(Boolean).join(' ')} aria-hidden="true">♜</span>
}
