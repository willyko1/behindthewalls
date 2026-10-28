import test from 'node:test';
import assert from 'node:assert/strict';
import {profile,normalizeSaved} from '../building-model.js';
test('profile distinguishes recurrent months from continuous outage claims',()=>{
 const p=profile({m:[4,0,2,2,2,0,0,0]});
 assert.equal(p.total,10);assert.equal(p.active,4);assert.equal(p.longest,3);assert.equal(p.peakShare,40);assert.deepEqual(p.peakMonths,['Oct 2025']);
});
test('ties and empty histories have truthful peak labels',()=>{
 assert.deepEqual(profile({m:[0,2,0,2,0,0,0,0]}).peakMonths,['Nov 2025','Jan 2026']);
 assert.deepEqual(profile({m:Array(8).fill(0)}).peakMonths,[]);
});
test('saved comparisons reject stale IDs, duplicates and more than three entries',()=>{
 assert.deepEqual(normalizeSaved(['x','a','a','b','c','d'],new Set(['a','b','c','d'])),['a','b','c']);
 assert.deepEqual(normalizeSaved({},new Set()),[]);
});
