/**
 * Identité métier d'une cuvée : son nom seul n'est jamais suffisant.
 * Deux millésimes différents (ou deux producteurs différents) restent distincts.
 */
export function normalizeWineText(value) {
  return String(value ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr-FR')
}

function vintage(value) {
  return value === '' || value == null ? null : Number(value)
}

export function wineIdentityKey(wine) {
  return JSON.stringify([
    normalizeWineText(wine.cru),
    normalizeWineText(wine.producteur),
    normalizeWineText(wine.appellation),
    vintage(wine.millesime),
    normalizeWineText(wine.categorie),
  ])
}

export function sameWineIdentity(a, b) {
  return wineIdentityKey(a) === wineIdentityKey(b)
}

export function groupWines(wines) {
  const grouped = new Map()
  for (const wine of Array.isArray(wines) ? wines : []) {
    const key = wineIdentityKey(wine)
    if (grouped.has(key)) {
      const previous = grouped.get(key)
      grouped.set(key, {
        ...previous,
        quantite: Number(previous.quantite || 0) + Number(wine.quantite || 0),
      })
    } else {
      grouped.set(key, { ...wine })
    }
  }
  return [...grouped.values()]
}

/** L'API de localisation actuelle ne renvoie ni BID ni millésime. */
export function hasCruCollision(wines, selected) {
  return (Array.isArray(wines) ? wines : []).some(
    (wine) =>
      normalizeWineText(wine.cru) === normalizeWineText(selected.cru) &&
      !sameWineIdentity(wine, selected),
  )
}
