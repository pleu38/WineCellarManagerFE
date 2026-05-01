import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { getAllWine, getQuantityByWine, updateWine } from '../api/wineApi'

const ROBES = ['Tous', 'Rouge', 'Blanc', 'Rosé', 'Effervescent', 'Liqueur']

const ACCENT_COLORS = {
  rouge:        'rgb(220,38,38)',
  blanc:        'rgb(251,191,36)',
  rose:         'rgb(236,72,153)',
  effervescent: 'rgb(255,191,171)',
  liqueur:      'rgb(134,153,0)',
}

function norm(s) {
  return (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function categorieToPill(cat) {
  if (!cat) return ''
  const c = norm(cat)
  if (c.includes('blanc')) return 'blanc'
  if (c.includes('ros')) return 'rose'
  if (c.includes('efferv') || c.includes('bull') || c.includes('champ') || c.includes('mouss')) return 'effervescent'
  if (c.includes('liqueur') || c.includes('doux')) return 'liqueur'
  return 'rouge'
}

function WineModal({ wine, onClose }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState({})
  const [reasons, setReasons] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState({})

  useEffect(() => {
    getQuantityByWine(wine.cru)
      .then((data) => {
        setRows(data)
        const init = {}
        data.forEach((r) => { init[r.BID] = r.quantite })
        setQuantities(init)
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [wine.cru])

  const handleSave = async (row) => {
    setSaving(true)
    try {
      await updateWine({ BID: row.BID, quantite: quantities[row.BID], raison: reasons[row.BID] })
      setSaved((s) => ({ ...s, [row.BID]: true }))
      setTimeout(() => setSaved((s) => ({ ...s, [row.BID]: false })), 2500)
    } catch {
      // keep state on error
    } finally {
      setSaving(false)
    }
  }

  const pillClass = categorieToPill(wine.categorie)
  const accent = ACCENT_COLORS[pillClass] ?? 'var(--bordeaux)'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ borderTopColor: accent }}>
          <div>
            <div className="modal-title">{wine.cru}</div>
            <div className="modal-sub">{wine.appellation}{wine.producteur ? ` · ${wine.producteur}` : ''}</div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="modal-loading"><span className="spinner" /> Chargement…</div>
          ) : rows.length === 0 ? (
            <div className="modal-empty">Aucune entrée trouvée</div>
          ) : (
            <div className="modal-rows">
              {rows.map((row) => {
                const qty = quantities[row.BID] ?? row.quantite
                const changed = qty !== row.quantite
                const decreasing = qty < row.quantite
                const RAISONS = decreasing ? ['🍷 Bu', '🎁 Cadeau'] : ['🛒 Achat', '🎁 Cadeau']
                return (
                  <div className="modal-row" key={row.BID}>
                    <div className="modal-row-top">
                      <div className="modal-millesime">{row.millesime ?? '—'}</div>
                      <div className="modal-qty-ctrl">
                        <button
                          className="qty-btn"
                          onClick={() => setQuantities((q) => ({ ...q, [row.BID]: Math.max(0, qty - 1) }))}
                        >−</button>
                        <span className="qty-value">{qty}</span>
                        <button
                          className="qty-btn"
                          onClick={() => setQuantities((q) => ({ ...q, [row.BID]: qty + 1 }))}
                        >+</button>
                        <span className="qty-label">btl</span>
                      </div>
                    </div>

                    {changed && (
                      <div className="modal-raison">
                        <div className="modal-raison-label">Raison</div>
                        <div className="modal-raison-chips">
                          {RAISONS.map((r) => (
                            <button
                              key={r}
                              className={`raison-chip${reasons[row.BID] === r ? ' active' : ''}`}
                              onClick={() => setReasons((p) => ({ ...p, [row.BID]: r }))}
                            >{r}</button>
                          ))}
                        </div>
                        <button
                          className="btn"
                          style={{ marginTop: 14, width: '100%' }}
                          onClick={() => handleSave(row)}
                          disabled={!reasons[row.BID] || saving}
                        >
                          {saved[row.BID] ? '✓ Enregistré' : saving ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Cave({ navigate }) {
  const [wines, setWines] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeRobe, setActiveRobe] = useState('Tous')
  const [modalWine, setModalWine] = useState(null)

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
        norm(w.categorie).includes(norm(activeRobe))
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
          <h1>Ma <em>cave</em></h1>
          <div className="subtitle">
            {wines.length} bouteilles · {new Set(wines.map((w) => w.producteur)).size} domaines
          </div>
        </div>
        <button className="btn" onClick={() => navigate('ajout')}>
          <Plus className="btn-icon" />
          Ajouter
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search className="search-icon" size={16} />
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
            <div
              className="wine-card"
              key={i}
              style={{ '--card-accent': ACCENT_COLORS[pillClass], cursor: pillClass === 'liqueur' ? 'default' : 'pointer' }}
              onClick={() => pillClass !== 'liqueur' && setModalWine(w)}
            >
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

      {modalWine && (
        <WineModal wine={modalWine} onClose={() => setModalWine(null)} />
      )}
    </section>
  )
}
