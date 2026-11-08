import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { getAllWine, getQuantityByWine, getLocationByCru, updateWine, addWineLocation } from '../api/wineApi'
import { CaveView3D } from '../components/CaveView3D'

const ROBES = ['Tous', 'Rouge', 'Blanc', 'Rosé', 'Effervescent', 'Liqueur']

const ACCENT_COLORS = {
  rouge:        'rgb(220,38,38)',
  blanc:        'rgb(251,191,36)',
  rose:         'rgb(236,72,153)',
  effervescent: 'rgb(255,191,171)',
  liqueur:      'rgb(134,153,0)',
}

function norm(s) {
  return (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
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

function extractErrorMessage(err) {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join(', ')
  return 'La mise à jour a échoué'
}

/* ── Modal de confirmation (même style que WineModal) ────────── */
function ConfirmModal({ wine, row, onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="modal-overlay modal-overlay-confirm" onClick={onCancel}>
      <div
        className="modal-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ borderTopColor: 'rgb(185,28,28)' }}>
          <div>
            <div className="modal-title" id="confirm-title">Archiver ce vin ?</div>
            <div className="modal-sub">
              {wine.cru}{wine.producteur ? ` · ${wine.producteur}` : ''}
            </div>
          </div>
          <button className="modal-close" onClick={onCancel} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-row">
            <div className="modal-row-top">
              <div className="modal-millesime">{row.millesime ?? '—'}</div>
              <div className="modal-qty-ctrl">
                <div className="qty-display">
                  <span className="qty-value">0</span>
                  <span className="qty-original">était {row.quantite}</span>
                </div>
                <span className="qty-label">btl</span>
              </div>
            </div>

            <div className="modal-raison">
              <div className="modal-raison-label">Conséquence</div>
              <p className="confirm-text">
                Il ne restera plus aucune bouteille. Le vin sera archivé et retiré de la cave.
              </p>
              <div className="modal-action-row">
                <button className="btn danger" onClick={onConfirm} autoFocus>
                  Archiver
                </button>
                <button className="btn ghost" onClick={onCancel}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Modal d'une bouteille ───────────────────────────────────── */
function WineModal({ wine, onClose, onSaved }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState({})
  const [reasons, setReasons] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [saved, setSaved] = useState({})
  const [error, setError] = useState('')
  const [pendingRow, setPendingRow] = useState(null)   // ligne en attente de confirmation (qté → 0)
  const [locations, setLocations] = useState([])
  const [showLocation, setShowLocation] = useState(false)
  const [editingLocation, setEditingLocation] = useState(false)
  const [locForm, setLocForm] = useState({ clayette: '', rangee: '', index_id: '' })
  const [savingLoc, setSavingLoc] = useState(false)
  const [show3D, setShow3D] = useState(false)

  // Bloque le scroll de la page derrière la modale (important sur téléphone)
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    Promise.allSettled([
      getQuantityByWine(wine.cru),
      getLocationByCru(wine.cru),
    ]).then(([qty, loc]) => {
      if (qty.status === 'fulfilled') {
        const all = qty.value
        const millesime = Number(wine.millesime)
        const filtered = millesime
          ? all.filter((r) => Number(r.millesime) === millesime)
          : all
        const list = filtered.length > 0 ? filtered : all
        setRows(list)
        const init = {}
        list.forEach((r) => { init[r.BID] = r.quantite })
        setQuantities(init)
      }
      if (loc.status === 'fulfilled') setLocations(loc.value)
      setLoading(false)
    })
  }, [wine.cru, wine.millesime])

  const cancelConfirm = useCallback(() => setPendingRow(null), [])

  // Envoi effectif à l'API
  const performSave = async (row) => {
    const newQty = quantities[row.BID]
    const delta = newQty - row.quantite
    const reason = reasons[row.BID]

    if (delta === 0 || !reason) return

    // Retire les emojis, puis met en majuscules (BU / CADEAU / ACHAT)
    const cleanedReason = reason.replace(/[^\p{L}\p{N}\s-]/gu, '').trim().toUpperCase()

    const payload = {
      Id_Bouteille: row.BID,
      Qte: Math.abs(delta),                          // delta, jamais la quantité finale
      Raison: cleanedReason,
      Operation: delta > 0 ? 'AUGMENTATION' : 'DIMINUTION',
    }

    setSavingId(row.BID)
    setError('')
    try {
      console.log('Envoi updateWine payload:', payload)
      await updateWine(payload)

      setSaved((s) => ({ ...s, [row.BID]: true }))
      setTimeout(() => setSaved((s) => ({ ...s, [row.BID]: false })), 2500)
      setReasons((p) => ({ ...p, [row.BID]: undefined }))

      if (newQty === 0) {
        // La bouteille est archivée et supprimée côté base
        const remaining = rows.filter((r) => r.BID !== row.BID)
        setRows(remaining)
        if (remaining.length === 0) {
          onSaved()
          onClose()
          return
        }
      } else {
        // Met à jour la quantité de référence, sinon `changed` reste vrai
        setRows((rs) => rs.map((r) => (r.BID === row.BID ? { ...r, quantite: newQty } : r)))
      }
      onSaved()
    } catch (err) {
      console.error('updateWine a échoué:', err)
      setError(extractErrorMessage(err))
    } finally {
      setSavingId(null)
    }
  }

  // Clic sur "Enregistrer" : confirmation seulement si la quantité tombe à 0
  const handleSave = (row) => {
    const newQty = quantities[row.BID]
    if (newQty - row.quantite === 0 || !reasons[row.BID]) return

    if (newQty === 0) {
      setPendingRow(row)
      return
    }
    performSave(row)
  }

  const handleConfirmArchive = () => {
    const row = pendingRow
    setPendingRow(null)
    if (row) performSave(row)
  }

  const handleSaveLocation = async () => {
    setSavingLoc(true)
    try {
      const newLoc = {
        clayette: Number(locForm.clayette),
        rangee: Number(locForm.rangee),
        index_id: Number(locForm.index_id),
      }
      await addWineLocation(wine.cru, newLoc)
      setLocations([{ ...newLoc, cru: wine.cru }])
      setEditingLocation(false)
    } catch (err) {
      console.error('addWineLocation a échoué:', err)
      setError(extractErrorMessage(err))
    } finally {
      setSavingLoc(false)
    }
  }

  const pillClass = categorieToPill(wine.categorie)
  const accent = ACCENT_COLORS[pillClass] ?? 'var(--bordeaux)'

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header" style={{ borderTopColor: accent }}>
            <div>
              <div className="modal-title">{wine.cru}</div>
              <div className="modal-sub">
                {wine.appellation}{wine.producteur ? ` · ${wine.producteur}` : ''}
              </div>
            </div>
            <button className="modal-close" onClick={onClose} aria-label="Fermer"><X size={18} /></button>
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
                  // Ignore une raison devenue invalide quand on change de sens (+ / −)
                  const reason = RAISONS.includes(reasons[row.BID]) ? reasons[row.BID] : undefined

                  return (
                    <div className="modal-row" key={row.BID}>
                      <div className="modal-row-top">
                        <div className="modal-millesime">{row.millesime ?? '—'}</div>
                        <div className="modal-qty-ctrl">
                          <button
                            className="qty-btn"
                            aria-label="Retirer une bouteille"
                            onClick={() => setQuantities((q) => ({ ...q, [row.BID]: Math.max(0, qty - 1) }))}
                          >−</button>
                          <div className="qty-display">
                            <span className="qty-value">{qty}</span>
                            {changed && (
                              <span className="qty-original">était {row.quantite}</span>
                            )}
                          </div>
                          <button
                            className="qty-btn"
                            aria-label="Ajouter une bouteille"
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
                                className={`raison-chip${reason === r ? ' active' : ''}`}
                                onClick={() => setReasons((p) => ({ ...p, [row.BID]: r }))}
                              >{r}</button>
                            ))}
                          </div>
                          <div className="modal-action-row">
                            <button
                              className="btn"
                              onClick={() => handleSave(row)}
                              disabled={!reason || savingId !== null}
                            >
                              {saved[row.BID]
                                ? '✓ Enregistré'
                                : savingId === row.BID
                                  ? 'Enregistrement…'
                                  : 'Enregistrer'}
                            </button>
                            <button
                              className="btn ghost"
                              onClick={() => {
                                setQuantities((q) => ({ ...q, [row.BID]: row.quantite }))
                                setReasons((p) => ({ ...p, [row.BID]: undefined }))
                              }}
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                {error && <div className="modal-error" role="alert">{error}</div>}

                <div className="modal-extra-btns">
                  <button
                    className={`btn ghost${showLocation ? ' active-ghost' : ''}`}
                    onClick={() => setShowLocation((v) => !v)}
                  >
                    📍 Localisation
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => setShow3D(true)}
                  >🧊 Voir en 3D</button>
                </div>

                {showLocation && (
                  <div className="modal-location">
                    {!editingLocation ? (
                      <>
                        {locations.length === 0 ? (
                          <div className="modal-location-empty">Aucune localisation enregistrée</div>
                        ) : (
                          locations.map((loc, i) => (
                            <div className="modal-location-row" key={i}>
                              <div className="modal-location-item">
                                <span className="modal-location-label">Clayette</span>
                                <span className="modal-location-value">{loc.clayette ?? '—'}</span>
                              </div>
                              <div className="modal-location-item">
                                <span className="modal-location-label">Rangée</span>
                                <span className="modal-location-value">{loc.rangee ?? '—'}</span>
                              </div>
                              <div className="modal-location-item">
                                <span className="modal-location-label">Position</span>
                                <span className="modal-location-value">{loc.index_id ?? '—'}</span>
                              </div>
                            </div>
                          ))
                        )}
                        <button
                          className="btn ghost"
                          style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}
                          onClick={() => {
                            const first = locations[0]
                            setLocForm({
                              clayette: first?.clayette ?? '',
                              rangee: first?.rangee ?? '',
                              index_id: first?.index_id ?? '',
                            })
                            setEditingLocation(true)
                          }}
                        >
                          ✏️ Modifier la localisation
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="modal-loc-fields">
                          {[
                            { key: 'clayette', label: 'Clayette' },
                            { key: 'rangee',   label: 'Rangée' },
                            { key: 'index_id', label: 'Position' },
                          ].map(({ key, label }) => (
                            <div className="modal-loc-field" key={key}>
                              <span className="modal-location-label">{label}</span>
                              <input
                                type="number"
                                inputMode="numeric"
                                className="loc-input"
                                value={locForm[key]}
                                onChange={(e) => setLocForm((f) => ({ ...f, [key]: e.target.value }))}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="modal-action-row" style={{ marginTop: 14 }}>
                          <button
                            className="btn"
                            disabled={savingLoc}
                            onClick={handleSaveLocation}
                          >
                            {savingLoc ? 'Enregistrement…' : 'Enregistrer'}
                          </button>
                          <button
                            className="btn ghost"
                            onClick={() => setEditingLocation(false)}
                          >
                            Annuler
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmation (hors de l'overlay principal) */}
      {pendingRow && (
        <ConfirmModal
          wine={wine}
          row={pendingRow}
          onConfirm={handleConfirmArchive}
          onCancel={cancelConfirm}
        />
      )}

      {/* Hors de l'overlay pour qu'un clic dans la vue 3D ne ferme pas la modale */}
      <CaveView3D
        open={show3D}
        onClose={() => setShow3D(false)}
        highlightBottle={locations[0] ? {
          rack:  locations[0].clayette,
          row:   locations[0].rangee,
          index: locations[0].index_id,
        } : null}
      />
    </>
  )
}

/* ── Page Cave ───────────────────────────────────────────────── */
export default function Cave({ navigate }) {
  const [wines, setWines] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeRobe, setActiveRobe] = useState('Tous')
  const [modalWine, setModalWine] = useState(null)

  const loadWines = () =>
    getAllWine()
      .then((data) => setWines(data))
      .catch(() => setWines([]))

  useEffect(() => {
    loadWines().finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = norm(search)
    return wines.filter((w) => {
      const matchRobe =
        activeRobe === 'Tous' ||
        norm(w.categorie).includes(norm(activeRobe))
      const matchSearch =
        !q ||
        norm(w.cru).includes(q) ||
        norm(w.appellation).includes(q) ||
        norm(w.producteur).includes(q) ||
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
        {filtered.map((w) => {
          const pillClass = categorieToPill(w.categorie)
          return (
            <div
              className="wine-card"
              key={`${w.cru}-${w.millesime}-${w.producteur}`}
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
        <WineModal
          wine={modalWine}
          onClose={() => setModalWine(null)}
          onSaved={loadWines}
        />
      )}
    </section>
  )
}