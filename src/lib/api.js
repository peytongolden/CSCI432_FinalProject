// Helper for building API URLs that respect Vite env `VITE_API_BASE`.
const BASE = (import.meta.env.VITE_API_BASE || '').trim();

function join(base, path) {
  if (!path) return base || '/'
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const p = path.startsWith('/') ? path : '/' + path
  if (!base || base === '' || base === '/') return p
  return (base.endsWith('/') ? base.slice(0, -1) : base) + p
}

export function apiUrl(path) {
  return join(BASE, path)
}

export function apiFetch(path, options) {
  return fetch(apiUrl(path), options)
}

export default { apiUrl, apiFetch }
