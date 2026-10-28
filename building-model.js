export const monthNames = ['Oct 2025','Nov 2025','Dec 2025','Jan 2026','Feb 2026','Mar 2026','Apr 2026','May 2026'];
export function profile(building) {
  const total = building.m.reduce((sum,n)=>sum+n,0);
  const active = building.m.filter(n=>n>0).length;
  const peak = Math.max(...building.m);
  const peakMonths = building.m.flatMap((n,i)=>n===peak&&n>0?[monthNames[i]]:[]);
  let longest=0,run=0;
  for(const n of building.m){run=n>0?run+1:0;longest=Math.max(longest,run);}
  return {total,active,peak,peakMonths,longest,peakShare:total?Math.round(100*peak/total):0};
}
export function normalizeSaved(value, validIds) {
  return Array.isArray(value)?[...new Set(value.filter(id=>validIds.has(id)))].slice(0,3):[];
}
