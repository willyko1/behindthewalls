import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {MONTHS, DEFAULT_VIEW, readView, viewURL, createLookup, copyViewLink} from '../model.js';
const data = JSON.parse(await readFile(new URL('../data/heat-summary.json',import.meta.url)));
const get = createLookup(data);
test('frozen full-season totals include the unspecified borough',() => {
  assert.equal(get(-1,-1).reports,341824);
  assert.equal(get(-1,-1).addresses,41102);
  assert.equal(get(5,-1).reports,1);
  for (const month of [-1,...MONTHS.keys()]) {
    for (const metric of ['reports','addresses','repeated']) {
      assert.equal(Array.from({length:6},(_,b) => get(b,month)[metric]).reduce((a,b) => a+b,0),get(-1,month)[metric]);
    }
  }
});
test('January comparison reverses the Bronx/Brooklyn ranking by measure',() => {
  assert.deepEqual([get(0,3).reports,get(0,3).addresses],[27176,5232]);
  assert.deepEqual([get(1,3).reports,get(1,3).addresses],[21945,5884]);
});
test('season uses deduplicated addresses, never the monthly sum',() => {
  for (let borough = -1; borough < 5; borough++) {
    const monthly = Array.from(MONTHS.keys(),m => get(borough,m));
    assert.equal(monthly.reduce((n,r) => n+r.reports,0),get(borough,-1).reports);
    assert.ok(monthly.reduce((n,r) => n+r.addresses,0) > get(borough,-1).addresses);
  }
  for (const row of data.rows) {
    assert.equal(row.histogram.reduce((a,b) => a+b,0),row.addresses);
    assert.equal(row.addresses-row.histogram[0],row.repeated);
  }
});
test('all 108 shareable views round-trip beneath a repository subdirectory',() => {
  for (const month of [-1,...MONTHS.keys()]) for (const borough of [-1,0,1,2,3,4]) for (const measure of ['reports','addresses']) {
    const state = {month,borough,measure};
    const url = viewURL('https://example.com/behindthewalls/?ref=class#explore',state);
    assert.equal(url.pathname,'/behindthewalls/');
    assert.equal(url.searchParams.get('ref'),'class');
    assert.equal(url.hash,'#explore');
    assert.deepEqual(readView(url.search),state);
  }
});
test('invalid and missing URL parameters fall back independently',() => {
  assert.deepEqual(readView('?month=no&borough=elsewhere&measure=no'),DEFAULT_VIEW);
  assert.deepEqual(readView(''),DEFAULT_VIEW);
  assert.deepEqual(readView('?month=2026-01&borough=BRONX&measure=addresses'),{month:3,borough:0,measure:'addresses'});
  assert.deepEqual(readView('?month=2026-01&borough=no&measure=addresses'),{month:3,borough:-1,measure:'addresses'});
});
test('clipboard success and denied/unavailable fallbacks preserve the full URL',async () => {
  const url = 'https://example.com/behindthewalls/?month=2026-01&borough=bronx&measure=addresses';
  let value;
  assert.equal(await copyViewLink(url,{writeText:async text => {value=text;}},() => assert.fail()),true);
  assert.equal(value,url);
  for (const clipboard of [undefined,{writeText:async () => {throw Error('Denied');}}]) {
    assert.equal(await copyViewLink(url,clipboard,text => {value=text;}),false);
    assert.equal(value,url);
  }
});
test('public data has no incident addresses or request identifiers',() => {
  assert.ok(!/incident_address|unique_key|latitude|longitude/.test(JSON.stringify(data)));
  assert.equal(data.retrieved,'2026-10-07');
});
