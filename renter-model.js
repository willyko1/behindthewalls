import {normalize} from './neighborhood-model.js';
export function resolveMarket(areas,features,borough=''){
 const base=name=>normalize(name.replace(/\s*\((?:East|West|North|South)\)$/i,''));
 const candidates=features.map(f=>areas.find(a=>a.type==='neighborhood'&&a.borough===f.properties.boro&&base(a.name)===base(f.properties.name)));
 if(candidates.length&&candidates.every(a=>a&&a.name===candidates[0].name))return {area:candidates[0],level:'neighborhood'};
 const boroughs=[...new Set(features.map(f=>f.properties.boro).filter(Boolean))];
 const b=borough||(boroughs.length===1?boroughs[0]:'');
 const area=areas.find(a=>a.type==='borough'&&a.name===b)||areas.find(a=>a.type==='city'&&a.name==='NYC');
 return {area,level:area?.type||'unavailable'};
}
export function marketStats(area,kind='All'){
 const data=area?.bedrooms[kind],rent=data?.rent.at(-1)??null,prior=data?.rent[0]??null;
 return {rent,inventory:data?.inventory.at(-1)??null,cutShare:data?.rentCutShare.at(-1)??null,yearChange:rent!==null&&prior>0?(rent-prior)/prior:null};
}
export function budgetGap(rent,budget){return Number.isFinite(rent)&&rent>0&&Number.isFinite(budget)&&budget>0?{difference:rent-budget,percent:(rent-budget)/budget*100}:null;}
