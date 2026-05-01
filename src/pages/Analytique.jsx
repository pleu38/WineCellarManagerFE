import { useState, useEffect } from 'react'
import { Wine, Map, Sigma } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from 'recharts'
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

const tooltipStyle = {
  contentStyle: {
    fontFamily: 'Geist Mono, monospace',
    fontSize: 12,
    borderRadius: 8,
    border: '1px solid #f3ede6',
    boxShadow: '0 4px 12px rgba(60,30,35,0.08)',
  },
  cursor: { fill: 'rgba(139,21,56,0.04)' },
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

  const totalCouleur = couleurData.reduce((s, c) => s + (c.quantite || 0), 0)

  const regionSegments = [...regionData]
    .sort((a, b) => a.quantite - b.quantite)
    .slice(0, 10)
    .map((r, i) => ({
      value: r.quantite,
      color: REGION_COLORS[i % REGION_COLORS.length],
      label: r.region,
      name: r.region,
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
              <Wine size={12} />
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
            <div className="stat-icon"><Map size={12} /></div>
          </div>
          <div className="stat-value">{totalRegions ?? '—'}</div>
          <div className="stat-trend">Dans la cave</div>
        </div>

        {/* Average */}
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Moy. par cru</div>
            <div className="stat-icon"><Sigma size={12} /></div>
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
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={millesimeData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3ede6" />
                <XAxis
                  dataKey="millesime"
                  tick={{ fontSize: 10, fontFamily: 'Geist Mono', fill: '#9d8e87' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fontFamily: 'Geist Mono', fill: '#9d8e87' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(v) => [`${v} btl`, 'Quantité']}
                />
                <Bar dataKey="quantite" fill="#8b1538" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Region donut chart */}
        {regionSegments.length > 0 && (
          <div className="donut-card">
            <h3>Par région</h3>
            <div className="donut-body">
              <PieChart width={180} height={180}>
                <Pie
                  data={regionSegments}
                  cx={90}
                  cy={90}
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {regionSegments.map((seg, i) => (
                    <Cell key={i} fill={seg.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle.contentStyle}
                  formatter={(v, n, p) => [`${v} btl`, p.payload.label]}
                />
              </PieChart>
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
