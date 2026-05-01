import { Home, Plus, Wine, BarChart2, Clock } from 'lucide-react'

export default function Sidebar({ page, navigate, totalBottles }) {
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
