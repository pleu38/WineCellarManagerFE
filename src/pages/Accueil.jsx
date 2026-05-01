import { useState, useEffect } from 'react'
import { Plus, Search, BarChart2, Clock } from 'lucide-react'
import { getLastWines, getSumCru, getSumRegion, getBottleHistory } from '../api/wineApi'

function formatRelativeDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.round((now - d) / 86400000)
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Hier'
  if (diff < 7) return `Il y a ${diff} jours`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

function todayLabel() {
  return new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function greeting() {
  const h = new Date().getHours()
  return h >= 18 ? 'Bonsoir' : 'Bonjour'
}

export default function Accueil({ navigate }) {
  const [lastWines, setLastWines] = useState([])
  const [history, setHistory] = useState([])
  const [totalBottles, setTotalBottles] = useState('—')
  const [totalRegions, setTotalRegions] = useState('—')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      getSumCru(),
      getSumRegion(),
      getLastWines(),
      getBottleHistory(),
    ]).then(([sum, sumRegion, last, hist]) => {
      if (sum.status === 'fulfilled' && sum.value?.[0]?.somme != null)
        setTotalBottles(Math.round(sum.value[0].somme))
      if (sumRegion.status === 'fulfilled' && sumRegion.value?.[0]?.compte_region != null)
        setTotalRegions(sumRegion.value[0].compte_region)
      if (last.status === 'fulfilled') setLastWines(last.value.slice(0, 5))
      if (hist.status === 'fulfilled') setHistory(hist.value.slice(0, 5))
      setLoading(false)
    })
  }, [])

  const recentActivity = [
    ...lastWines.map((w) => ({
      type: 'in',
      name: `${w.cru} ${w.millesime ?? ''} — entrée au registre`,
      meta: `${w.appellation} · ${w.categorie}`,
      date: formatRelativeDate(w.Date),
    })),
    ...history.map((h) => ({
      type: 'out',
      name: `${h.cru} ${h.millesime ?? ''} — sortie`,
      meta: `${h.raison_sortie ?? ''} · ${h.qte_mouvement} btl`,
      date: formatRelativeDate(h.date_mouvement),
    })),
  ]
    .sort((a, b) => (a.date > b.date ? -1 : 1))
    .slice(0, 5)

  return (
    <section className="page">
      <div className="hero">
        <div className="hero-content">
          <div className="hero-greeting">
            <span className="pulse-dot" />
            {greeting()} · {todayLabel()}
          </div>
          <h1 className="hero-title">
            Votre cave compte<br />
            <em>{totalBottles} vins</em>
          </h1>
          <p className="hero-desc">
            Gérez votre collection, suivez vos entrées et sorties, et explorez les
            statistiques de votre cave personnelle.
          </p>
          <div className="hero-actions">
            <button className="btn" onClick={() => navigate('ajout')}>
              <Plus className="btn-icon" />
              Inscrire un vin
            </button>
            <button className="btn ghost" onClick={() => navigate('cave')}>
              Explorer la cave
            </button>
          </div>
        </div>

        <div className="hero-stats">
          <div>
            <div className="hero-stat-label">Vins</div>
            <div className="hero-stat-value">{totalBottles}</div>
            <div className="hero-stat-trend">Inventaire total</div>
          </div>
          <div>
            <div className="hero-stat-label">Régions</div>
            <div className="hero-stat-value">{totalRegions}</div>
            <div className="hero-stat-trend">Dans la cave</div>
          </div>
          <div>
            <div className="hero-stat-label">Derniers ajouts</div>
            <div className="hero-stat-value">{lastWines.length}</div>
            <div className="hero-stat-trend">Récemment inscrits</div>
          </div>
          <div>
            <div className="hero-stat-label">Sorties</div>
            <div className="hero-stat-value">{history.length}</div>
            <div className="hero-stat-trend down">Mouvements récents</div>
          </div>
        </div>
      </div>

      <div className="quick-access">
        <div className="quick-card" onClick={() => navigate('ajout')}>
          <div className="quick-icon"><Plus size={20} /></div>
          <div className="quick-title">Nouvelle entrée</div>
          <div className="quick-desc">Inscrire un cru au registre</div>
        </div>
        <div className="quick-card" onClick={() => navigate('cave')}>
          <div className="quick-icon"><Search size={20} /></div>
          <div className="quick-title">Rechercher</div>
          <div className="quick-desc">Parmi {totalBottles} références</div>
        </div>
        <div className="quick-card" onClick={() => navigate('analytique')}>
          <div className="quick-icon"><BarChart2 size={20} /></div>
          <div className="quick-title">Statistiques</div>
          <div className="quick-desc">Tendances et répartition</div>
        </div>
        <div className="quick-card" onClick={() => navigate('historique')}>
          <div className="quick-icon"><Clock size={20} /></div>
          <div className="quick-title">Historique</div>
          <div className="quick-desc">Suivi des sorties</div>
        </div>
      </div>

      <div className="home-grid">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Activité récente</div>
            <button className="panel-link" onClick={() => navigate('historique')}>
              Tout voir →
            </button>
          </div>

          {loading && (
            <div className="loading"><span className="spinner" /> Chargement…</div>
          )}

          {!loading && recentActivity.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🍷</div>
              <p>Aucune activité récente</p>
            </div>
          )}

          {recentActivity.map((item, i) => (
            <div className="activity-item" key={i}>
              <div className={`activity-dot ${item.type}`} />
              <div className="activity-text">
                <div className="activity-name">{item.name}</div>
                <div className="activity-meta">{item.meta}</div>
              </div>
              <div className="activity-time">{item.date}</div>
            </div>
          ))}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">Derniers inscrits</div>
            <button className="panel-link" onClick={() => navigate('cave')}>
              Voir la cave →
            </button>
          </div>

          {loading && (
            <div className="loading"><span className="spinner" /> Chargement…</div>
          )}

          {lastWines.map((w, i) => (
            <div className="reco-item" key={i}>
              <div className="reco-name">{w.cru}</div>
              <div className="reco-domain">
                {w.millesime ? `${w.millesime} · ` : ''}{w.appellation} · {w.producteur}
              </div>
              <div className="reco-urgency" style={{ color: 'var(--bordeaux)' }}>
                {w.categorie}
              </div>
            </div>
          ))}

          {!loading && lastWines.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🍾</div>
              <p>Aucun vin inscrit</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
