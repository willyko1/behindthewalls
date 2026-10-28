import {matchNeighborhoods} from './neighborhood-model.js';
const form=document.getElementById('neighborhood-form'),input=document.getElementById('neighborhood-search'),error=document.getElementById('search-error');
let features=null;
fetch('./data/neighborhoods.geojson').then(r=>{if(!r.ok)throw Error('Neighborhoods unavailable');return r.json();}).then(data=>{
 features=data.features;
 const names=['Bed-Stuy','Kips Bay',...features.filter(f=>f.properties.type==='0').map(f=>f.properties.name)];
 for(const name of [...new Set(names)].sort()){const option=document.createElement('option');option.value=name;document.getElementById('places').append(option);}
}).catch(()=>{/* Native form navigation remains available if suggestions cannot load. */});
form.addEventListener('submit',event=>{
 input.value=input.value.trim();
 if(!input.value){event.preventDefault();error.textContent='Enter a neighborhood to start exploring.';input.focus();return;}
 if(features&&!matchNeighborhoods(input.value,features).length){event.preventDefault();error.textContent='We couldn’t match that neighborhood. Try a suggested name, such as Kips Bay, Bed-Stuy, or Astoria.';input.setAttribute('aria-invalid','true');input.focus();}
});
input.addEventListener('input',()=>{error.textContent='';input.removeAttribute('aria-invalid');});
document.querySelectorAll('[data-place]').forEach(button=>button.addEventListener('click',()=>{input.value=button.dataset.place;input.removeAttribute('aria-invalid');error.textContent='';form.requestSubmit();}));
