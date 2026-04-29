export default function Sidebar({ page, navigate, totalBottles }) {
  const items = [
    {
      id: 'accueil',
      label: 'Accueil',
      icon: <path d="M3 12l9-9 9 9M5 10v10h14V10" />,
    },
    {
      id: 'ajout',
      label: 'Inscrire un vin',
      icon: <path d="M12 5v14M5 12h14" />,
    },
    {
      id: 'cave',
      label: 'Ma cave',
      badge: totalBottles,
      icon: (
        <>
          <path d="M9 3h6l1 4v13a1 1 0 01-1 1H9a1 1 0 01-1-1V7l1-4z" />
          <path d="M8 11h8" />
        </>
      ),
    },
    {
      id: 'analytique',
      label: 'Analytique',
      icon: (
        <>
          <path d="M3 3v18h18" />
          <path d="M7 14l4-4 4 4 5-5" />
        </>
      ),
    },
    {
      id: 'historique',
      label: 'Sorties',
      icon: (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      ),
    },
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
        {items.map(({ id, label, icon, badge }) => (
          <button
            key={id}
            className={`nav-item${page === id ? ' active' : ''}`}
            onClick={() => navigate(id)}
          >
            <svg className="nav-icon" viewBox="0 0 24 24">{icon}</svg>
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
