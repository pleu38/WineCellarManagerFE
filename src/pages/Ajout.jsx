import { useState, useEffect } from 'react'
import { getPays, getRegionsByPays, getAppellationsByRegion, getProducteursByAppellation, addWine } from '../api/wineApi'

const TYPES = [
  { id: 'Rouge', cls: 'rouge' },
  { id: 'Blanc', cls: 'blanc' },
  { id: 'Rosé', cls: 'rose' },
  { id: 'Bulles', cls: 'bulles' },
  { id: 'Liqueur', cls: 'liqueur' },
]

const EMPTY = {
  type: 'Rouge',
  cru: '',
  millesime: '',
  producteur: '',
  appellation: '',
  region: '',
  pays: '',
  quantite: '6',
  apoStart: '',
  apoEnd: '',
  notes: '',
}

export default function Ajout({ navigate }) {
  const [form, setForm] = useState(EMPTY)
  const [paysList, setPaysList] = useState([])
  const [regionsList, setRegionsList] = useState([])
  const [appellationsList, setAppellationsList] = useState([])
  const [producteursList, setProducteursList] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    getPays().catch(() => []).then(setPaysList)
  }, [])

  useEffect(() => {
    if (!form.pays) { setRegionsList([]); return }
    getRegionsByPays(form.pays).catch(() => []).then(setRegionsList)
    setForm((f) => ({ ...f, region: '', appellation: '', producteur: '' }))
  }, [form.pays])

  useEffect(() => {
    if (!form.region) { setAppellationsList([]); return }
    getAppellationsByRegion(form.region).catch(() => []).then(setAppellationsList)
    setForm((f) => ({ ...f, appellation: '', producteur: '' }))
  }, [form.region])

  useEffect(() => {
    if (!form.appellation) { setProducteursList([]); return }
    getProducteursByAppellation(form.appellation).catch(() => []).then(setProducteursList)
    setForm((f) => ({ ...f, producteur: '' }))
  }, [form.appellation])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await addWine({
        cru: form.cru,
        millesime: form.millesime ? parseInt(form.millesime) : null,
        producteur: form.producteur,
        appellation: form.appellation,
        categorie: form.type,
        quantite: parseInt(form.quantite) || 0,
      })
      setSuccess(true)
      setForm(EMPTY)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      // keep form as-is on error
    } finally {
      setSubmitting(false)
    }
  }

  const preview = {
    name: form.cru || 'Nouveau cru',
    year: form.millesime || '— —',
    domain: form.producteur || 'Saisie en cours…',
    qty: (form.quantite || '0') + ' btl',
    region: form.region || '—',
    apo: form.apoStart && form.apoEnd ? `${form.apoStart} — ${form.apoEnd}` : 'À définir',
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>
            Inscrire <em>un vin</em>
          </h1>
          <div className="subtitle">Ajoutez un nouveau cru à votre cave personnelle.</div>
        </div>
        <button className="btn ghost" onClick={() => navigate('accueil')}>
          ← Retour
        </button>
      </div>

      {success && (
        <div
          style={{
            background: '#e8f3ea',
            border: '1px solid rgba(74,143,86,0.3)',
            borderRadius: 10,
            padding: '14px 20px',
            marginBottom: 24,
            color: '#2d6638',
            fontFamily: "'Geist Mono', monospace",
            fontSize: 13,
          }}
        >
          ✓ Vin inscrit avec succès dans votre cave !
        </div>
      )}

      <form className="add-layout" onSubmit={handleSubmit}>
        <div className="form-card">
          {/* Section 1 */}
          <div className="form-section">
            <div className="form-section-title">
              <span className="form-section-num">1</span>Identification
            </div>
            <div className="form-section-desc">Type, nom du cru et millésime.</div>

            <div className="form-row full">
              <div className="field">
                <label>Type de vin</label>
                <div className="type-selector">
                  {TYPES.map((t) => (
                    <div
                      key={t.id}
                      className={`type-option${form.type === t.id ? ' selected' : ''}`}
                      onClick={() => setForm((f) => ({ ...f, type: t.id }))}
                    >
                      <div className={`type-color ${t.cls}`} />
                      <div className="type-label">{t.id}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Cuvée / Cru</label>
                <input
                  type="text"
                  placeholder="Ex. Les Charmes"
                  value={form.cru}
                  onChange={set('cru')}
                />
              </div>
              <div className="field">
                <label>Millésime</label>
                <input
                  type="number"
                  placeholder="2019"
                  value={form.millesime}
                  onChange={set('millesime')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Producteur / Domaine</label>
                {producteursList.length > 0 ? (
                  <select value={form.producteur} onChange={set('producteur')}>
                    <option value="">Sélectionner…</option>
                    {producteursList.map((p) => (
                      <option key={p.producteur} value={p.producteur}>{p.producteur}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Ex. Domaine Coche-Dury"
                    value={form.producteur}
                    onChange={set('producteur')}
                  />
                )}
              </div>
              <div className="field">
                <label>Appellation</label>
                {appellationsList.length > 0 ? (
                  <select value={form.appellation} onChange={set('appellation')}>
                    <option value="">Sélectionner…</option>
                    {appellationsList.map((a) => (
                      <option key={a.appellation} value={a.appellation}>{a.appellation}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Ex. Meursault 1er Cru"
                    value={form.appellation}
                    onChange={set('appellation')}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="form-section">
            <div className="form-section-title">
              <span className="form-section-num">2</span>Provenance &amp; quantité
            </div>
            <div className="form-section-desc">Pays, région, et stock.</div>

            <div className="form-row three">
              <div className="field">
                <label>Pays</label>
                {paysList.length > 0 ? (
                  <select value={form.pays} onChange={set('pays')}>
                    <option value="">Sélectionner…</option>
                    {paysList.map((p) => (
                      <option key={p.pays} value={p.pays}>{p.pays}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="France"
                    value={form.pays}
                    onChange={set('pays')}
                  />
                )}
              </div>
              <div className="field">
                <label>Région</label>
                {regionsList.length > 0 ? (
                  <select value={form.region} onChange={set('region')}>
                    <option value="">Sélectionner…</option>
                    {regionsList.map((r) => (
                      <option key={r.region} value={r.region}>{r.region}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Ex. Bourgogne"
                    value={form.region}
                    onChange={set('region')}
                  />
                )}
              </div>
              <div className="field">
                <label>Quantité</label>
                <input
                  type="number"
                  placeholder="6"
                  min="1"
                  value={form.quantite}
                  onChange={set('quantite')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label>Apogée — début</label>
                <input
                  type="number"
                  placeholder="2026"
                  value={form.apoStart}
                  onChange={set('apoStart')}
                />
              </div>
              <div className="field">
                <label>Apogée — fin</label>
                <input
                  type="number"
                  placeholder="2035"
                  value={form.apoEnd}
                  onChange={set('apoEnd')}
                />
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="form-section">
            <div className="form-section-title">
              <span className="form-section-num">3</span>Notes de dégustation
            </div>
            <div className="form-section-desc">Optionnel — votre ressenti et accords.</div>

            <div className="form-row full">
              <div className="field">
                <label>Commentaires</label>
                <textarea
                  placeholder="Robe rubis profond, nez de fruits noirs et d'épices douces…"
                  value={form.notes}
                  onChange={set('notes')}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn" type="submit" disabled={submitting}>
              <svg className="btn-icon" viewBox="0 0 24 24">
                <path d="M5 12l5 5L20 7" />
              </svg>
              {submitting ? 'Inscription…' : 'Inscrire au registre'}
            </button>
            <button
              className="btn ghost"
              type="button"
              onClick={() => setForm(EMPTY)}
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div className="preview-card">
          <div className="preview-label">Aperçu en direct</div>

          <div className="bottle-mockup">
            <div className="bottle-label">
              <div className="bottle-label-text">
                {preview.name.length > 16 ? preview.name.slice(0, 16) + '…' : preview.name}
              </div>
              <div className="bottle-label-year">{preview.year}</div>
            </div>
          </div>

          <div className="preview-name">{preview.name}</div>
          <div className="preview-domain">{preview.domain}</div>

          <div className="preview-grid">
            <div className="preview-stat">
              <div className="preview-stat-label">Quantité</div>
              <div className="preview-stat-value">{preview.qty}</div>
            </div>
            <div className="preview-stat">
              <div className="preview-stat-label">Millésime</div>
              <div className="preview-stat-value">{preview.year}</div>
            </div>
            <div className="preview-stat">
              <div className="preview-stat-label">Région</div>
              <div className="preview-stat-value">{preview.region}</div>
            </div>
            <div className="preview-stat">
              <div className="preview-stat-label">Apogée</div>
              <div className="preview-stat-value">{preview.apo}</div>
            </div>
          </div>
        </div>
      </form>
    </section>
  )
}
