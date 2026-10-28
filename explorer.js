import {initRenter,updateRenter,appendRenterContext} from './renter.js';
import {matchNeighborhoods,summarize} from './neighborhood-model.js';
import {renderAnalytics} from './analytics.js';
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
let neighborhoods=[],locationRows=[],areaLayer=null;
const names=new Map();
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
  panel.append(action('← Back to results',()=>{selected=null;panel.hidden=true;updateRenter(neighborhoods.filter(f=>locationRows.some(b=>b.n===f.properties.id)),el('borough').value);renderList();}),make('h2',b.a),make('p',`${b.b} · ${b.z}`));
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
  appendRenterContext(panel,neighborhoods.find(f=>f.properties.id===b.n),b.b);
  updateRenter(neighborhoods.filter(f=>f.properties.id===b.n),b.b,b.a);
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
  const place=el('neighborhood').value.trim(),ids=matchNeighborhoods(place,neighborhoods);
  const term=el('search').value.trim().toLowerCase().replace(/\s+/g,' '),borough=el('borough').value;
  locationRows=buildings.filter(b=>(!place||ids.includes(b.n))&&(!borough||b.b===borough)&&(!term||`${b.a} ${b.z}`.toLowerCase().replace(/\s+/g,' ').includes(term)));
  filtered=locationRows.filter(b=>count(b)>0);
  clusters.clearLayers();markers.clear();
  const allMarkers=filtered.map(b=>{
    const node=make('span',String(count(b)),'location-dot');node.title=`${b.a}: ${fmt(count(b))} complaints`;
    const marker=L.marker([b.p[1],b.p[0]],{title:node.title,alt:node.title,icon:L.divIcon({html:node,className:'location-marker',iconSize:[28,28]})});
    const tip=make('span',node.title);marker.bindTooltip(tip);marker.on('click',()=>show(b));markers.set(b.id,marker);return marker;
  });
  clusters.addLayers(allMarkers);
  drawAreas(place,ids);
  const contextIds=place?ids:[...new Set(locationRows.map(b=>b.n))];
  updateRenter(neighborhoods.filter(f=>contextIds.includes(f.properties.id)),borough);
  const labels=ids.map(id=>names.get(id)).filter(Boolean);
  el('scope').textContent=place?(labels.length?`Neighborhood match: ${labels.join(' + ')}. ${borough?`Borough: ${borough}. `:''}Charts follow this location selection.`:`No neighborhood matches “${place}”. Try a suggestion or clear the neighborhood field.`):`All ${borough||'NYC'} neighborhood matches${term?` · address/ZIP: ${term}`:''}. Charts follow location filters; the address list follows the map.`;
  renderAnalytics(locationRows,Number(el('month').value),el('measure').value,names,i=>{el('month').value=String(i);applyFilters();},choosePlace);
  if(selected){const b=byId.get(selected);if(filtered.includes(b))show(b,false);else{selected=null;el('detail').hidden=true;}}
  if(fit&&filtered.length)map.fitBounds(place&&areaLayer?areaLayer.getBounds():L.latLngBounds(filtered.map(b=>[b.p[1],b.p[0]])),{padding:[35,35],maxZoom:16});
  renderList();
}
el('month').onchange=()=>applyFilters();el('borough').onchange=()=>applyFilters(true);
el('neighborhood').oninput=()=>{clearTimeout(timer);timer=setTimeout(()=>applyFilters(true),300);};
el('map-mode').onchange=()=>applyFilters();el('measure').onchange=()=>applyFilters();
document.querySelectorAll('[data-place]').forEach(button=>button.onclick=()=>choosePlace(button.dataset.place));
el('search').oninput=()=>{clearTimeout(timer);timer=setTimeout(()=>applyFilters(true),300);};
el('reset').onclick=()=>{clearTimeout(timer);el('search').value='';el('neighborhood').value='';el('borough').value='';el('month').value='-1';selected=null;el('detail').hidden=true;map.setView([40.73,-73.96],11);applyFilters();};
el('about').onclick=()=>el('methods').showModal();el('close-about').onclick=()=>el('methods').close();
el('compare-open').onclick=()=>{renderComparison();el('comparison').showModal();};el('compare-close').onclick=()=>el('comparison').close();
map.on('moveend',()=>{if(buildings.length)renderList();});
Promise.all(['./data/buildings.json','./data/neighborhoods.geojson','./data/rental-market.json'].map(url=>fetch(url).then(r=>{if(!r.ok)throw Error('Data failed');return r.json();}))).then(([data,geo,rental])=>{
  initRenter(rental);
  neighborhoods=geo.features;neighborhoods.forEach(f=>{names.set(f.properties.id,f.properties.name);if(f.properties.type==='0'){const option=make('option');option.value=f.properties.name;el('neighborhood-options').append(option);}});
  buildings=data.buildings.filter(b=>Array.isArray(b.p)&&b.p.length===2&&b.p.every(Number.isFinite));buildings.forEach(b=>byId.set(b.id,b));
  try{saved=normalizeSaved(JSON.parse(localStorage.getItem('btw-shortlist')||'[]'),new Set(byId.keys()));}catch{saved=[];}
  saveSelection();applyFilters();
}).catch(error=>{console.error(error);el('status').textContent='Could not load locations. Reload to try again.';});

function choosePlace(name){el('neighborhood').value=name;el('search').value='';el('borough').value='';applyFilters(true);}
function drawAreas(place,ids){
 if(areaLayer)map.removeLayer(areaLayer);
 const shaded=el('map-mode').value==='areas',metric=el('measure').value;
 if(shaded)map.removeLayer(clusters);else if(!map.hasLayer(clusters))map.addLayer(clusters);
 const totals=new Map(summarize(locationRows,Number(el('month').value)).groups.map(g=>[g.id,g[metric]]));
 const thresholds=metric==='reports'?[10,100,1000,10000]:[10,100,500,1000];
 const palette=['#fff0d1','#f6c590','#e79258','#bd5730','#78331f'];
 const color=d3.scaleThreshold().domain(thresholds).range(palette);
 const features=neighborhoods.filter(f=>place?ids.includes(f.properties.id):(!el('borough').value||f.properties.boro===el('borough').value));
 if(shaded||place){areaLayer=L.geoJSON({type:'FeatureCollection',features},{style:f=>({color:'#6b4635',weight:place?2:1,fillColor:totals.has(f.properties.id)?color(totals.get(f.properties.id)):'#dce0dc',fillOpacity:shaded?.72:.07}),onEachFeature:(f,layer)=>{const tip=make('span',`${f.properties.name}: ${fmt(totals.get(f.properties.id)||0)} ${metric==='reports'?'complaints':'reporting addresses'} in selected period`);layer.bindTooltip(tip);if(shaded)layer.on('click',()=>choosePlace(f.properties.name));}}).addTo(map);if(!shaded)areaLayer.bringToBack();}
 const key=document.querySelector('.map-key');key.replaceChildren();
 if(shaded){key.append(make('strong',metric==='reports'?'Complaint counts':'Reporting address counts'));const ranges=metric==='reports'?['1–9','10–99','100–999','1,000–9,999','10,000+']:['1–9','10–99','100–499','500–999','1,000+'];ranges.forEach((label,i)=>{const item=make('span',label,'legend-bin'),swatch=make('i');swatch.style.background=palette[i];item.prepend(swatch);key.append(item);});key.append(make('span','Gray: no matching reports','legend-bin'));}
 else key.append(make('span','Dots: complaint counts · Clusters: address counts'));
}
