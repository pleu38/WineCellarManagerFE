const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const API_KEY = import.meta.env.VITE_API_KEY || ''

function headers(extra = {}) {
  return { 'Content-Type': 'application/json', 'API-Key': API_KEY, ...extra }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: headers(options.headers),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

// Wine
export const getAllWine = () => request('/wine')
export const getLastWines = () => request('/wine/last')
export const getWineByRobe = (robe) => request(`/wine/robe/${encodeURIComponent(robe)}`)
export const getWineByCru = (cru) => request(`/wine/cru/${encodeURIComponent(cru)}`)
export const getWineByMillesime = (millesime) => request(`/wine/millesime/${millesime}`)
export const getQuantityByWine = (cru) => request(`/wine/${encodeURIComponent(cru)}/quantity`)
export const getBottleHistory = () => request('/wine/history')
export const addWineLocation = (cru, data) =>
  request(`/wine/${encodeURIComponent(cru)}/location`, { method: 'POST', body: JSON.stringify(data) })
export const addWine = (data) =>
  request('/wine/insert', { method: 'POST', body: JSON.stringify(data) })
export const updateWine = (data) =>
  request('/wine/update', { method: 'PUT', body: JSON.stringify(data) })

// Pays / Région
export const getPays = () => request('/pays')
export const getRegionsByPays = (pays) => request(`/pays/${encodeURIComponent(pays)}`)
export const getAppellationsByRegion = (region) => request(`/region/${encodeURIComponent(region)}`)
export const getWineByRegion = (region) => request(`/region/${encodeURIComponent(region)}/winelist`)
export const addRegion = (pays, data) =>
  request(`/region/add/${encodeURIComponent(pays)}`, { method: 'POST', body: JSON.stringify(data) })

// Appellation
export const getAppellations = () => request('/appellation')

// Producteur
export const getProducteurs = () => request('/producteur')
export const getProducteursByAppellation = (appellation) =>
  request(`/producteur/${encodeURIComponent(appellation)}`)
export const addProducteur = (data) =>
  request('/producteur/add', { method: 'POST', body: JSON.stringify(data) })

// Analytics
export const getAnalyticsByCouleur = () => request('/analytics/couleur')
export const getAnalyticsByRegion = () => request('/analytics/region')
export const getAnalyticsByMillesime = () => request('/analytics/millesime')
export const getSumCru = () => request('/analytics/sum')
export const getAverageCru = () => request('/analytics/moyenne')
export const getSumRegion = () => request('/analytics/sum_region')
