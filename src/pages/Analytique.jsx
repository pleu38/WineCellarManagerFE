import { useState, useEffect } from 'react'
import {
  getSumCru,
  getSumRegion,
  getAnalyticsByRegion,
  getAnalyticsByMillesime,
  getAverageCru,
  getAnalyticsByCouleur,
} from '../api/wineApi'

const COULEUR_CONFIG = {
  Rouge:        { color: '#8b1538' },
  Blanc:        { color: '#b8884a' },
  Rosé:         { color: '#d68c95' },
  Effervescent: { color: '#4a8f56' },
  Liqueur:      { color: '#c98639' },
}

const REGION_COLORS = [
  '#8b1538', '#b8884a', '#4a8f56', '#c98639',
  '#d68c95', '#9d8e87', '#b91c4a', '#6a9fb5',
  '#7b68ee', '#20b2aa',
]

function normalizeCouleur(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  return Object.entries(raw).map(([type_vin, quantite]) => ({ type_vin, quantite }))
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arcPath(cx, cy, r, startDeg, endDeg) {
  const start = polarToCartesian(cx, cy, r, endDeg)
  const end = polarToCartesian(cx, cy, r, startDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`
}

function DonutChart({ segments, size = 180, strokeWidth = 30 }) {
  const cx = size / 2
  const cy = size / 2
  const r = (size - strokeWidth) / 2
  const total = segments.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null

  const GAP_DEG = 2
  let cumDeg = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3ede6" strokeWidth={strokeWidth} />
      {segments.map((seg, i) => {
        const spanDeg = (seg.value / total) * 360
        const startDeg = cumDeg + GAP_DEG / 2
        const endDeg = cumDeg + spanDeg - GAP_DEG / 2
        cumDeg += spanDeg
        if (endDeg <= startDeg) return null
        return (
          <path
            key={i}
            d={arcPath(cx, cy, r, startDeg, endDeg)}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
          />
        )
      })}
    </svg>
  )
}

export default function Analytique() {
  const [totalBottles, setTotalBottles] = useState(null)
  const [totalRegions, setTotalRegions] = useState(null)
  const [regionData, setRegionData] = useState([])
  const [millesimeData, setMillesimeData] = useState([])
  const [average, setAverage] = useState(null)
  const [couleurData, setCouleurData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      getSumCru(),
      getSumRegion(),
      getAnalyticsByRegion(),
      getAnalyticsByMillesime(),
      getAverageCru(),
      getAnalyticsByCouleur(),
    ]).then(([sum, sumR, regions, millesimes, avg, couleur]) => {
      if (sum.status === 'fulfilled' && sum.value?.[0]?.somme != null)
        setTotalBottles(Math.round(sum.value[0].somme))
      if (sumR.status === 'fulfilled' && sumR.value?.[0]?.compte_region != null)
        setTotalRegions(sumR.value[0].compte_region)
      if (regions.status === 'fulfilled') setRegionData(regions.value)
      if (millesimes.status === 'fulfilled')
        setMillesimeData(millesimes.value.sort((a, b) => a.millesime - b.millesime))
      if (avg.status === 'fulfilled' && avg.value?.[0]?.moyenne != null)
        setAverage(Math.round(avg.value[0].moyenne * 10) / 10)
      if (couleur.status === 'fulfilled')
        setCouleurData(normalizeCouleur(couleur.value))
      setLoading(false)
    })
  }, [])

  const maxMillesime = Math.max(...millesimeData.map((m) => m.quantite), 1)
  const totalCouleur = couleurData.reduce((s, c) => s + (c.quantite || 0), 0)

  const regionSegments = [...regionData]
    .sort((a, b) => a.quantite - b.quantite)
    .slice(0, 10)
    .map((r, i) => ({
      value: r.quantite,
      color: REGION_COLORS[i % REGION_COLORS.length],
      label: r.region,
    }))

  if (loading) {
    return (
      <section className="page">
        <div className="loading">
          <span className="spinner" /> Chargement des analytiques…
        </div>
      </section>
    )
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Analytique <em>de la cave</em></h1>
          <div className="subtitle">Vue d'ensemble</div>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Feature card */}
        <div className="stat-card feature">
          <div className="stat-card-top">
            <div className="stat-label">Inventaire total</div>
            <div className="stat-icon">
              <svg viewBox="0 0 24 24">
                <path d="M9 3h6l1 4v13a1 1 0 01-1 1H9a1 1 0 01-1-1V7l1-4z" />
              </svg>
            </div>
          </div>
          <div className="stat-value">
            {totalBottles ?? '—'}<span className="stat-unit">vins différents</span>
          </div>
          <div className="stat-trend" style={{ color: 'rgba(255,220,230,0.9)' }}>
            {totalRegions ? `${totalRegions} régions représentées` : ''}
          </div>
        </div>

        {/* Regions count */}
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Régions</div>
            <div className="stat-icon">
              <svg viewBox="0 0 24 24">
                <path d="M3 3v18h18" /><path d="M7 14l4-4 4 4 5-5" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{totalRegions ?? '—'}</div>
          <div className="stat-trend">Dans la cave</div>
        </div>

        {/* Average */}
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Moy. par cru</div>
            <div className="stat-icon">
              <svg viewBox="0 0 24 24">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7H14a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
          </div>
          <div className="stat-value">{average ?? '—'}</div>
          <div className="stat-trend warn">Bouteilles / cru</div>
        </div>

        {/* Color breakdown cards */}
        {couleurData.length > 0 && (
          <div className="couleur-cards">
            {couleurData.map((c) => {
              const cfg = COULEUR_CONFIG[c.type_vin] ?? { color: '#9d8e87' }
              const pct = totalCouleur > 0 ? Math.round((c.quantite / totalCouleur) * 100) : 0
              return (
                <div className="couleur-card" key={c.type_vin} style={{ '--cc-color': cfg.color }}>
                  <div className="cc-header">
                    <span className="cc-dot" />
                    <span className="cc-label">{c.type_vin}</span>
                  </div>
                  <div className="cc-value">{c.quantite}</div>
                  <div className="cc-bar-wrap">
                    <div className="cc-bar" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="cc-pct">{pct} %</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Millesime bar chart */}
        {millesimeData.length > 0 && (
          <div className="chart-card">
            <h3>Par millésime</h3>
            <div className="chart-sub">Quantité de bouteilles par année</div>
            <div className="chart-bars">
              {millesimeData.map((m) => (
                <div
                  key={m.millesime}
                  className="bar"
                  style={{ height: `${Math.round((m.quantite / maxMillesime) * 100)}%` }}
                  data-value={`${m.quantite} btl`}
                />
              ))}
            </div>
            <div className="chart-labels">
              {millesimeData.map((m) => (
                <span key={m.millesime}>{m.millesime}</span>
              ))}
            </div>
          </div>
        )}

        {/* Region donut chart */}
        {regionData.length > 0 && (
          <div className="donut-card">
            <h3>Par région</h3>
            <div className="donut-body">
              <DonutChart segments={regionSegments} />
              <div className="donut-legend">
                {regionSegments.map((seg, i) => (
                  <div className="donut-legend-item" key={i}>
                    <span className="donut-legend-dot" style={{ background: seg.color }} />
                    <span className="donut-legend-label">{seg.label}</span>
                    <span className="donut-legend-count">{seg.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
