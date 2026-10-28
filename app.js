import {DEFAULT_VIEW, MONTHS, BOROUGHS, readView, viewURL, createLookup, niceBorough, monthLabel, copyViewLink} from './model.js';

const d3 = window.d3;
const $ = id => document.getElementById(id);
const fmt = value => value.toLocaleString('en-US');
const shortMonths = ['Oct','Nov','Dec','Jan','Feb','Mar','Apr','May'];
let view = readView(location.search);

async function start() {
  if (!d3) throw new Error('The local D3 library could not be loaded.');
  const [data, sourceGeo] = await Promise.all(['./data/heat-summary.json','./data/boroughs-simplified.geojson'].map(async path => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Could not load ${path}.`);
    return response.json();
  }));
  const get = createLookup(data);
  const geo = structuredClone(sourceGeo);
  // D3 uses clockwise exterior rings for small spherical polygons.
  // Reverse the recovered GeoJSON only when D3 treats a borough as > half Earth.
  for (const feature of geo.features) {
    if (d3.geoArea(feature) > 2 * Math.PI) {
      for (const polygon of feature.geometry.coordinates) for (const ring of polygon) ring.reverse();
    }
  }
  const boroughIndex = f => BOROUGHS.indexOf(f.properties.boroname.toUpperCase());
  const projection = d3.geoMercator().fitExtent([[18,15],[562,410]], geo);
  const path = d3.geoPath(projection);
  const map = d3.select('#map');
  const paths = map.append('g').selectAll('path').data(geo.features).join('path')
    .attr('d',path).attr('tabindex',0).attr('role','button')
    .on('click',(_,f) => select({borough:boroughIndex(f)}))
    .on('keydown',(event,f) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault(); select({borough:boroughIndex(f)});
      }
      if (event.key === 'Escape') select({borough:-1});
    })
    .on('pointerenter',(_,f) => showMapDetail(f))
    .on('focus',(_,f) => showMapDetail(f))
    .on('pointerleave',() => $('map-tooltip').textContent = '')
    .on('blur',() => $('map-tooltip').textContent = '');
  paths.append('title');
  // Fixed callouts keep labels readable on the narrow Manhattan polygon.
  const labelPositions = {BRONX:[397,45],MANHATTAN:[186,131],QUEENS:[450,224],BROOKLYN:[295,316],'STATEN ISLAND':[112,365]};
  const labels = map.append('g').attr('aria-hidden','true').selectAll('text').data(geo.features).join('text')
    .attr('class','map-label').attr('text-anchor','middle')
    .attr('x',f => labelPositions[f.properties.boroname.toUpperCase()][0])
    .attr('y',f => labelPositions[f.properties.boroname.toUpperCase()][1]);
  labels.append('tspan').attr('x',function(){return this.parentNode.getAttribute('x');}).text(f => f.properties.boroname);
  labels.append('tspan').attr('class','map-number').attr('dy',17).attr('x',function(){return this.parentNode.getAttribute('x');});

  d3.select('#period').selectAll('option').data([-1,...d3.range(8)]).join('option').attr('value',d => d).text(monthLabel);
  $('period').addEventListener('change',event => select({month:Number(event.target.value)}));
  $('season').addEventListener('click',() => select({month:-1}));
  const months = d3.select('#timeline').selectAll('button').data(d3.range(8)).join('button')
    .attr('class','month-button').on('click',(_,month) => select({month}))
    .on('keydown',function(event,month) {
      // Arrow keys move through the timeline; native Enter/Space activate buttons.
      if (['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? 7 : (month + (event.key === 'ArrowLeft' ? 7 : 1)) % 8;
        months.nodes()[next].focus(); select({month:next});
      }
    });
  months.append('span').attr('class','month-value');
  months.append('span').attr('class','bar-track').attr('aria-hidden','true').append('span').attr('class','month-bar');
  months.append('span').attr('class','month-name').text(month => shortMonths[month]);
  const boroughButtons = d3.select('#borough-controls').selectAll('button').data([-1,...d3.range(5)]).join('button')
    .text(niceBorough).on('click',(_,borough) => select({borough}));
  const ranks = d3.select('#ranking').selectAll('button').data(d3.range(5)).join('button')
    .attr('class','rank-button').on('click',(_,borough) => select({borough}));
  ranks.append('span').text(niceBorough);
  ranks.append('span').attr('class','rank-track').attr('aria-hidden','true').append('span').attr('class','rank-fill');
  ranks.append('span').attr('class','rank-number');
  const histNames = ['1 report','2–5 reports','6–20 reports','21+ reports'];
  const hist = d3.select('#histogram').selectAll('div').data(d3.range(4)).join('div').attr('class','hist-col');
  hist.append('strong');
  hist.append('div').attr('class','hist-track').attr('aria-hidden','true').append('span').attr('class','hist-bar');
  hist.append('span').attr('class','hist-label').text(i => histNames[i]);
  document.querySelectorAll('[data-measure]').forEach(button => button.addEventListener('click',() => select({measure:button.dataset.measure})));
  document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click',() => {
    const step = button.dataset.step;
    // Each guide step is deterministic even when entered out of order.
    const states = {october:{month:0,borough:-1,measure:'reports'},january:{month:3,borough:-1,measure:'reports'},addresses:{month:3,borough:-1,measure:'addresses'}};
    select(states[step]);
    $('guide-note').textContent = {
      october:'October: begin with the citywide pattern at the start of the selected season.',
      january:'January: the Bronx has 27,176 complaints; Brooklyn has 21,945. Now change the way you count.',
      addresses:'January, counted differently: Brooklyn has 5,884 reported addresses; the Bronx has 5,232. More complaints does not always mean more distinct addresses.'
    }[step];
  }));
  $('reset').addEventListener('click',() => {
    select({...DEFAULT_VIEW});
    $('guide-note').textContent = 'Each report is a request for help. Multiple requests may describe the same building-wide problem.';
  });
  $('copy-link').addEventListener('click',async () => {
    const copied = await copyViewLink(viewURL(location.href,view).href,navigator.clipboard,url => openShare(url));
    if (copied) $('view-status').textContent = 'View link copied.';
    $('copy-link').textContent = copied ? 'Link copied ✓' : 'Copy view link ↗';
  });
  $('share-url').addEventListener('click',event => event.target.select());
  window.addEventListener('popstate',() => {view = readView(location.search); update();});

  function openShare(url) {
    $('share-url').value = url;
    $('share-dialog').showModal();
    $('share-url').focus(); $('share-url').select();
  }
  function select(change) {
    const next = {...view,...change};
    if (JSON.stringify(next) !== JSON.stringify(view)) {
      view = next;
      history.pushState(null,'',viewURL(location.href,view));
    }
    $('copy-link').textContent = 'Copy view link ↗';
    update();
  }
  function showMapDetail(f) {
    const value = get(boroughIndex(f),view.month)[view.measure];
    $('map-tooltip').textContent = `${f.properties.boroname}: ${fmt(value)} ${view.measure === 'reports' ? 'complaints' : 'distinct reported addresses'}`;
  }
  function update() {
    const {month,borough,measure} = view;
    const row = get(borough,month);
    const measureText = measure === 'reports' ? 'complaints' : 'distinct reported addresses';
    const max = d3.max(d3.range(5),b => get(b,month)[measure]) || 1;
    const color = d3.scaleSequential(d3.interpolateRgb('#eee6d9','#6c4e3e')).domain([0,max]);
    $('period').value = month;
    $('season').setAttribute('aria-pressed',String(month === -1));
    document.querySelectorAll('[data-measure]').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.measure === measure)));
    $('measure-help').textContent = measure === 'reports' ? 'Complaints count every service request, including repeat requests at the same address.' : 'Distinct reported addresses count each borough + normalized address once within the selected period.';
    $('timeline-title').textContent = `${niceBorough(borough)} · ${measureText}`;
    const series = d3.range(8).map(m => get(borough,m)[measure]);
    const barHeight = d3.scaleLinear().domain([0,d3.max(series) || 1]).range([0,80]);
    months.attr('aria-pressed',m => String(month === m))
      .attr('aria-label',m => `${monthLabel(m)}: ${fmt(series[m])} ${measureText}`)
      .attr('title',m => `${monthLabel(m)}: ${fmt(series[m])} ${measureText}`);
    months.select('.month-value').text(m => fmt(series[m]));
    months.select('.month-bar').style('height',m => `${barHeight(series[m])}px`);
    boroughButtons.attr('aria-pressed',b => String(borough === b));
    $('map-title').textContent = monthLabel(month);
    paths.attr('fill',f => color(get(boroughIndex(f),month)[measure]))
      .attr('stroke',f => boroughIndex(f) === borough ? '#333d36' : '#7f8175')
      .attr('stroke-width',f => boroughIndex(f) === borough ? 3 : .8)
      .attr('aria-pressed',f => String(boroughIndex(f) === borough))
      .attr('aria-label',f => `${f.properties.boroname}: ${fmt(get(boroughIndex(f),month)[measure])} ${measureText}`);
    paths.select('title').text(f => `${f.properties.boroname}: ${fmt(get(boroughIndex(f),month)[measure])} ${measureText} · ${monthLabel(month)}`);
    labels.select('.map-number').text(f => fmt(get(boroughIndex(f),month)[measure]));
    $('map-tooltip').textContent = '';
    $('legend-max').textContent = fmt(max);
    $('selection-period').textContent = monthLabel(month).toUpperCase();
    $('selection-title').textContent = niceBorough(borough);
    $('report-count').textContent = fmt(row.reports);
    $('address-count').textContent = fmt(row.addresses);
    $('summary-note').textContent = `${(row.reports / row.addresses || 0).toFixed(1)} complaints per reported address in this period. This is reporting intensity, not households affected.`;
    $('ranking-measure').textContent = measure === 'reports' ? 'COMPLAINTS' : 'ADDRESSES';
    ranks.sort((a,b) => get(b,month)[measure] - get(a,month)[measure])
      .attr('aria-pressed',b => String(borough === b))
      .attr('aria-label',b => `${niceBorough(b)}: ${fmt(get(b,month)[measure])} ${measureText}`);
    ranks.select('.rank-fill').style('width',b => `${100 * get(b,month)[measure] / max}%`);
    ranks.select('.rank-number').text(b => fmt(get(b,month)[measure]));
    const unknown = get(5,month).reports;
    $('unspecified-note').textContent = unknown ? 'Citywide includes 1 request with an unspecified borough, omitted from the map.' : 'No unspecified-borough requests in this month. Requests with known boroughs remain included even if coordinates are missing.';
    $('repeat-note').textContent = `${(100 * row.repeated / row.addresses || 0).toFixed(1)}% of reported addresses have more than one complaint in this period.`;
    const height = d3.scaleLinear().domain([0,d3.max(row.histogram) || 1]).range([0,80]);
    hist.select('strong').text(i => fmt(row.histogram[i]));
    hist.select('.hist-bar').style('height',i => `${height(row.histogram[i])}px`);
    $('hist-caption').textContent = month === -1 ? `${fmt(row.multipleMonths)} addresses appear in more than one month. Season counts deduplicate those addresses.` : 'Each address appears in one category, based on its complaint count within this month.';
    $('table-caption').textContent = `${monthLabel(month)} · borough totals`;
    const rows = d3.select('#table-body').selectAll('tr').data([-1,...d3.range(6)]).join('tr');
    rows.selectAll('*').remove();
    rows.append('th').attr('scope','row').text(b => b === 5 ? 'Unspecified' : niceBorough(b));
    rows.append('td').text(b => fmt(get(b,month).reports));
    rows.append('td').text(b => fmt(get(b,month).addresses));
    $('view-status').textContent = `${niceBorough(borough)}, ${monthLabel(month)}. ${fmt(row.reports)} complaints at ${fmt(row.addresses)} distinct reported addresses. Map and timeline show ${measureText}.`;
  }
  // Canonicalize invalid parameters once; subsequent changes create history entries.
  history.replaceState(null,'',viewURL(location.href,view));
  update();
  $('load-status').hidden = true;
  $('dashboard').hidden = false;
}
start().catch(error => {
  console.error(error);
  $('load-status').textContent = 'The visualization could not load. Serve this folder over HTTP and reload. The anonymous data is available in data/heat-summary.json.';
});
