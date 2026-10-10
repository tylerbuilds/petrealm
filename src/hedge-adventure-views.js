import { PLAY_LEVELS, DECORATIONS } from './hedge-model.js';
import { familyCreature } from './hedge-art.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stars = count => `<span class="adventure-stars" aria-label="${count} of 3 stars"><span aria-hidden="true">${'★'.repeat(count)}${'☆'.repeat(3-count)}</span></span>`;
export function decorationArt(id) {
  const shapes = {
    'fern-arch':'<path d="M19 69Q11 19 47 17Q79 13 78 66" fill="none" stroke="#597947" stroke-width="7"/><path d="m19 49-10-9m11-4-7-11m15 1-2-13m12 9 4-13m13 12 7-12m2 19 13-8m-8 21 15-6m-14 19 15-2" stroke="#8fad62" stroke-width="9" stroke-linecap="round"/>',
    'pebble-stack':'<ellipse cx="48" cy="70" rx="33" ry="10" fill="#80978b"/><ellipse cx="48" cy="54" rx="27" ry="11" fill="#b1bbaa"/><ellipse cx="48" cy="37" rx="20" ry="10" fill="#859b94"/><ellipse cx="48" cy="21" rx="13" ry="8" fill="#ccd1b7"/>',
    'glow-petals':'<path d="M12 25q30 20 72-2" fill="none" stroke="#756c43" stroke-width="3"/><g fill="#ead272" stroke="#b78b41"><path d="M26 30q-15 16 0 23 14-12 0-23Z"/><path d="M47 33q-15 20 0 26 15-14 0-26Z"/><path d="M68 30q-12 16 0 24 15-13 0-24Z"/></g>',
    'moss-patch':'<path d="M10 61Q7 43 21 41 14 20 36 27 45 13 57 29 78 20 76 40 95 50 82 64Z" fill="#86a259" stroke="#567448" stroke-width="3"/><path d="m22 51 7-7m9 10 5-15m13 11 9-9m4 15 5-5" stroke="#c3ca7b" stroke-width="4" stroke-linecap="round"/>',
    'reed-chimes':'<path d="M14 24q30 10 68-4" stroke="#866c45" stroke-width="5" fill="none"/><path d="m27 28-3 32m19-30-2 43m19-47-2 31m17-35-1 43" stroke="#b3a565" stroke-width="7" stroke-linecap="round"/><path d="M23 52h5m11 11h5m11-16h5m12 8h5" stroke="#76633e" stroke-width="2"/>',
    'ripple-ring':'<ellipse cx="48" cy="52" rx="35" ry="22" fill="#70a5a0" stroke="#a6b5a3" stroke-width="10" stroke-dasharray="14 3"/><ellipse cx="48" cy="53" rx="17" ry="7" fill="none" stroke="#d0e5c1" stroke-width="3"/>',
  };
  return `<svg viewBox="0 0 96 88" aria-hidden="true">${shapes[id] || shapes['moss-patch']}</svg>`;
}
export function renderPlayHub(state) {
  const pet = state.companion;
  const next = PLAY_LEVELS.find(level => (!level.requires || state.play.best[level.requires].clears > 0) && !state.play.best[level.id].clears) || PLAY_LEVELS[0];
  const totalStars = Object.values(state.play.best).reduce((sum,best)=>sum+best.stars,0);
  return `<section class="adventure-intro"><div><p class="hedge-eyebrow">Take the paws. Find your way.</p><h1 id="hedge-view-title" tabindex="-1">Let’s play.</h1><p>Dash through the roots, grab glowseeds and find the hidden way home.</p><button class="hedge-button adventure-start" data-action="play-run" data-level="${next.id}">Play ${next.name} <span aria-hidden="true">▶</span></button><div class="adventure-controls-hint"><span><kbd>W A S D</kbd> or arrows</span><span><kbd>Space</kbd> to dash</span><span>Touch controls too</span></div></div><div class="adventure-hero-pet">${familyCreature('rillum',{name:pet.name,tone:pet.appearance.colour,marking:pet.appearance.marking,pose:'greet'})}<span>${esc(pet.name)} is ready.</span></div></section><div class="adventure-progress"><span><strong>${totalStars}<small> / 9</small></strong> trail stars</span><span><strong>${state.play.seeds}</strong> glowseeds to build with</span><a href="#home">Build your hideout ↗</a></div><div class="adventure-trail-heading"><h2>Pick your trail</h2><label class="adventure-assist"><input type="checkbox" id="hedge-play-assist">Gentler obstacles <small>Same rewards. More room to learn.</small></label></div><section class="adventure-trails" aria-label="Playable trails">${PLAY_LEVELS.map((level,index)=>{
    const best = state.play.best[level.id], unlocked = !level.requires || state.play.best[level.requires].clears > 0;
    return `<article class="adventure-trail adventure-trail--${level.id}${unlocked?'':' adventure-trail--locked'}"><div class="adventure-trail-art" aria-hidden="true"><span>${['☘','≈','✧'][index]}</span><i></i><b>0${index+1}</b></div><div class="adventure-trail-body"><div class="adventure-trail-rating">${stars(best.stars)}${best.secret?'<span class="adventure-secret-found">Secret found ✦</span>':''}</div><h3>${level.name}</h3><p>${esc(level.description)}</p>${best.clears?`<small>Best ${best.timeMs?`${(best.timeMs/1000).toFixed(1)}s`:'—'} · ${best.seeds}/8 glowseeds</small>`:'<small>Find 5 glowseeds. Reach the arch. Look for a secret.</small>'}<button class="hedge-button ${index?'hedge-button--quiet':''}" data-action="play-run" data-level="${level.id}" ${unlocked?'':'disabled'}>${unlocked?(best.clears?'Play again':'Let’s go'):`Finish ${PLAY_LEVELS.find(x=>x.id===level.requires).name} first`} <span aria-hidden="true">${unlocked?'↗':'◇'}</span></button></div></article>`;
  }).join('')}</section><p class="adventure-replay-note">Three stars: finish the trail, collect all 8 seeds, then beat the trail time. No game over. Keep trying new routes.</p>${state.play.active?'<p class="adventure-resume-note">Your last trail wasn’t finished. Choose a trail for a fresh run; everything you already earned is safe.</p>':''}`;
}
export function renderWorkshop(state) {
  return `<section class="adventure-workshop" id="hedge-workshop"><div class="hedge-section-heading"><div><p class="hedge-eyebrow">Make it yours</p><h2>Build your hideout</h2></div><span class="adventure-bank"><strong>${state.play.seeds}</strong> glowseeds</span></div><p>Play trails to find new things. Build once, then swap them whenever you like.</p><div class="adventure-decorations">${DECORATIONS.map(item=>{
    const owned = state.play.decorations.includes(item.id), equipped=state.play.equipped[item.spot]===item.id;
    const unlocked = state.play.best[item.level].clears > 0;
    const affordable=owned || (unlocked && state.play.seeds>=item.cost);
    return `<article class="adventure-decoration${equipped?' is-equipped':''}"><div class="adventure-decoration-art">${decorationArt(item.id)}</div><h3>${item.name}</h3><p>${item.description}</p><button class="hedge-button hedge-button--quiet" data-action="build-decoration" data-decoration="${item.id}" data-spot="${item.spot}" ${equipped||!affordable?'disabled':''}>${equipped?'At home ✓':owned?'Put at home':!unlocked?`Earn in ${PLAY_LEVELS.find(x=>x.id===item.level).name}`:item.cost?`Build · ${item.cost} seeds`:'Put at home'}</button></article>`;
  }).join('')}</div><a class="hedge-button" href="#play">Find more on a trail ↗</a></section>`;
}
export function renderHomeDecorations(state) {
  return Object.entries(state.play.equipped).filter(([,id])=>id).map(([spot,id])=>`<div class="adventure-home-prop adventure-home-prop--${spot}" role="img" aria-label="${esc(DECORATIONS.find(d=>d.id===id)?.name)}">${decorationArt(id)}</div>`).join('');
}
