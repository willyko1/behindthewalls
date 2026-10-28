import {resolveMarket,marketStats,budgetGap} from './renter-model.js';
const el=id=>document.getElementById(id);
const money=n=>n===null?'Not published':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
const num=n=>n===null?'Not published':n.toLocaleString('en-US');
const date=m=>new Date(`${m}-01T12:00:00Z`).toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'});
let market=null,context={features:[],borough:'',address:''},selection=null;
export function initRenter(data){market=data;el('bedrooms').onchange=render;el('rent-budget').oninput=renderBudget;render();}
export function updateRenter(features,borough,address=''){context={features,borough,address};render();}
function render(){
 if(!market)return;
 selection=resolveMarket(market.areas,context.features,context.borough);const {area,level}=selection,kind=el('bedrooms').value,s=marketStats(area,kind);
 el('renter-area').textContent=`${area?.name||'Unavailable'} rent benchmark`;
 el('renter-scope').textContent=level==='neighborhood'?`StreetEasy neighborhood: ${area.name}. Rent and complaint boundaries may differ; this is area context, not a price estimate for an individual apartment.`:level==='borough'?`Borough benchmark only. A matching neighborhood series is not available for this selection. These figures cover ${area.name}, not the specific neighborhood or address.`:'Citywide benchmark. Search a neighborhood or open an address profile to see available local context.';
 if(context.address)el('renter-scope').prepend(`For ${context.address}: `);
 el('market-date').textContent=`${date(market.months.at(-1))} · ${el('bedrooms').selectedOptions[0].textContent} · retrieved ${market.retrieved}`;
 el('market-rent').textContent=money(s.rent);el('market-inventory').textContent=num(s.inventory);el('market-cuts').textContent=s.cutShare===null?'Not published':`${(s.cutShare*100).toFixed(1)}%`;
 el('market-change').textContent=s.yearChange===null?'Annual change unavailable':`${s.yearChange>=0?'+':''}${(s.yearChange*100).toFixed(1)}% vs. ${date(market.months[0])}`;
 const values=area?.bedrooms[kind]?.rent||[],chart=d3.select('#rent-trend').html('');
 if(values.every(v=>v===null)||!values.length){chart.append('p').text('No rent observations published for this area and bedroom selection. Try another bedroom count.');}
 else{const w=620,h=175,x=d3.scaleLinear().domain([0,market.months.length-1]).range([58,w-16]),y=d3.scaleLinear().domain([0,d3.max(values)||1]).nice().range([h-32,15]);const svg=chart.append('svg').attr('viewBox',`0 0 ${w} ${h}`).attr('role','img').attr('aria-label',`Median monthly asking rent, ${area.name}, ${market.months[0]} to ${market.months.at(-1)}. Exact values follow in the table.`);
 svg.append('g').attr('transform','translate(58,0)').call(d3.axisLeft(y).ticks(4).tickFormat(d=>`$${d3.format('~s')(d)}`));svg.append('g').attr('transform',`translate(0,${h-32})`).call(d3.axisBottom(x).tickValues([0,3,6,9,12]).tickFormat(i=>new Date(`${market.months[i]}-01T12:00:00Z`).toLocaleDateString('en-US',{month:'short',year:'2-digit',timeZone:'UTC'})));
 svg.append('path').datum(values).attr('fill','none').attr('stroke','#8e5e49').attr('stroke-width',3).attr('d',d3.line().defined(v=>v!==null).x((v,i)=>x(i)).y(v=>y(v)));
 svg.selectAll('circle').data(values.map((v,i)=>({v,i})).filter(d=>d.v!==null)).join('circle').attr('cx',d=>x(d.i)).attr('cy',d=>y(d.v)).attr('r',3).attr('fill','#8e5e49').append('title').text(d=>`${date(market.months[d.i])}: ${money(d.v)}`);}
 const body=el('rent-history');body.replaceChildren();market.months.forEach((m,i)=>{const row=document.createElement('tr'),th=document.createElement('th'),td=document.createElement('td');th.scope='row';th.textContent=date(m);td.textContent=money(values[i]??null);row.append(th,td);body.append(row);});
 renderBudget();
}
function renderBudget(){if(!selection)return;const rent=marketStats(selection.area,el('bedrooms').value).rent,gap=budgetGap(rent,Number(el('rent-budget').value));el('budget-result').textContent=rent===null?'No rent benchmark is published for this bedroom selection, so a budget comparison is unavailable.':gap?`${money(rent)} median asking rent is ${money(Math.abs(gap.difference))} ${gap.difference>=0?'above':'below'} your monthly rent budget (${Math.abs(gap.percent).toFixed(1)}%). This compares an area median, not available apartments; utilities and other costs are excluded.`:'Enter a monthly rent budget to compare it with this benchmark. Your budget stays in this page and is not submitted.';}
export function appendRenterContext(panel,feature,borough){
 if(!market)return;const {area,level}=resolveMarket(market.areas,feature?[feature]:[],borough),s=marketStats(area);
 const heading=document.createElement('h3');heading.textContent='Plan your rental search';panel.append(heading);
 const p=document.createElement('p');p.textContent=`${area.name}: ${money(s.rent)} median asking rent / month · all bedroom counts · ${date(market.months.at(-1))}. ${level==='neighborhood'?'Neighborhood context; boundaries may differ.':'Borough benchmark; no matched neighborhood series.'} This is not the asking rent for this building.`;panel.append(p);
 const link=document.createElement('a');link.href='#renter-overview';link.textContent='Compare bedroom types and your budget ↑';panel.append(link);
}
