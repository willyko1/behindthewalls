import {summarize} from './neighborhood-model.js';
import {monthNames} from './building-model.js';
const fmt=n=>n.toLocaleString('en-US');
function svgAt(id,height,label){return d3.select(id).html('').append('svg').attr('viewBox',`0 0 440 ${height}`).attr('role','group').attr('aria-label',label);}
function interactive(selection,label,callback){selection.attr('tabindex',0).attr('role','button').attr('aria-label',label).on('click',(_,d)=>callback(d)).on('keydown',(e,d)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();callback(d);}}).append('title').text(label);}
export function renderAnalytics(rows,month,metric,names,onMonth,onPlace){
 const s=summarize(rows,month),stats=document.getElementById('summary-stats');stats.replaceChildren();
 for(const [value,label] of [[s.reports,'complaints in selected period'],[s.addresses,'reporting addresses'],[s.groups.filter(g=>names.has(g.id)).length,'named statistical areas']]){const item=document.createElement('div'),strong=document.createElement('strong'),small=document.createElement('span');strong.textContent=fmt(value);small.textContent=label;item.append(strong,small);stats.append(item);}
 const peak=Math.max(...s.monthly),peakNames=monthNames.filter((_,i)=>s.monthly[i]===peak);document.getElementById('finding').textContent=peak?`For these location filters, ${peakNames.join(' and ')} had the most complaints: ${fmt(peak)}. Compare the number of reports with the number of addresses to distinguish volume from geographic reach.`:'No complaints match these location filters.';
 const width=440,height=210,margin={left:48,right:10,top:26,bottom:32};
 const svg=svgAt('#timeline',height,'Monthly complaint counts. Bars are keyboard selectable.');
 const x=d3.scaleBand().domain(d3.range(8)).range([margin.left,width-margin.right]).padding(.25),y=d3.scaleLinear().domain([0,d3.max(s.monthly)||1]).nice().range([height-margin.bottom,margin.top]);
 svg.append('g').attr('transform',`translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(4).tickFormat(d3.format('~s')));
 svg.append('g').attr('transform',`translate(0,${height-margin.bottom})`).call(d3.axisBottom(x).tickFormat(i=>monthNames[i].slice(0,3)));
 const bars=svg.selectAll('rect').data(s.monthly.map((v,i)=>({v,i}))).join('rect').attr('x',d=>x(d.i)).attr('y',d=>y(d.v)).attr('width',x.bandwidth()).attr('height',d=>y(0)-y(d.v)).attr('fill',d=>month===d.i?'#8e5e49':'#718174');
 interactive(bars,d=>`${monthNames[d.i]}: ${fmt(d.v)} complaints. Filter by this month.`,d=>onMonth(d.i));
 svg.selectAll('.value').data(s.monthly).join('text').attr('class','value').attr('x',(_,i)=>x(i)+x.bandwidth()/2).attr('y',v=>y(v)-6).attr('text-anchor','middle').text(v=>fmt(v));
 if(!s.addresses){document.getElementById('ranking').textContent='No reports match these filters.';document.getElementById('recurrence').textContent='No reporting addresses in this selection.';return;}
 const top=s.groups.filter(g=>names.has(g.id)).sort((a,b)=>b[metric]-a[metric]).slice(0,6);
 const rank=svgAt('#ranking',Math.max(150,top.length*48+24),`Top neighborhoods by ${metric==='reports'?'complaints':'reporting addresses'}`),scale=d3.scaleLinear().domain([0,d3.max(top,d=>d[metric])||1]).range([0,360]);
 const groups=rank.selectAll('g').data(top).join('g').attr('transform',(_,i)=>`translate(4,${i*48+3})`);
 groups.append('text').attr('y',12).text(d=>names.get(d.id));
 groups.append('rect').attr('y',20).attr('height',17).attr('width',d=>scale(d[metric])).attr('fill','#8e5e49');
 groups.append('text').attr('x',d=>scale(d[metric])+6).attr('y',33).text(d=>fmt(d[metric]));
 interactive(groups,d=>`${names.get(d.id)}: ${fmt(d[metric])} ${metric==='reports'?'complaints':'reporting addresses'}. Explore neighborhood.`,d=>onPlace(names.get(d.id)));
 const rec=svgAt('#recurrence',175,'Reporting addresses grouped by full-season recurrence'),rx=d3.scaleLinear().domain([0,d3.max(s.recurrence)||1]).range([0,270]);
 const labels=['1 month','2–3 months','4–8 months'];s.recurrence.forEach((n,i)=>{const g=rec.append('g').attr('transform',`translate(0,${i*48+16})`);g.append('text').attr('x',0).attr('y',14).text(labels[i]);g.append('rect').attr('x',88).attr('width',rx(n)).attr('height',22).attr('fill','#718174');g.append('text').attr('x',94+rx(n)).attr('y',15).text(fmt(n));g.append('title').text(`${labels[i]}: ${fmt(n)} addresses (${Math.round(n/s.addresses*100)}%)`);});
 document.getElementById('ranking-note').textContent=`Top ${top.length} statistical areas by ${metric==='reports'?'complaints':'reporting addresses'} in the selected period. Select a bar to explore. Bars start at zero.`;
}
