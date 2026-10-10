import { SPECIES, PERSONALITIES, readActivePet, readCompanionStory } from './model.js';
import { creature } from './art.js';

const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

/** A self-contained portrait: no scenery uploads, network or account data. */
export function companionPortrait(state) {
  const pet = readActivePet(state);
  if (!pet) throw new Error('Choose a companion before keeping their portrait.');
  return creature(pet.species, `${pet.name}, a ${SPECIES[pet.species].name}`, pet.wearing, Boolean(pet.journey.growth));
}

/** An offline, printable keepsake. Every player-authored value is escaped. */
export function companionKeepsake(state) {
  const pet = readActivePet(state);
  if (!pet) throw new Error('Choose a companion before keeping their story.');
  const story = readCompanionStory(state, pet.id);
  const memories = story.memories.map(memory => `<article><h3>${escape(memory.title)}</h3><p>${escape(memory.text)}</p></article>`).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:"><title>${escape(pet.name)} · A Petrealm story</title>
<style>html{background:#f2eddc;color:#293e32;font:18px/1.7 Georgia,serif}body{max-width:720px;margin:50px auto;padding:40px;background:#fffcf0;border:1px solid #cbd2b8;border-radius:22px}header{text-align:center}svg{width:240px;max-width:100%;height:auto}h1{font-size:48px;margin:0;overflow-wrap:anywhere}h2{font-size:28px;margin-top:38px}h3{font-size:21px;margin-bottom:5px}p{overflow-wrap:anywhere}.eyebrow,footer{font:13px/1.5 system-ui,sans-serif;letter-spacing:.08em}.eyebrow{text-transform:uppercase}article{border-top:1px solid #dce1cb;margin-top:22px}footer{margin-top:42px;letter-spacing:0;color:#5c6c57}@media(max-width:600px){body{margin:12px;padding:24px}h1{font-size:36px}}@media print{html,body{background:white}body{border:0;margin:0;max-width:none}article{break-inside:avoid}}</style></head>
<body><header><p class="eyebrow">A little life in Petrealm</p>${companionPortrait(state)}<h1>${escape(pet.name)}</h1><p>${escape(SPECIES[pet.species].name)} · ${escape(PERSONALITIES[pet.personality].name)}${pet.journey.growth ? ' · First bloom' : ''}</p></header><main><h2>${escape(story.heading)}</h2><p>${escape(story.biography)}</p><h2>Things we remember</h2>${memories || '<p>A name, a sunny patch, and a whole world still to discover. The first page is yours to write together.</p>'}</main><footer>Kept from your own Petrealm world. Open this file any time, or print it to keep a paper copy. Your world save is a separate file.</footer></body></html>`;
}
