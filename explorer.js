/* Building locations are from the existing public app's October 21 snapshot.
   The list and map share filters; counts sum monthly reports, never grouped rows. */
const el=id=>document.getElementById(id);
const names=['Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'];
const fmt=n=>n.toLocaleString('en-US');
let buildings=[],selected=null,markers=new Map();
const map=L.map('street-map',{preferCanvas:true}).setView([40.73,-73.96],11);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
const layer=L.layerGroup().addTo(map);
const count=b=>el('month').value==='-1'?b.m.reduce((a,v)=>a+v,0):b.m[Number(el('month').value)];
names.forEach((n,i)=>{const o=document.createElement('option');o.value=i;o.textContent=n+' '+(i<3?'2025':'2026');el('month').append(o);});
function show(b){
 selected=b.id;const panel=el('detail');panel.hidden=false;panel.replaceChildren();
 const close=document.createElement('button');close.textContent='← Back to results';close.onclick=()=>{selected=null;panel.hidden=true;render();};panel.append(close);
 const title=document.createElement('h2');title.textContent=b.a;panel.append(title);
 const location=document.createElement('p');location.textContent=b.b+' · '+b.z;panel.append(location);
 const total=document.createElement('div');total.className='total';total.textContent=fmt(count(b));panel.append(total);
 const caption=document.createElement('p');caption.textContent='reported heat / hot-water complaints · '+el('month').selectedOptions[0].textContent;panel.append(caption);
 const chart=document.createElement('div');chart.className='months';chart.setAttribute('aria-label','Monthly complaints');
 b.m.forEach((n,i)=>{const column=document.createElement('div');column.className='month';const value=document.createElement('span');value.textContent=n;const bar=document.createElement('i');bar.style.height=(n/Math.max(...b.m,1)*65)+'px';const label=document.createElement('span');label.textContent=names[i];column.append(value,bar,label);chart.append(column);});panel.append(chart);
 const note=document.createElement('p');note.textContent='Reports are not confirmed violations. Several requests may describe the same issue; they do not count affected households.';panel.append(note);
 render();panel.scrollIntoView({block:'nearest'});
}
function render(){
 const term=el('search').value.trim().toLowerCase().replace(/\s+/g,' '),borough=el('borough').value;
 const filtered=buildings.filter(b=>(!borough||b.b===borough)&&(!term||`${b.a} ${b.z}`.toLowerCase().replace(/\s+/g,' ').includes(term))&&count(b)>0);
 const bounds=map.getBounds();const visible=filtered.filter(b=>bounds.contains([b.p[1],b.p[0]])).sort((a,b)=>count(b)-count(a));
 layer.clearLayers();markers.clear();
 // Canvas markers avoid thousands of DOM nodes; cap rendering at 4,000 per view.
 visible.slice(0,4000).forEach(b=>{const marker=L.circleMarker([b.p[1],b.p[0]],{radius:Math.min(13,3+Math.log2(count(b)+1)),color:b.id===selected?'#102432':'#fff2df',weight:b.id===selected?3:1,fillColor:'#b4502d',fillOpacity:.65}).addTo(layer);const tip=document.createElement('span');tip.textContent=b.a+' · '+fmt(count(b))+' complaints';marker.bindTooltip(tip);marker.on('click',()=>show(b));markers.set(b.id,marker);});
 el('status').textContent=fmt(visible.length)+' reported addresses in this map area'+(visible.length>4000?' · showing 4,000 highest-count locations; zoom in for more':'');
 const list=el('list');list.replaceChildren();
 visible.slice(0,100).forEach(b=>{const button=document.createElement('button');button.className='card';button.setAttribute('aria-pressed',String(b.id===selected));const number=document.createElement('span');number.className='count';number.textContent=fmt(count(b));const title=document.createElement('strong');title.textContent=b.a;const sub=document.createElement('small');sub.textContent=b.b+' · '+b.z;const caption=document.createElement('span');caption.className='caption';caption.textContent='Heat / hot water complaints · View history →';button.append(number,title,sub,caption);button.onclick=()=>{map.setView([b.p[1],b.p[0]],Math.max(map.getZoom(),15));show(b);};list.append(button);});
 const note=document.createElement('p');note.className='empty';note.textContent=visible.length?'Showing the first '+Math.min(100,visible.length)+' addresses, ordered by complaint count.':'No matching reported addresses here. Zoom out or change your search.';list.append(note);
}
function filter(){selected=null;el('detail').hidden=true;render();}
el('month').onchange=filter;el('borough').onchange=filter;
let timer;el('search').oninput=()=>{clearTimeout(timer);timer=setTimeout(filter,200);};
el('reset').onclick=()=>{el('search').value='';el('borough').value='';el('month').value='-1';map.setView([40.73,-73.96],11);filter();};
el('about').onclick=()=>el('methods').showModal();el('close-about').onclick=()=>el('methods').close();
map.on('moveend',()=>{if(buildings.length)render();});
fetch('./data/buildings.json').then(r=>{if(!r.ok)throw Error('Data failed');return r.json();}).then(data=>{buildings=data.buildings.filter(b=>Array.isArray(b.p)&&b.p.length===2&&b.p.every(Number.isFinite));render();}).catch(()=>{el('status').textContent='Could not load locations. Reload to try again.';});
