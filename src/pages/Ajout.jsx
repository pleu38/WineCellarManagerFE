import { useState, useEffect, Fragment } from 'react'
import { Check, ArrowLeft, RotateCcw, Globe, MapPin, Landmark, User, Wine, Search } from 'lucide-react'
import { getPays, getRegionsByPays, getAppellationsByRegion, getProducteursByAppellation, addWine } from '../api/wineApi'

const STEPS = [
  { id: 'pays',        label: 'Pays',        Icon: Globe },
  { id: 'region',      label: 'Région',      Icon: MapPin },
  { id: 'appellation', label: 'Appellation', Icon: Landmark },
  { id: 'producteur',  label: 'Producteur',  Icon: User },
  { id: 'details',     label: 'Détails',     Icon: Wine },
]

const TYPES = [
  { id: 'Rouge',   cls: 'rouge' },
  { id: 'Blanc',   cls: 'blanc' },
  { id: 'Rosé',    cls: 'rose' },
  { id: 'Bulles',  cls: 'bulles' },
  { id: 'Liqueur', cls: 'liqueur' },
]

const EMPTY = {
  type: 'Rouge', cru: '', millesime: '', producteur: '',
  appellation: '', region: '', pays: '', pays_code: '',
  quantite: '6', apoStart: '', apoEnd: '', notes: '',
}

/* ── Step sub-components ─────────────────────────────────── */

function getCode(p) {
  return p.code ?? p.code_pays ?? p.pays_code ?? p.iso ?? p.alpha2 ?? p.alpha_2 ?? ''
}

function StepPays({ list, onSelect }) {
  const [q, setQ] = useState('')
  const filtered = list.filter((p) => {
    const code = getCode(p)
    return (
      p.pays.toLowerCase().includes(q.toLowerCase()) ||
      code.toLowerCase().includes(q.toLowerCase())
    )
  })
  return (
    <div className="wz-step">
      <div className="wz-step-hd">
        <div className="wz-step-title">Sélectionnez un pays</div>
        <div className="wz-step-sub">Pays d'origine du vin</div>
      </div>
      <div className="wz-search-wrap">
        <Search size={14} className="wz-search-icon" />
        <input
          className="wz-search"
          placeholder="Rechercher un pays…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
      </div>
      <div className="wz-list">
        {filtered.map((p) => {
          const code = getCode(p)
          return (
            <button key={p.pays} className="wz-item" onClick={() => onSelect(p)}>
              {code && <span className="wz-code">{code}</span>}
              <span className="wz-name">{p.pays}</span>
            </button>
          )
        })}
        {filtered.length === 0 && (
          <div className="wz-empty">Aucun pays trouvé</div>
        )}
      </div>
    </div>
  )
}

function StepRegion({ list, pays, paysCode, onSelect, onBack }) {
  const [q, setQ] = useState('')
  const filtered = list.filter((r) => r.region.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="wz-step">
      <div className="wz-step-hd">
        <button className="wz-back" onClick={onBack}>
          <ArrowLeft size={14} /> {pays}
          {paysCode && <span className="wz-code-sm">{paysCode}</span>}
        </button>
        <div className="wz-step-title">Sélectionnez une région</div>
        <div className="wz-step-sub">Région viticole en {pays}</div>
      </div>
      <div className="wz-search-wrap">
        <Search size={14} className="wz-search-icon" />
        <input
          className="wz-search"
          placeholder="Rechercher une région…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
      </div>
      <div className="wz-list">
        {filtered.map((r) => (
          <button key={r.region} className="wz-item" onClick={() => onSelect(r)}>
            <span className="wz-name">{r.region}</span>
          </button>
        ))}
        {filtered.length === 0 && <div className="wz-empty">Aucune région trouvée</div>}
      </div>
    </div>
  )
}

function StepAppellation({ list, region, onSelect, onBack }) {
  const [q, setQ] = useState('')
  const filtered = list.filter((a) =>
    (a.appellation ?? a.nom ?? '').toLowerCase().includes(q.toLowerCase())
  )
  return (
    <div className="wz-step">
      <div className="wz-step-hd">
        <button className="wz-back" onClick={onBack}>
          <ArrowLeft size={14} /> {region}
        </button>
        <div className="wz-step-title">Sélectionnez une appellation</div>
        <div className="wz-step-sub">AOP / IGP de la région {region}</div>
      </div>
      <div className="wz-search-wrap">
        <Search size={14} className="wz-search-icon" />
        <input
          className="wz-search"
          placeholder="Rechercher une appellation…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
      </div>
      <div className="wz-list">
        {filtered.map((a) => {
          const name = a.appellation ?? a.nom ?? ''
          return (
            <button key={name} className="wz-item" onClick={() => onSelect(a)}>
              <span className="wz-name">{name}</span>
            </button>
          )
        })}
        {filtered.length === 0 && <div className="wz-empty">Aucune appellation trouvée</div>}
      </div>
    </div>
  )
}

function StepProducteur({ list, appellation, onSelect, onBack, onSkip }) {
  const [q, setQ] = useState('')
  const filtered = list.filter((p) =>
    (p.producteur ?? p.nom ?? '').toLowerCase().includes(q.toLowerCase())
  )
  return (
    <div className="wz-step">
      <div className="wz-step-hd">
        <button className="wz-back" onClick={onBack}>
          <ArrowLeft size={14} /> {appellation}
        </button>
        <div className="wz-step-title">Sélectionnez un producteur</div>
        <div className="wz-step-sub">Domaine ou négociant</div>
      </div>
      <div className="wz-search-wrap">
        <Search size={14} className="wz-search-icon" />
        <input
          className="wz-search"
          placeholder="Rechercher un producteur…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
      </div>
      <div className="wz-list">
        {filtered.map((p) => {
          const name = p.producteur ?? p.nom ?? ''
          return (
            <button key={name} className="wz-item" onClick={() => onSelect(p)}>
              <span className="wz-name">{name}</span>
            </button>
          )
        })}
        {filtered.length === 0 && <div className="wz-empty">Aucun producteur trouvé</div>}
      </div>
      <button className="wz-skip" onClick={onSkip}>
        Saisir manuellement →
      </button>
    </div>
  )
}

function StepDetails({ form, setForm, onSubmit, submitting }) {
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  return (
    <div className="wz-step">
      <div className="wz-step-hd">
        <div className="wz-step-title">Détails du vin</div>
        <div className="wz-step-sub">Informations finales</div>
      </div>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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

        <div className="form-row">
          <div className="field">
            <label>Cuvée / Cru</label>
            <input type="text" placeholder="Ex. Les Charmes" value={form.cru} onChange={set('cru')} />
          </div>
          <div className="field">
            <label>Millésime</label>
            <input type="number" placeholder="2019" value={form.millesime} onChange={set('millesime')} />
          </div>
        </div>

        {!form.producteur && (
          <div className="field">
            <label>Producteur / Domaine</label>
            <input type="text" placeholder="Ex. Domaine Coche-Dury" value={form.producteur} onChange={set('producteur')} />
          </div>
        )}

        <div className="form-row">
          <div className="field">
            <label>Quantité</label>
            <input type="number" placeholder="6" min="1" value={form.quantite} onChange={set('quantite')} />
          </div>
          <div className="field">
            <label>Apogée — début</label>
            <input type="number" placeholder="2026" value={form.apoStart} onChange={set('apoStart')} />
          </div>
          <div className="field">
            <label>Apogée — fin</label>
            <input type="number" placeholder="2035" value={form.apoEnd} onChange={set('apoEnd')} />
          </div>
        </div>

        <div className="field">
          <label>Notes de dégustation</label>
          <textarea
            placeholder="Robe rubis profond, nez de fruits noirs…"
            value={form.notes}
            onChange={set('notes')}
          />
        </div>

        <div className="form-actions" style={{ paddingTop: 0, marginTop: 0, borderTop: 'none' }}>
          <button className="btn" type="submit" disabled={submitting}>
            <Check className="btn-icon" />
            {submitting ? 'Inscription…' : 'Inscrire au registre'}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ── Main component ──────────────────────────────────────── */

export default function Ajout({ navigate }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY)
  const [paysList, setPaysList] = useState([])
  const [regionsList, setRegionsList] = useState([])
  const [appellationsList, setAppellationsList] = useState([])
  const [producteursList, setProducteursList] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => { getPays().catch(() => []).then(setPaysList) }, [])

  useEffect(() => {
    if (!form.pays) { setRegionsList([]); return }
    getRegionsByPays(form.pays).catch(() => []).then(setRegionsList)
  }, [form.pays])

  useEffect(() => {
    if (!form.region) { setAppellationsList([]); return }
    getAppellationsByRegion(form.region).catch(() => []).then(setAppellationsList)
  }, [form.region])

  useEffect(() => {
    if (!form.appellation) { setProducteursList([]); return }
    getProducteursByAppellation(form.appellation).catch(() => []).then(setProducteursList)
  }, [form.appellation])

  const selectPays = (p) => {
    setForm((f) => ({ ...f, pays: p.pays, pays_code: getCode(p), region: '', appellation: '', producteur: '' }))
    setStep(1)
  }

  const selectRegion = (r) => {
    setForm((f) => ({ ...f, region: r.region, appellation: '', producteur: '' }))
    setStep(2)
  }

  const selectAppellation = (a) => {
    const name = a.appellation ?? a.nom ?? ''
    setForm((f) => ({ ...f, appellation: name, producteur: '' }))
    setStep(3)
  }

  const selectProducteur = (p) => {
    setForm((f) => ({ ...f, producteur: p.producteur ?? p.nom ?? '' }))
    setStep(4)
  }

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
      setStep(0)
      setTimeout(() => setSuccess(false), 4000)
    } catch {
      // keep form as-is on error
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setForm(EMPTY)
    setStep(0)
  }

  const preview = {
    name: form.cru || 'Nouveau cru',
    year: form.millesime || '— —',
    domain: form.producteur || form.appellation || 'Saisie en cours…',
    qty: (form.quantite || '0') + ' btl',
    region: form.region || form.pays || '—',
    apo: form.apoStart && form.apoEnd ? `${form.apoStart} — ${form.apoEnd}` : 'À définir',
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1>Inscrire <em>un vin</em></h1>
          <div className="subtitle">Ajoutez un nouveau cru à votre cave personnelle.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn ghost" type="button" onClick={reset}>
            <RotateCcw className="btn-icon" />
            Réinitialiser
          </button>
          <button className="btn ghost" onClick={() => navigate('accueil')}>
            <ArrowLeft className="btn-icon" />
            Retour
          </button>
        </div>
      </div>

      {success && (
        <div className="wz-success">
          <Check size={16} />
          Vin inscrit avec succès dans votre cave !
        </div>
      )}

      {/* Stepper */}
      <div className="wz-stepper">
        {STEPS.map((s, i) => {
          const done = i < step
          const active = i === step
          const { Icon } = s
          return (
            <Fragment key={s.id}>
              {i > 0 && <div className={`wz-connector${i <= step ? ' filled' : ''}`} />}
              <div className="wz-stepper-item">
                <button
                  className={`wz-circle${active ? ' active' : done ? ' done' : ''}`}
                  onClick={() => done ? setStep(i) : undefined}
                  style={{ cursor: done ? 'pointer' : 'default' }}
                >
                  {done ? <Check size={15} /> : <Icon size={15} />}
                </button>
                <span className={`wz-label${active ? ' active' : done ? ' done' : ''}`}>{s.label}</span>
              </div>
            </Fragment>
          )
        })}
      </div>

      {/* Content */}
      <div className="wz-layout">
        <div className="wz-main">
          {step === 0 && (
            <StepPays list={paysList} onSelect={selectPays} />
          )}
          {step === 1 && (
            <StepRegion
              list={regionsList}
              pays={form.pays}
              paysCode={form.pays_code}
              onSelect={selectRegion}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <StepAppellation
              list={appellationsList}
              region={form.region}
              onSelect={selectAppellation}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepProducteur
              list={producteursList}
              appellation={form.appellation}
              onSelect={selectProducteur}
              onBack={() => setStep(2)}
              onSkip={() => setStep(4)}
            />
          )}
          {step === 4 && (
            <StepDetails
              form={form}
              setForm={setForm}
              onSubmit={handleSubmit}
              submitting={submitting}
            />
          )}
        </div>

        <div className="preview-card" style={{ alignSelf: 'start' }}>
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
      </div>
    </section>
  )
}
