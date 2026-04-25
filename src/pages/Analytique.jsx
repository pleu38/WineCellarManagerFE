import { useState, useEffect, useRef } from 'react'
import {
  getSumCru,
  getSumRegion,
  getAnalyticsByRegion,
  getAnalyticsByMillesime,
  getAverageCru,
} from '../api/wineApi'

const REGION_COLORS = [
  'var(--bordeaux)',
  'var(--gold)',
  'var(--green)',
  'var(--amber)',
  'var(--rose)',
  'var(--text-muted)',
  'var(--bordeaux-bright)',
  '#6a9fb5',
]

export default function Analytique() {
  const [totalBottles, setTotalBottles] = useState(null)
  const [totalRegions, setTotalRegions] = useState(null)
  const [regionData, setRegionData] = useState([])
  const [millesimeData, setMillesimeData] = useState([])
  const [average, setAverage] = useState(null)
  const [loading, setLoading] = useState(true)
  const barsVisible = useRef(false)

  useEffect(() => {
    Promise.allSettled([
      getSumCru(),
      getSumRegion(),
      getAnalyticsByRegion(),
      getAnalyticsByMillesime(),
      getAverageCru(),
    ]).then(([sum, sumR, regions, millesimes, avg]) => {
      if (sum.status === 'fulfilled' && sum.value?.[0]?.somme != null)
        setTotalBottles(Math.round(sum.value[0].somme))
      if (sumR.status === 'fulfilled' && sumR.value?.[0]?.compte_region != null)
        setTotalRegions(sumR.value[0].compte_region)
      if (regions.status === 'fulfilled') setRegionData(regions.value)
      if (millesimes.status === 'fulfilled')
        setMillesimeData(millesimes.value.sort((a, b) => a.millesime - b.millesime))
      if (avg.status === 'fulfilled' && avg.value?.[0]?.moyenne != null)
        setAverage(Math.round(avg.value[0].moyenne * 10) / 10)
      setLoading(false)
    })
  }, [])

  const maxMillesime = Math.max(...millesimeData.map((m) => m.quantite), 1)
  const maxRegion = Math.max(...regionData.map((r) => r.quantite), 1)

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
          <h1>
            Analytique <em>de la cave</em>
          </h1>
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
            {totalBottles ?? '—'}<span className="stat-unit">bouteilles</span>
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

        {/* Millesime chart */}
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

        {/* Region bars */}
        {regionData.length > 0 && (
          <div className="region-card">
            <h3>Par région</h3>
            {regionData.map((r, i) => (
              <div className="region-row" key={r.region}>
                <span className="region-name">{r.region}</span>
                <div className="region-bar-wrap">
                  <div
                    className="region-bar"
                    style={{
                      width: `${Math.round((r.quantite / maxRegion) * 100)}%`,
                      background: REGION_COLORS[i % REGION_COLORS.length],
                    }}
                  />
                </div>
                <span className="region-count">{r.quantite}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
