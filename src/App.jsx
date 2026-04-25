import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Accueil from './pages/Accueil'
import Cave from './pages/Cave'
import Ajout from './pages/Ajout'
import Analytique from './pages/Analytique'
import Historique from './pages/Historique'

export default function App() {
  const [page, setPage] = useState('accueil')

  const navigate = (target) => {
    setPage(target)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app">
      <Sidebar page={page} navigate={navigate} />
      <main>
        {page === 'accueil'    && <Accueil    navigate={navigate} />}
        {page === 'ajout'      && <Ajout      navigate={navigate} />}
        {page === 'cave'       && <Cave       navigate={navigate} />}
        {page === 'analytique' && <Analytique navigate={navigate} />}
        {page === 'historique' && <Historique navigate={navigate} />}
      </main>
    </div>
  )
}
