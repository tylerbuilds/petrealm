import test from 'node:test';
import assert from 'node:assert/strict';
import { adopt, createState, startExpedition, claimExpedition, serialiseSave, readCompanionStory } from '../src/model.js';
import { companionKeepsake, companionPortrait } from '../src/companion-export.js';

const NOW = Date.parse('2026-10-10T12:00:00Z');
const escaped = text => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

test('keepsake exports preserve the earned story and portrait without mutating or embedding the save', () => {
  let state = adopt(createState(NOW), 'Pip & Fern', 'briarhare', NOW, 'gentle');
  state = startExpedition(state, 'glowpool', 'help', NOW);
  state = claimExpedition(state, NOW + 31_000);
  const before = serialiseSave(state);
  const story = readCompanionStory(state);
  const html = companionKeepsake(state);
  const svg = companionPortrait(state);
  assert.match(html, /^<!doctype html>/i);
  assert.ok(html.includes(escaped(story.biography)));
  assert.ok(html.includes(escaped(story.memories[0].title)));
  assert.ok(html.includes(escaped(story.memories[0].text)));
  assert.ok(html.includes(svg));
  assert.match(svg, /^<svg[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /data-creature="briarhare"/);
  assert.match(html, /default-src 'none'/);
  assert.doesNotMatch(html, /<script|<iframe|<foreignObject|\son\w+=|(?:src|href)="https?:/i);
  assert.ok(!html.includes(before));
  assert.equal(serialiseSave(state), before);
});

test('player names cannot escape HTML text, document titles or SVG attributes', () => {
  // All are valid short names, including markup-shaped names from an imported world.
  for (const name of ['<script>x</script>', '\"><svg onload=1>', '</title><img src=x>', "O'Fern & <Pip>"]) {
    let state = adopt(createState(NOW), name, 'mossling', NOW);
    state = claimExpedition(startExpedition(state, 'whisperwood', 'notice', NOW), NOW + 31_000);
    const html = companionKeepsake(state);
    const svg = companionPortrait(state);
    assert.ok(html.includes(`<title>${escaped(name)} · A Petrealm story</title>`), name);
    assert.ok(html.includes(`<h1>${escaped(name)}</h1>`), name);
    assert.ok(svg.includes(`aria-label="${escaped(name)}, a Mossling"`), name);
    assert.ok(!html.includes(name), `Raw name leaked into HTML: ${name}`);
    assert.ok(!svg.includes(name), `Raw name leaked into SVG: ${name}`);
    assert.doesNotMatch(html, /<script|<img|<iframe|<foreignObject|"\s+onload=/i);
    assert.doesNotMatch(svg, /<script|<img|<iframe|<foreignObject|"\s+onload=/i);
  }
});

test('empty worlds cannot export an invented companion', () => {
  for (const exportFile of [companionKeepsake, companionPortrait]) {
    assert.throws(() => exportFile(createState(NOW)), /Choose a companion/);
  }
});
