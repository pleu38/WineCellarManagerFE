import test from 'node:test'
import assert from 'node:assert/strict'
import { sameWineIdentity, groupWines, hasCruCollision } from './wineIdentity.js'

const base = {
  cru: 'Les Charmes',
  producteur: 'Domaine Martin',
  appellation: 'Meursault',
  categorie: 'Blanc',
  millesime: 2019,
  quantite: 2,
}

test('un autre millésime ne désigne pas la même cuvée', () => {
  assert.equal(sameWineIdentity(base, { ...base, millesime: 2020 }), false)
})

test('le producteur est aussi pris en compte', () => {
  assert.equal(sameWineIdentity(base, { ...base, producteur: 'Domaine Dupont' }), false)
})

test('les différences de casse et accents ne créent pas de faux doublons', () => {
  assert.equal(sameWineIdentity(base, { ...base, cru: 'LES CHARMES', producteur: 'domaine martin' }), true)
})

test('les quantités fusionnent seulement pour une identité identique', () => {
  const grouped = groupWines([base, { ...base, quantite: 3 }, { ...base, millesime: 2020, quantite: 4 }])
  assert.equal(grouped.length, 2)
  assert.deepEqual(grouped.map((w) => [w.millesime, w.quantite]), [[2019, 5], [2020, 4]])
})

test('détecte la localisation ambiguë pour un cru ayant plusieurs millésimes', () => {
  assert.equal(hasCruCollision([base, { ...base, millesime: 2020 }], base), true)
  assert.equal(hasCruCollision([base, { ...base, quantite: 9 }], base), false)
})

test('les millésimes non renseignés restent distincts des années précises', () => {
  assert.equal(sameWineIdentity({ ...base, millesime: null }, base), false)
})
