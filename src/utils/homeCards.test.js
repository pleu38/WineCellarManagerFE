import test from 'node:test'
import assert from 'node:assert/strict'
import { getCollectionOverview, getCategoryBreakdown, getMostRecentExit } from './homeCards.js'

const wines = [
  { cru: 'Château A', producteur: 'Domaine A', appellation: 'Pauillac', millesime: 2018, categorie: 'Rouge', quantite: 3 },
  { cru: 'Château A', producteur: 'Domaine A', appellation: 'Pauillac', millesime: 2018, categorie: 'Rouge', quantite: 2 },
  { cru: 'Château A', producteur: 'Domaine A', appellation: 'Pauillac', millesime: 2019, categorie: 'Rouge', quantite: 1 },
  { cru: 'Château B', producteur: 'Domaine B', appellation: 'Chablis', millesime: 2020, categorie: 'Blanc', quantite: 4 },
  { cru: 'Château C', producteur: 'Domaine C', appellation: 'Côtes de Provence', millesime: null, categorie: 'Rosé', quantite: 2 },
  { cru: 'Épuisé', producteur: 'Domaine C', appellation: 'Bordeaux', millesime: 2021, categorie: 'Rouge', quantite: 0 },
]

test('les bouteilles sont additionnées sans confondre les millésimes; le stock épuisé est exclu', () => {
  assert.deepEqual(getCollectionOverview(wines), { bottles: 12, cuvees: 4, vintages: 3 })
})

test('la répartition est calculée en bouteilles et conserve chaque catégorie', () => {
  const result = getCategoryBreakdown(wines)
  assert.equal(result.total, 12)
  assert.deepEqual(Object.fromEntries(result.segments.map(s => [s.id, s.quantity])), { rouge: 6, blanc: 4, rose: 2 })
  assert.equal(Math.round(result.segments.reduce((sum, s) => sum + s.percent, 0)), 100)
})

test('catégories accentuées ou inconnues préservées dans une barre Autres', () => {
  const stock = [
    { cru: 'A', categorie: 'Rosé', quantite: 3 },
    { cru: 'B', categorie: 'Effervescent', quantite: 2 },
    { cru: 'C', categorie: 'Vins rares', quantite: 1 },
  ]
  assert.deepEqual(getCategoryBreakdown(stock).segments.map(s => s.id), ['rose', 'effervescent', 'autres'])
})

test('une cave vide affiche zéro sans créer de pourcentages invalides', () => {
  assert.deepEqual(getCollectionOverview([]), { bottles: 0, cuvees: 0, vintages: 0 })
  assert.deepEqual(getCategoryBreakdown([]), { total: 0, segments: [] })
})

test('la dernière sortie est choisie par date même si les résultats API ne sont pas triés', () => {
  const events = [
    { cru: 'Ancien', date_mouvement: '2024-01-01', qte_mouvement: 2 },
    { cru: 'Dernier', date_mouvement: '2026-11-20T20:00:00', qte_mouvement: 1 },
    { cru: 'Médian', date_mouvement: '2025-06-02', qte_mouvement: 3 },
  ]
  assert.equal(getMostRecentExit(events).cru, 'Dernier')
})

test('des dates absentes ou invalides ne fabriquent pas de sortie récente', () => {
  assert.equal(getMostRecentExit([{ cru: 'A', date_mouvement: 'date inconnue' }]), null)
  assert.equal(getMostRecentExit(null), null)
})
