import { groupWines, normalizeWineText } from './wineIdentity.js'

// Les cartes reflètent le stock courant, pas les entrées historiques ni les cuvées épuisées.
function availableWines(rawWines) {
  return groupWines(rawWines).filter(wine => {
    const qty = Number(wine.quantite)
    return Number.isFinite(qty) && qty > 0
  })
}

export function getCollectionOverview(rawWines) {
  const wines = availableWines(rawWines)
  const vintages = new Set(
    wines.map(wine => wine.millesime)
      .filter(value => value !== null && value !== undefined && String(value).trim() !== '')
      .map(value => String(value).trim())
  )
  return {
    bottles: wines.reduce((sum, wine) => sum + Number(wine.quantite), 0),
    cuvees: wines.length,
    vintages: vintages.size,
  }
}

const CATEGORIES = [
  { id: 'rouge', label: 'Rouge' },
  { id: 'blanc', label: 'Blanc' },
  { id: 'rose', label: 'Rosé' },
  { id: 'effervescent', label: 'Effervescent' },
  { id: 'liqueur', label: 'Liqueur' },
  { id: 'autres', label: 'Autres' },
]

function categoryId(value) {
  const text = normalizeWineText(value)
  if (text.includes('rouge')) return 'rouge'
  if (text.includes('blanc')) return 'blanc'
  if (text.includes('rose')) return 'rose'
  if (text.includes('effervescent') || text.includes('mousseux') || text.includes('champagne')) return 'effervescent'
  if (text.includes('liqueur')) return 'liqueur'
  return 'autres'
}

export function getCategoryBreakdown(rawWines) {
  const quantities = new Map(CATEGORIES.map(category => [category.id, 0]))
  for (const wine of availableWines(rawWines)) {
    const id = categoryId(wine.categorie ?? wine.type_vin)
    quantities.set(id, quantities.get(id) + Number(wine.quantite))
  }
  const total = [...quantities.values()].reduce((sum, value) => sum + value, 0)
  return {
    total,
    segments: CATEGORIES
      .map(category => ({
        ...category,
        quantity: quantities.get(category.id),
        percent: total > 0 ? (quantities.get(category.id) / total) * 100 : 0,
      }))
      .filter(category => category.quantity > 0),
  }
}

export function getMostRecentExit(rawHistory) {
  if (!Array.isArray(rawHistory)) return null
  // Ne pas supposer que l'API trie déjà l'historique.
  return rawHistory.reduce((latest, entry) => {
    if (!entry?.date_mouvement) return latest
    const time = new Date(entry.date_mouvement).getTime()
    if (!Number.isFinite(time)) return latest
    return !latest || time > latest.time ? { ...entry, time } : latest
  }, null)
}
