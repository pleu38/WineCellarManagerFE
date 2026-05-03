import { useState, useEffect } from 'react'
import { Download, TrendingDown } from 'lucide-react'
import { getBottleHistory } from '../api/wineApi'

function tagClass(raison) {
  if (!raison) return 'repas'
  const r = raison.toLowerCase()
  if (r.includes('dégust') || r.includes('degust')) return 'degustation'
  if (r.includes('cadeau') || r.includes('offert') || r.includes('don')) return 'cadeau'
  return 'repas'
}

function tagLabel(raison) {
  if (!raison) return 'Sortie'
  const r = raison.toLowerCase()
  if (r.includes('dégust') || r.includes('degust')) return 'Dégustation'
  if (r.includes('cadeau') || r.includes('offert') || r.includes('don')) return 'Cadeau'
  return 'Grand repas'
}

function groupByMonth(entries) {
  const map = {}
  entries.forEach((e) => {
    const d = new Date(e.date_mouvement)
    const key = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    if (!map[key]) map[key] = []
    map[key].push(e)
  })
  return Object.entries(map)
}

export default function Historique() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBottleHistory()
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [])

  const grouped = groupByMonth(history)

  const totalThisMonth = (() => {
    const now = new Date()
    return history.filter((h) => {
      const d = new Date(h.date_mouvement)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
  })()

  const favType = (() => {
    const counts = {}
    history.forEach((h) => {
      if (h.type_vin) counts[h.type_vin] = (counts[h.type_vin] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
  })()

  const totalGifts = history.filter((h) =>
    h.raison_sortie?.toLowerCase().includes('cadeau')
  ).length

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Historique <em>des sorties</em></h1>
          <div className="subtitle">{history.length} bouteilles consommées au total</div>
        </div>
        <button className="btn ghost">
          <Download className="btn-icon" />
          Exporter
        </button>
      </div>

      <div className="history-stats">
        <div className="stat-card">
          <div className="stat-label" style={{ marginBottom: 12 }}>Ce mois</div>
          <div className="stat-value">{totalThisMonth}</div>
          <div className="stat-trend">Sorties récentes</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ marginBottom: 12 }}>Type favori</div>
          <div className="stat-value" style={{ fontSize: 28 }}>{favType}</div>
          <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>Le plus consommé</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ marginBottom: 12 }}>Total sorties</div>
          <div className="stat-value" style={{ fontSize: 28 }}>{history.length}</div>
          <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>Depuis le début</div>
        </div>
        <div className="stat-card">
          <div className="stat-label" style={{ marginBottom: 12 }}>Pour offrir</div>
          <div className="stat-value">{totalGifts}</div>
          <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>Cadeaux offerts</div>
        </div>
      </div>

      {loading && (
        <div className="loading"><span className="spinner" /> Chargement de l'historique…</div>
      )}

      {!loading && history.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>Aucune sortie enregistrée</p>
        </div>
      )}

      {!loading && grouped.length > 0 && (
        <div className="timeline">
          {grouped.map(([month, entries]) => (
            <div key={month}>
              <div className="tl-month-sep">
                <span className="tl-month-label">
                  {month.charAt(0).toUpperCase() + month.slice(1)}
                </span>
                <span className="tl-month-badge">
                  {entries.length} sortie{entries.length > 1 ? 's' : ''}
                </span>
              </div>

              {entries.map((e, i) => {
                const d = new Date(e.date_mouvement)
                return (
                  <div className="tl-item" key={i}>
                    <div className="tl-dot">
                      <span className="tl-day-num">
                        {String(d.getDate()).padStart(2, '0')}
                      </span>
                      <span className="tl-day-name">
                        {d.toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </span>
                    </div>

                    <div className="tl-card">
                      <div className="tl-card-top">
                        <span className="tl-wine-name">
                          {e.cru}{e.millesime ? ` ${e.millesime}` : ''}
                        </span>
                        <div className="tl-card-right">
                          <div className="tl-qty-minus">
                            <div className="tl-qty-badge">
                              <TrendingDown size={14} />
                            </div>
                            <span>−{e.qte_mouvement}</span>
                          </div>
                        </div>
                      </div>
                      <div className="tl-context">
                        {[tagLabel(e.raison_sortie), e.type_vin ?? e.categorie].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
