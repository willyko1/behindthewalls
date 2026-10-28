import {profile,monthNames,normalizeSaved} from './building-model.js';
const el = id => document.getElementById(id);
const fmt = n => n.toLocaleString('en-US');
const make = (tag,text,className) => {
  const node=document.createElement(tag);
  if(text!==undefined)node.textContent=text;
  if(className)node.className=className;
  return node;
};
const action = (label,callback) => {const button=make('button',label);button.onclick=callback;return button;};
let buildings=[],filtered=[],selected=null,saved=[],pageSize=50,timer;
const byId=new Map(),markers=new Map();
const map=L.map('street-map',{preferCanvas:true}).setView([40.73,-73.96],11);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
// All filtered locations enter this spatial index, including low-count addresses.
// Coincident locations spiderfy at maximum zoom rather than hiding one another.
const clusters=L.markerClusterGroup({maxClusterRadius:55,showCoverageOnHover:false,animate:false}).addTo(map);
const count=b=>el('month').value==='-1'?profile(b).total:b.m[Number(el('month').value)];
monthNames.forEach((name,i)=>{const option=make('option',name);option.value=i;el('month').append(option);});

function saveSelection(){
  try{localStorage.setItem('btw-shortlist',JSON.stringify(saved));}
  catch{el('saved-note').textContent='Browser storage is unavailable. This shortlist lasts only until you reload.';}
  el('compare-open').textContent=`Compare (${saved.length}/3)`;
}
function toggleSaved(id){
  if(saved.includes(id))saved=saved.filter(value=>value!==id);
  else if(saved.length<3)saved.push(id);
  else{el('notice').textContent='Your shortlist has three addresses. Remove one in Compare to add another.';return;}
  el('notice').textContent=saved.includes(id)?'Address added to comparison.':'Address removed from comparison.';
  saveSelection();renderList();if(selected)show(byId.get(selected),false);renderComparison();
}
function chart(b){
  const row=make('div',undefined,'months');row.setAttribute('aria-label','Monthly complaint counts');
  b.m.forEach((n,i)=>{
    const column=make('div',undefined,'month');column.title=`${monthNames[i]}: ${fmt(n)} complaints`;
    const bar=make('i');bar.style.height=`${n/Math.max(...b.m,1)*65}px`;bar.setAttribute('aria-hidden','true');
    column.append(make('span',fmt(n)),bar,make('span',monthNames[i].slice(0,3)));row.append(column);
  });return row;
}
function show(b,scroll=true){
  clearTimeout(timer);selected=b.id;
  const p=profile(b),panel=el('detail');panel.hidden=false;panel.replaceChildren();
  panel.append(action('← Back to results',()=>{selected=null;panel.hidden=true;renderList();}),make('h2',b.a),make('p',`${b.b} · ${b.z}`));
  const save=action(saved.includes(b.id)?'✓ Remove from comparison':'+ Add to comparison',()=>toggleSaved(b.id));save.setAttribute('aria-pressed',String(saved.includes(b.id)));panel.append(save);
  panel.append(make('div',fmt(count(b)),'total'),make('p',`reported complaints · ${el('month').selectedOptions[0].textContent}`));
  panel.append(make('h3','The full-season pattern'));
  panel.append(make('p',`${p.active} of 8 months have reports · longest consecutive stretch: ${p.longest} months.`,'pattern'));
  panel.append(make('p',p.active===1?'Reports are concentrated in one month. This does not tell us how long any issue lasted.':`Reports appear across ${p.active} months. This can describe different issues or residents; it does not establish one continuous outage.`));
  panel.append(chart(b),make('p',`Peak: ${p.peakMonths.join(', ')} (${fmt(p.peak)} complaints${p.peakMonths.length>1?' each':''}). ${p.peakShare}% of season reports fall in a single peak month.`));
  const details=make('details');details.append(make('summary','Exact monthly counts'));
  const table=make('table');const caption=make('caption','Full-season reporting history');table.append(caption);
  b.m.forEach((n,i)=>{const row=make('tr');const heading=make('th',monthNames[i]);heading.scope='row';row.append(heading,make('td',fmt(n)));table.append(row);});details.append(table);panel.append(details);
  panel.append(make('h3','Questions to take to a viewing'));
  const questions=make('ul');
  [p.active>1?'How were recurring heat or hot-water reports investigated and resolved?':'What happened during the reported period, and what repairs followed?', 'When was the boiler last serviced, and how are outages communicated?', 'Can management share maintenance records and explain how tenants track repairs?'].forEach(q=>questions.append(make('li',q)));
  panel.append(questions,make('p','Building size, inspection findings, and verified repair outcomes are not joined to this dataset. These counts are not a building rating.'),make('p','NYC 311 · snapshot October 21, 2026. Reports are not confirmed violations or counts of affected households.'));
  renderList();if(scroll)panel.scrollIntoView({block:'nearest'});
}
function renderComparison(){
  const content=el('compare-content');content.replaceChildren();
  if(!saved.length){content.append(make('p','Add up to three addresses using “Compare” in the results or a building profile.'));return;}
  const table=make('table');table.className='compare-table';
  const head=make('tr');head.append(make('th','Full season'));
  saved.forEach(id=>{const b=byId.get(id),th=make('th');th.scope='col';th.append(make('strong',b.a),make('p',`${b.b} · ${b.z}`),action('Remove',()=>toggleSaved(id)));head.append(th);});table.append(head);
  const metrics=[['Complaints',p=>fmt(p.total)],['Months with reports',p=>`${p.active} / 8`],['Longest consecutive stretch',p=>`${p.longest} months`],['Peak month(s)',p=>p.peakMonths.join(', ')],['Reports in a peak month',p=>fmt(p.peak)],['Share in a peak month',p=>`${p.peakShare}%`]];
  metrics.forEach(([label,value])=>{const row=make('tr'),th=make('th',label);th.scope='row';row.append(th);saved.forEach(id=>row.append(make('td',value(profile(byId.get(id))))));table.append(row);});
  monthNames.forEach((name,i)=>{const row=make('tr'),th=make('th',name);th.scope='row';row.append(th);saved.forEach(id=>row.append(make('td',fmt(byId.get(id).m[i]))));table.append(row);});content.append(table);
}
function renderList(){
  const visible=filtered.filter(b=>map.getBounds().contains([b.p[1],b.p[0]])).sort((a,b)=>count(b)-count(a)||a.id.localeCompare(b.id));
  el('status').textContent=`${fmt(visible.length)} reported addresses in this map area · ${fmt(filtered.length)} matching citywide`;
  const list=el('list');list.replaceChildren();
  visible.slice(0,pageSize).forEach(b=>{
    const card=make('article',undefined,'result-card'),button=make('button',undefined,'card');button.setAttribute('aria-pressed',String(selected===b.id));
    button.append(make('span',fmt(count(b)),'count'),make('strong',b.a),make('small',`${b.b} · ${b.z}`),make('span',`${profile(b).active} months with reports · Open profile →`,'caption'));
    button.onclick=()=>{clearTimeout(timer);map.setView([b.p[1],b.p[0]],Math.max(map.getZoom(),16));show(b);};
    const save=action(saved.includes(b.id)?'✓ Saved for comparison':'+ Compare',()=>toggleSaved(b.id));save.className='save-card';save.setAttribute('aria-label',`${saved.includes(b.id)?'Remove':'Compare'} ${b.a}`);save.setAttribute('aria-pressed',String(saved.includes(b.id)));card.append(button,save);list.append(card);
  });
  if(visible.length>pageSize)list.append(action(`Show more (${fmt(visible.length-pageSize)} remaining)`,()=>{pageSize+=50;renderList();}));
  list.append(make('p',visible.length?'Ordered by complaints in the selected period. Counts are not adjusted for building size.':'No matching reports in this area. Zoom out or change your search.','empty'));
}
function applyFilters(fit=false){
  clearTimeout(timer);pageSize=50;
  const term=el('search').value.trim().toLowerCase().replace(/\s+/g,' '),borough=el('borough').value;
  filtered=buildings.filter(b=>(!borough||b.b===borough)&&(!term||`${b.a} ${b.z}`.toLowerCase().replace(/\s+/g,' ').includes(term))&&count(b)>0);
  clusters.clearLayers();markers.clear();
  const allMarkers=filtered.map(b=>{
    const node=make('span',String(count(b)),'location-dot');node.title=`${b.a}: ${fmt(count(b))} complaints`;
    const marker=L.marker([b.p[1],b.p[0]],{title:node.title,alt:node.title,icon:L.divIcon({html:node,className:'location-marker',iconSize:[28,28]})});
    const tip=make('span',node.title);marker.bindTooltip(tip);marker.on('click',()=>show(b));markers.set(b.id,marker);return marker;
  });
  clusters.addLayers(allMarkers);
  if(selected){const b=byId.get(selected);if(filtered.includes(b))show(b,false);else{selected=null;el('detail').hidden=true;}}
  if(fit&&filtered.length)map.fitBounds(L.latLngBounds(filtered.map(b=>[b.p[1],b.p[0]])),{padding:[35,35],maxZoom:16});
  renderList();
}
el('month').onchange=()=>applyFilters();el('borough').onchange=()=>applyFilters(true);
el('search').oninput=()=>{clearTimeout(timer);timer=setTimeout(()=>applyFilters(true),300);};
el('reset').onclick=()=>{clearTimeout(timer);el('search').value='';el('borough').value='';el('month').value='-1';selected=null;el('detail').hidden=true;map.setView([40.73,-73.96],11);applyFilters();};
el('about').onclick=()=>el('methods').showModal();el('close-about').onclick=()=>el('methods').close();
el('compare-open').onclick=()=>{renderComparison();el('comparison').showModal();};el('compare-close').onclick=()=>el('comparison').close();
map.on('moveend',()=>{if(buildings.length)renderList();});
fetch('./data/buildings.json').then(r=>{if(!r.ok)throw Error('Data failed');return r.json();}).then(data=>{
  buildings=data.buildings.filter(b=>Array.isArray(b.p)&&b.p.length===2&&b.p.every(Number.isFinite));buildings.forEach(b=>byId.set(b.id,b));
  try{saved=normalizeSaved(JSON.parse(localStorage.getItem('btw-shortlist')||'[]'),new Set(byId.keys()));}catch{saved=[];}
  saveSelection();applyFilters();
}).catch(error=>{console.error(error);el('status').textContent='Could not load locations. Reload to try again.';});
