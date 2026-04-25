import { useState, useEffect, useMemo } from 'react'
import { getAllWine } from '../api/wineApi'

const ROBES = ['Tous', 'Rouge', 'Blanc', 'Rosé', 'Bulles', 'Liqueur']

function categorieToPill(cat) {
  if (!cat) return ''
  const c = cat.toLowerCase()
  if (c.includes('blanc')) return 'blanc'
  if (c.includes('ros')) return 'rose'
  if (c.includes('bull') || c.includes('champ') || c.includes('mousss')) return 'bulles'
  if (c.includes('liqueur') || c.includes('doux')) return 'liqueur'
  return ''
}

export default function Cave({ navigate }) {
  const [wines, setWines] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeRobe, setActiveRobe] = useState('Tous')

  useEffect(() => {
    getAllWine()
      .then((data) => setWines(data))
      .catch(() => setWines([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return wines.filter((w) => {
      const matchRobe =
        activeRobe === 'Tous' ||
        w.categorie?.toLowerCase().includes(activeRobe.toLowerCase())
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        w.cru?.toLowerCase().includes(q) ||
        w.appellation?.toLowerCase().includes(q) ||
        w.producteur?.toLowerCase().includes(q) ||
        String(w.millesime ?? '').includes(q)
      return matchRobe && matchSearch
    })
  }, [wines, search, activeRobe])

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>
            Ma <em>cave</em>
          </h1>
          <div className="subtitle">
            {wines.length} bouteilles · {new Set(wines.map((w) => w.producteur)).size} domaines
          </div>
        </div>
        <button className="btn" onClick={() => navigate('ajout')}>
          <svg className="btn-icon" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Ajouter
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-5-5" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un domaine, un cru, un millésime…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-chips">
          {ROBES.map((r) => (
            <button
              key={r}
              className={`chip${activeRobe === r ? ' active' : ''}`}
              onClick={() => setActiveRobe(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="loading">
          <span className="spinner" /> Chargement de la cave…
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>Aucun vin ne correspond à cette recherche</p>
        </div>
      )}

      <div className="wine-grid">
        {filtered.map((w, i) => {
          const pillClass = categorieToPill(w.categorie)
          return (
            <div className="wine-card" key={i}>
              <div className="wine-card-top">
                <div className={`color-pill ${pillClass}`}>
                  <span className="color-dot" />
                  {w.categorie}
                </div>
                {w.millesime && (
                  <div className="wine-millesime">{w.millesime}</div>
                )}
              </div>
              <div className="wine-name">{w.cru}</div>
              <div className="wine-domain">{w.producteur}</div>
              <div className="wine-region">{w.appellation}</div>
              <div className="wine-footer">
                <div className="wine-stock">
                  <span className="stock-num">{w.quantite}</span>
                  <span className="stock-label">btl</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
