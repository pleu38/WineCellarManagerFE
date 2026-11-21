import { useState, useEffect } from 'react'
import { Plus, Wine, BarChart2, Clock, Moon, Sun } from 'lucide-react'
import { getAllWine, getLastWines, getSumCru, getSumRegion, getBottleHistory } from '../api/wineApi'
import { getCollectionOverview, getCategoryBreakdown, getMostRecentExit } from '../utils/homeCards'

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

export default function Accueil({ navigate, theme, toggleTheme }) {
  const [lastWines, setLastWines] = useState([])
  const [history, setHistory] = useState([])
  const [totalBottles, setTotalBottles] = useState('—')
  const [totalRegions, setTotalRegions] = useState('—')
  const [loading, setLoading] = useState(true)
  const [stock, setStock] = useState(null)
  const [stockError, setStockError] = useState(false)
  const [fullHistory, setFullHistory] = useState(null)
  const [historyError, setHistoryError] = useState(false)

  useEffect(() => {
    Promise.allSettled([
      getSumCru(),
      getSumRegion(),
      getLastWines(),
      getBottleHistory(),
      getAllWine(),
    ]).then(([sum, sumRegion, last, hist, inventory]) => {
      if (sum.status === 'fulfilled' && sum.value?.[0]?.somme != null)
        setTotalBottles(Math.round(sum.value[0].somme))
      if (sumRegion.status === 'fulfilled' && sumRegion.value?.[0]?.compte_region != null)
        setTotalRegions(sumRegion.value[0].compte_region)
      if (last.status === 'fulfilled' && Array.isArray(last.value)) setLastWines(last.value.slice(0, 5))
      if (hist.status === 'fulfilled' && Array.isArray(hist.value)) {
        setHistory(hist.value.slice(0, 5))
        setFullHistory(hist.value)
      } else {
        setHistoryError(true)
      }
      if (inventory.status === 'fulfilled' && Array.isArray(inventory.value)) {
        setStock(inventory.value)
      } else {
        setStockError(true)
      }
      setLoading(false)
    })
  }, [])

  const collection = stock === null ? null : getCollectionOverview(stock)
  const distribution = stock === null ? null : getCategoryBreakdown(stock)
  const lastExit = getMostRecentExit(fullHistory)
  const exitDate = lastExit ? new Date(lastExit.time).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
  const exitQuantity = lastExit && Number.isFinite(Number(lastExit.qte_mouvement))
    ? Math.abs(Number(lastExit.qte_mouvement))
    : null

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
        <button
          type="button"
          className="hero-theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}
          title={theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}
          aria-pressed={theme === 'dark'}
        >
          {theme === 'dark' ? <Sun size={19} strokeWidth={1.7} /> : <Moon size={19} strokeWidth={1.7} />}
        </button>
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

      <div className="quick-access" aria-label="Raccourcis et indicateurs de la cave">
        <button type="button" className="quick-card home-summary-card" onClick={() => navigate('ajout')}>
          <div className="quick-icon"><Plus size={20} /></div>
          <div className="quick-title">Nouvelle entrée</div>
          <div className="quick-desc">Inscrire un cru au registre</div>
          <span className="home-card-link">Inscrire un vin <span aria-hidden="true">↗</span></span>
        </button>

        <button type="button" className="quick-card home-summary-card" onClick={() => navigate('cave')}>
          <div className="quick-icon"><Wine size={20} /></div>
          <div className="quick-title">Votre collection</div>
          {loading ? (
            <div className="home-card-placeholder" aria-label="Chargement de la collection">Chargement…</div>
          ) : stockError || !collection ? (
            <div className="home-card-placeholder">Stock indisponible</div>
          ) : (
            <>
              <div className="home-card-metric"><strong>{collection.bottles.toLocaleString('fr-FR')}</strong><span>bouteilles</span></div>
              <div className="home-card-caption">{collection.cuvees} cuvées · {collection.vintages} millésimes</div>
            </>
          )}
          <span className="home-card-link">Explorer la cave <span aria-hidden="true">↗</span></span>
        </button>

        <button type="button" className="quick-card home-summary-card" onClick={() => navigate('analytique')}>
          <div className="quick-icon"><BarChart2 size={20} /></div>
          <div className="quick-title">Répartition de la cave</div>
          {loading ? (
            <div className="home-card-placeholder" aria-label="Chargement de la répartition">Chargement…</div>
          ) : stockError || !distribution ? (
            <div className="home-card-placeholder">Répartition indisponible</div>
          ) : distribution.total === 0 ? (
            <div className="home-card-placeholder">Aucune bouteille en stock</div>
          ) : (
            <>
              <div className="home-distribution-track" role="img" aria-label={distribution.segments.map(s => `${s.label} : ${s.quantity} bouteilles, ${Math.round(s.percent)} %`).join(' ; ')}>
                {distribution.segments.map(s => (
                  <span key={s.id} className={`home-distribution-segment ${s.id}`} style={{ width: `${s.percent}%` }} />
                ))}
              </div>
              <div className="home-distribution-legend">
                {[...distribution.segments].sort((a, b) => b.quantity - a.quantity).slice(0, 3).map(s => (
                  <span key={s.id}><i className={`home-category-dot ${s.id}`} aria-hidden="true" />{s.label} {Math.round(s.percent)} %</span>
                ))}
              </div>
            </>
          )}
          <span className="home-card-link">Voir les statistiques <span aria-hidden="true">↗</span></span>
        </button>

        <button type="button" className="quick-card home-summary-card" onClick={() => navigate('historique')}>
          <div className="quick-icon"><Clock size={20} /></div>
          <div className="quick-title">Dernière sortie</div>
          {loading ? (
            <div className="home-card-placeholder" aria-label="Chargement de la dernière sortie">Chargement…</div>
          ) : historyError ? (
            <div className="home-card-placeholder">Historique indisponible</div>
          ) : lastExit ? (
            <>
              <div className="home-card-wine">{lastExit.cru || 'Cru non renseigné'}{lastExit.millesime ? ` · ${lastExit.millesime}` : ''}</div>
              <div className="home-card-caption">{exitQuantity !== null ? `${exitQuantity} bouteille${exitQuantity > 1 ? 's' : ''} sortie${exitQuantity > 1 ? 's' : ''}` : 'Quantité non renseignée'} · {exitDate}</div>
            </>
          ) : (
            <div className="home-card-placeholder">{fullHistory?.length ? 'Dates de sortie indisponibles' : 'Aucune sortie enregistrée'}</div>
          )}
          <span className="home-card-link">Voir les sorties <span aria-hidden="true">↗</span></span>
        </button>
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
