import test from 'node:test';
import assert from 'node:assert/strict';
import {familyCreature, hedgeIcon} from '../src/hedge-art.js';

const families = ['rillum','tuffet','limmer'];
const poses = ['greet','investigate','choose','hesitate','settle','listen','familiar'];

test('portraits remain accessible and self-contained across every family and pose', () => {
  for (const family of families) for (const pose of poses) {
    const svg = familyCreature(family,{name:'Fen',pose});
    assert.match(svg,/^<svg[^>]*xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    assert.match(svg,/viewBox="0 0 320 260"/);
    assert.match(svg,/role="img" aria-label="Fen, a /);
    assert.match(svg,/<title>Fen, a /);
    assert.match(svg,/<\/svg>$/);
    assert.doesNotMatch(svg, /<script|<image|<foreignObject|<animate|<style|\s(?:href|id)=|url\(/i);
    assert.doesNotMatch(svg,/NaN|undefined|Infinity/);
  }
});

test('family silhouettes encode different bodies without clothes or accessory dependencies', () => {
  const rillum = familyCreature('rillum');
  const tuffet = familyCreature('tuffet');
  const limmer = familyCreature('limmer');
  for (const anatomy of ['webbed-hindfeet','small-forepaws','paddle-tail','pleated-cheek-folds']) assert.ok(rillum.includes(`data-anatomy="${anatomy}"`));
  for (const anatomy of ['four-short-feet','broad-folding-ears']) assert.ok(tuffet.includes(`data-anatomy="${anatomy}"`));
  for (const anatomy of ['four-climbing-feet','folding-side-fans','long-balancing-tail','small-light-tuft']) assert.ok(limmer.includes(`data-anatomy="${anatomy}"`));
  const shapePaths = svg => [...svg.matchAll(/<path d="([^"]+)"/g)].map(match => match[1]).join('|');
  assert.equal(new Set([rillum,tuffet,limmer].map(shapePaths)).size,3);
});

test('names cannot escape either accessible attributes or the SVG title', () => {
  const unsafe = '\"><script>alert(1)</script><svg onload="x">&\'';
  const svg = familyCreature('rillum',{name:unsafe});
  assert.doesNotMatch(svg,/<script|<svg onload|" onload=/);
  assert.ok(svg.includes('&quot;&gt;&lt;script&gt;'));
  assert.ok(svg.includes('&amp;&#39;'));
  assert.equal((svg.match(/<svg\b/g)||[]).length,1);
});

test('unknown and adversarial configuration falls back to safe defaults', () => {
  for (const value of ['__proto__','constructor','\"><script>x</script>',null,{},42]) {
    assert.equal(familyCreature(value),familyCreature('rillum'));
    assert.equal(familyCreature('rillum',{tone:value,marking:value,pose:value}),familyCreature('rillum'));
    assert.equal(hedgeIcon(value),hedgeIcon('leaf'));
  }
  assert.equal(familyCreature('rillum',null),familyCreature('rillum'));
});

test('appearance stays deterministic and each selected marking changes the Rillum', () => {
  const drawings = new Set();
  for (const tone of ['clay','stone','river']) for (const marking of ['speckles','belly','tail']) {
    const options = {name:'Fen',tone,marking};
    const snapshot = JSON.stringify(options);
    const svg = familyCreature('rillum',options);
    assert.equal(svg,familyCreature('rillum',options));
    assert.equal(JSON.stringify(options),snapshot);
    drawings.add(svg);
  }
  assert.equal(drawings.size,9);
});

test('companion poses change the body illustration as well as the text label', () => {
  const bodyDrawings = poses.map(pose => familyCreature('rillum',{pose}).split('</title>')[1]);
  assert.equal(new Set(bodyDrawings).size,poses.length);
});

test('neighbours have authored individual details within their family body plans', () => {
  for (const [family,name] of [['rillum','Mallow'],['tuffet','Dindle'],['limmer','Pell'],['limmer','Ossel']]) {
    const body = svg => svg.split('</title>')[1];
    assert.notEqual(body(familyCreature(family,{name})),body(familyCreature(family)));
  }
});

test('UI icons are decorative and need no shared IDs or network resources', () => {
  for (const icon of ['home','paths','journal','neighbours','save','sound','muted','settings','back','close','check']) {
    const svg = hedgeIcon(icon);
    assert.match(svg,/aria-hidden="true" focusable="false"/);
    assert.match(svg,/stroke="currentColor"/);
    assert.doesNotMatch(svg, /\s(?:href|id)=|url\(|<script/);
  }
});
