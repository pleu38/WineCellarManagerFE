import { Home, Plus, Wine, BarChart2, Clock, Sun, Moon } from 'lucide-react'

export default function Sidebar({ page, navigate, totalBottles, theme, toggleTheme }) {
  const items = [
    { id: 'accueil',    label: 'Accueil',        Icon: Home },
    { id: 'ajout',      label: 'Inscrire un vin', Icon: Plus },
    { id: 'cave',       label: 'Ma cave',         Icon: Wine, badge: totalBottles },
    { id: 'analytique', label: 'Analytique',      Icon: BarChart2 },
    { id: 'historique', label: 'Sorties',         Icon: Clock },
  ]

  return (
    <aside>
      <div className="brand">
        <div className="brand-logo">V</div>
        <div>
          <div className="brand-name">Vinothèque</div>
          <div className="brand-sub">Cave personnelle</div>
        </div>
      </div>

      <nav>
        <div className="nav-label">Navigation</div>
        {items.map(({ id, label, Icon, badge }) => (
          <button
            key={id}
            className={`nav-item${page === id ? ' active' : ''}`}
            onClick={() => navigate(id)}
          >
            <Icon className="nav-icon" />
            <span>{label}</span>
            {badge != null && <span className="nav-badge">{badge}</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-appearance">
        <span className="appearance-caption">Apparence</span>
        <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>Thème {theme === 'dark' ? 'clair' : 'sombre'}</span>
        </button>
      </div>
      <div className="sidebar-footer">
        <div className="avatar">P</div>
        <div className="user-info">
          <div className="user-name">Pierre-Louis</div>
          <div className="user-status">Cave No. 1</div>
        </div>
      </div>
    </aside>
  )
}
