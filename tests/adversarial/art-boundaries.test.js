import test from 'node:test';
import assert from 'node:assert/strict';
import { creature, itemArt, opponentArt } from '../../src/art.js';
import { creatureBody, accessoryAnchors } from '../../src/creatures.js';
import { treasureArt } from '../../src/trail-art.js';

// These are reusable exported renderers. Although game saves validate species,
// rendering helpers must also keep unknown strings out of attribute context.
test('regression: unknown species cannot inject an SVG attribute', () => {
  const html = creature('mossling" onload="alert(1)', 'A fictional "friend" <3');
  assert.doesNotMatch(html, /onload=|<script\b/);
  assert.match(html, /data-creature="mossling"/);
  assert.match(html, /aria-label="A fictional &quot;friend&quot; &lt;3"/);
});

test('regression: inherited creature catalogue keys do not invoke prototype functions', () => {
  for (const id of ['__proto__', 'constructor', 'toString']) {
    assert.equal(creatureBody(id), '');
    assert.deepEqual(accessoryAnchors(id), { head: '', neck: '' });
    for (const draw of [itemArt, opponentArt, treasureArt]) assert.doesNotMatch(draw(id), /\[object Object\]|function Object|function toString/);
    assert.match(creature(id), /data-creature="mossling"/);
  }
});

test('labels and optional clothing remain readable for malformed but harmless arguments', () => {
  for (const label of [null, 7, true, {}, '🌿 "Fern" <3 & friends']) {
    const html = creature('mossling', label, null);
    assert.match(html, /^<svg /);
    assert.doesNotMatch(html, /aria-label="[^"]*"\s+on/);
  }
});
