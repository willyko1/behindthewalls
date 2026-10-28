// All counts come from precomputed aggregates, including deduplicated season rows.
export const MONTHS = ['2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05'];
export const BOROUGHS = ['BRONX','BROOKLYN','MANHATTAN','QUEENS','STATEN ISLAND'];
export const DEFAULT_VIEW = {month: -1, borough: -1, measure: 'reports'};
export function readView(search) {
  const params = new URLSearchParams(search);
  const month = MONTHS.indexOf(params.get('month'));
  const borough = BOROUGHS.indexOf((params.get('borough') || '').toUpperCase());
  return {month, borough, measure: params.get('measure') === 'addresses' ? 'addresses' : 'reports'};
}
export function viewURL(href, view) {
  const url = new URL(href);
  url.searchParams.set('month', MONTHS[view.month] || 'season');
  url.searchParams.set('borough', (BOROUGHS[view.borough] || 'all').toLowerCase());
  url.searchParams.set('measure', view.measure);
  return url;
}
export function createLookup(data) {
  const table = new Map(data.rows.map(row => [`${row.borough}/${row.month}`, row]));
  return (borough, month) => {
    const row = table.get(`${borough}/${month}`);
    if (!row) throw new Error(`Missing aggregate: borough ${borough}, month ${month}`);
    return row;
  };
}
export function niceBorough(borough) {
  return borough < 0 ? 'All NYC' : BOROUGHS[borough].toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
export function monthLabel(month) {
  return month < 0 ? 'Entire season' : new Date(`${MONTHS[month]}-15T12:00:00Z`).toLocaleDateString('en-US', {month:'long',year:'numeric',timeZone:'UTC'});
}
export async function copyViewLink(url, clipboard, onFallback) {
  try {
    if (!clipboard?.writeText) throw new Error('Clipboard unavailable');
    await clipboard.writeText(url);
    return true;
  } catch {
    onFallback(url);
    return false;
  }
}
