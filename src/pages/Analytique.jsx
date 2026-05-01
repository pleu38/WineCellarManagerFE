import { useState, useEffect } from 'react'
import { MapPinned, TrendingUp, Wine, BarChart3 } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList,
  PieChart, Pie,
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
  Rouge:        { color: '#dc2626' },
  Blanc:        { color: '#fbbf24' },
  Rosé:         { color: '#ec4899' },
  Rose:         { color: '#ec4899' },
  Effervescent: { color: '#ffbfab' },
  Liqueur:      { color: '#869900' },
}

const REGION_COLORS = [
  '#8b1538', '#b8884a', '#4a8f56', '#c98639',
  '#d68c95', '#9d8e87', '#b91c4a', '#6a9fb5',
  '#7b68ee', '#20b2aa',
]

function normalizeCouleur(raw) {
  if (!raw) return []
  // Object form: { "Rouge": 49, "Blanc": 31, ... }
  if (!Array.isArray(raw)) {
    return Object.entries(raw).map(([type_vin, quantite]) => ({ type_vin, quantite: Number(quantite) }))
  }
  // Array with one aggregated object: [{ "Rouge": 49, "Blanc": 31, ... }]
  // Detect by checking if every value in the first element is a number
  if (raw.length > 0 && typeof raw[0] === 'object' && Object.values(raw[0]).every((v) => typeof v === 'number')) {
    return Object.entries(Object.assign({}, ...raw)).map(([type_vin, quantite]) => ({
      type_vin,
      quantite: Number(quantite),
    }))
  }
  // Standard array: [{ type_vin/categorie: "Rouge", quantite: 49 }, ...]
  return raw.map((item) => ({
    type_vin: item.type_vin ?? item.categorie ?? item.couleur ?? item.name,
    quantite: Number(item.quantite ?? item.count ?? item.value ?? 0),
  })).filter((c) => c.type_vin)
}

const tooltipStyle = {
  fontFamily: 'Geist Mono, monospace',
  fontSize: 12,
  borderRadius: 8,
  border: '1px solid #f3ede6',
  boxShadow: '0 4px 12px rgba(60,30,35,0.08)',
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
        setTotalBottles(sum.value[0].somme)
      if (sumR.status === 'fulfilled' && sumR.value?.[0]?.compte_region != null)
        setTotalRegions(sumR.value[0].compte_region)
      if (regions.status === 'fulfilled') setRegionData(regions.value)
      if (millesimes.status === 'fulfilled')
        setMillesimeData(millesimes.value.sort((a, b) => a.millesime - b.millesime))
      if (avg.status === 'fulfilled' && avg.value?.[0]?.moyenne != null)
        setAverage(avg.value[0].moyenne)
      if (couleur.status === 'fulfilled')
        setCouleurData(normalizeCouleur(couleur.value))
      setLoading(false)
    })
  }, [])

  const colorChartData = couleurData.map((c) => ({
    name: c.type_vin,
    value: c.quantite,
    color: COULEUR_CONFIG[c.type_vin]?.color ?? '#9d8e87',
  }))

  const totalCouleur = colorChartData.reduce((s, c) => s + c.value, 0)

  const regionSorted = [...regionData]
    .sort((a, b) => a.quantite - b.quantite)
    .slice(0, 12)

  if (loading) {
    return (
      <section className="page">
        <div className="an-skeleton">
          {[...Array(4)].map((_, i) => <div key={i} className="an-skeleton-card" />)}
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

      {/* Feature card + 2 stat cards */}
      <div className="analytics-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card feature">
          <div className="stat-card-top">
            <div className="stat-label">Inventaire total</div>
            <div className="stat-icon"><Wine size={12} /></div>
          </div>
          <div className="stat-value">
            {totalBottles ?? '—'}<span className="stat-unit">vins différents</span>
          </div>
          <div className="stat-trend" style={{ color: 'rgba(255,220,230,0.9)' }}>
            {totalRegions ? `${totalRegions} régions représentées` : ''}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Régions</div>
            <div className="stat-icon"><MapPinned size={12} /></div>
          </div>
          <div className="stat-value">{totalRegions ?? '—'}</div>
          <div className="stat-trend">Dans la cave</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Moy. par cru</div>
            <div className="stat-icon"><TrendingUp size={12} /></div>
          </div>
          <div className="stat-value">{average ?? '—'}</div>
          <div className="stat-trend warn">Bouteilles / cru</div>
        </div>
      </div>

      {/* Color cards */}
      <div className="an-cards-row">
        <div className="an-card">
          <div className="an-card-hdr">
            <span className="an-card-title">Bouteilles totales</span>
            <Wine size={16} color="#9d8e87" />
          </div>
          <div className="an-card-value">{totalCouleur || '—'}</div>
          <div className="an-card-sub">Dans toute la collection</div>
        </div>
        {colorChartData.map(({ name, value, color }) => (
          <div className="an-card" key={name}>
            <div className="an-card-hdr">
              <span className="an-card-title">Vins {name}</span>
              <BarChart3 size={16} style={{ color }} />
            </div>
            <div className="an-card-value" style={{ color }}>{value}</div>
            <div className="an-card-sub">
              {totalCouleur > 0 ? Math.round((value / totalCouleur) * 100) : 0}% de la collection
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="an-chart-row">
        {colorChartData.length > 0 ? (
          <div className="an-chart-panel">
            <div className="an-chart-title">Répartition par couleur</div>
            <div className="an-chart-desc">Distribution des vins par type</div>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={colorChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={110}
                  innerRadius={68}
                  cornerRadius={10}
                  paddingAngle={6}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {colorChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v, n) => [`${v} btl`, n]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="an-chart-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9d8e87', fontSize: 14 }}>
            Aucune donnée de couleur disponible
          </div>
        )}

        {regionSorted.length > 0 && (
          <div className="an-chart-panel">
            <div className="an-chart-title">Par région</div>
            <div className="an-chart-desc">Classées par ordre croissant de bouteilles</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                layout="vertical"
                data={regionSorted}
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3ede6" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fontFamily: 'Geist Mono', fill: '#9d8e87' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="region"
                  width={90}
                  tick={{ fontSize: 11, fontFamily: 'Geist', fill: '#6b5a55' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v) => [`${v} btl`, 'Quantité']}
                  cursor={{ fill: 'rgba(139,21,56,0.04)' }}
                />
                <Bar dataKey="quantite" radius={[0, 4, 4, 0]}>
                  {regionSorted.map((_, i) => (
                    <Cell key={i} fill={REGION_COLORS[i % REGION_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Millesime chart */}
      {millesimeData.length > 0 && (
        <div className="an-chart-panel" style={{ marginTop: 16 }}>
          <div className="an-chart-title">Par millésime</div>
          <div className="an-chart-desc">Quantité de bouteilles par année</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={millesimeData} margin={{ top: 24, right: 8, left: -20, bottom: 0 }} barCategoryGap="28%">
              <defs>
                <linearGradient id="millesimeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b91c4a" stopOpacity={1} />
                  <stop offset="100%" stopColor="#8b1538" stopOpacity={0.7} />
                </linearGradient>
              </defs>
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
                contentStyle={tooltipStyle}
                formatter={(v) => [`${v} btl`, 'Quantité']}
                cursor={{ fill: 'rgba(139,21,56,0.04)' }}
              />
              <Bar dataKey="quantite" fill="url(#millesimeGrad)" radius={[6, 6, 0, 0]}>
                <LabelList
                  dataKey="quantite"
                  position="top"
                  style={{ fontSize: 10, fill: '#9d8e87', fontFamily: 'Geist Mono' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
