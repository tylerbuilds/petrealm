// Original Petrealm trail scenery and found objects, drawn for this game. MIT.
const ink = '#566d4b';
const svg = (body, label, viewBox = '0 0 100 100') => `<svg viewBox="${viewBox}" role="img" aria-label="${label}" focusable="false" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

export function treasureArt(id, label = 'A trail treasure') {
  const drawings = {
    'fern-flute': '<path d="m28 76 16-55q12-10 26 2L51 80Z" fill="#a9ba74"/><path d="m38 69 17-42M42 42l-11-9m17-2-8-9m9 37 16-5m-21 20 15-3" fill="none" stroke="#637c47" stroke-width="3"/><g fill="#f5edcb"><circle cx="50" cy="36" r="3"/><circle cx="46" cy="50" r="3"/><circle cx="42" cy="64" r="3"/></g><path d="m69 26 11-7m-9 15 13 2" stroke="#bc945b" stroke-width="3"/>',
    'button-mushroom': '<path d="M40 46h20l6 34q-15 8-31 0Z" fill="#eddfb9"/><path d="M18 50C17 5 84 5 83 50Q52 64 18 50Z" fill="#c98b74"/><g fill="#f8ebc9"><circle cx="35" cy="37" r="5"/><circle cx="59" cy="28" r="6"/><circle cx="69" cy="43" r="4"/></g><path d="M44 69h13m-11 6h9" stroke="#ae9470" stroke-width="2"/>',
    'seed-lantern': '<path d="M34 25q17-22 32 0M47 23v-9" fill="none" stroke="#758954" stroke-width="5"/><path d="M25 27q-8 30 25 57 32-27 25-57Z" fill="#d2b36c"/><path d="M36 35q-5 21 14 36 19-16 14-36Z" fill="#fff0ac"/><path d="M50 44v14m-7-7h14" stroke="#dcbd71" stroke-width="3"/>',
    'ripple-shell': '<path d="M18 58C4 27 40 8 60 20 89 20 95 50 77 74Q49 91 18 58Z" fill="#bdcfb9"/><path d="M28 62c-17-25 10-44 31-27 24 7 20 33 2 37-24 5-34-25-14-28 13-2 16 14 7 17" fill="none" stroke="#799e98" stroke-width="5"/><path d="m21 70 3 11 20-2" fill="#d4dec0"/>',
    'glass-pebble': '<path d="M21 63 30 27 66 16 83 49 70 76 36 83Z" fill="#a6cebf"/><path d="m30 27 19 21 17-32M49 48l34 1M49 48 36 83m13-35 21 28" fill="none" stroke="#d8eee0" stroke-width="3"/><path d="m28 53 8-18 12-4" fill="none" stroke="#eff7db" stroke-width="5"/>',
    'pond-crown': '<path d="m21 51 4-25 21 19 11-27 16 24 12-13-5 38-54 6Z" fill="#a1b981"/><path d="m26 64 51-6" stroke="#6a8b60" stroke-width="5"/><path d="M43 61q-6-19 9-23 19 9 9 21" fill="#d7acc0"/><circle cx="52" cy="51" r="6" fill="#f2d998"/>',
    'cloud-kite': '<path d="m49 13 32 29-30 36-29-35Z" fill="#cbb9cc"/><path d="m49 13 2 65M22 43l59-1" stroke="#967da1" stroke-width="3"/><path d="M51 78q-28 3-8 14m-1-9-8 1 3 6m10-1 9 3-5 5" fill="none" stroke="#a98e70" stroke-width="3"/><path d="M40 37q8-9 16 0 10-3 9 6H34q-2-5 6-6" fill="#f3ebd6"/>',
    'wind-chime': '<path d="M50 13v15m-23 9q22-25 47 0Z" fill="#a1b783"/><path d="M32 37v18m19-18v29m18-29v20" stroke="#9f8864" stroke-width="2"/><path d="M26 52h12v24H26Zm19 10h12v25H45Zm18-8h12v23H63Z" fill="#d8c092"/><path d="m30 61 5-1m14 12h4m14-9 4-1" stroke="#a68b61" stroke-width="2"/>',
    sunwheel: '<circle cx="50" cy="50" r="29" fill="#e7bf79"/><circle cx="50" cy="50" r="16" fill="#f6e1a5"/><path d="M50 14V5m0 90v-9M14 50H5m90 0h-9M24 24l-7-7m66 66-7-7M24 76l-7 7m66-66-7 7" stroke="#c59a5e" stroke-width="5" stroke-linecap="round"/><path d="M44 51q6 7 12 0" fill="none" stroke="#b49055" stroke-width="2"/>',
  };
  return svg(`<ellipse cx="50" cy="89" rx="32" ry="5" fill="#60774e" opacity=".12"/><g stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${drawings[id] || '<path d="M39 32q0-17 14-17t14 17q0 12-14 17v9m0 9v3" fill="none" stroke="#8b9878" stroke-width="5"/>'}</g>`, label);
}

export function trailScenery(routeId, variant = 0) {
  const pond = routeId === 'glowpool';
  const ridge = routeId === 'windridge';
  const sky = pond ? '#d7e6dd' : ridge ? '#e7e0ef' : '#e6edca';
  const detail = pond
    ? '<ellipse cx="625" cy="295" rx="302" ry="88" fill="#83b5ad"/><path d="M403 286h85m62 51h105m69-60h125" stroke="#c8e5ca" stroke-width="4"/><g fill="#9aac75"><ellipse cx="752" cy="294" rx="43" ry="12"/><ellipse cx="565" cy="322" rx="36" ry="10"/></g><path d="m702 264 12-68m8 69 2-54m-499 87-5-105m-9 109-11-79" stroke="#6d8f66" stroke-width="7"/><g fill="#c6b481"><ellipse cx="714" cy="201" rx="8" ry="26"/><ellipse cx="218" cy="198" rx="8" ry="26"/></g><g fill="#f9e9aa"><circle cx="501" cy="199" r="6"/><circle cx="777" cy="165" r="5"/><circle cx="604" cy="155" r="4"/></g>'
    : ridge
      ? '<path d="M0 235 214 72 410 231 584 52 823 236 1000 114V420H0Z" fill="#bac4ab"/><path d="m173 106 41-34 48 38-37-8-18 15Z" fill="#f0eedc"/><path d="m534 97 50-45 61 53-45-10-28 13Z" fill="#f3ecd8"/><path d="M0 338q240-80 471-16t529-11v109H0Z" fill="#9fb38b"/><path d="m699 284 32-31 27 36-5 32h-55Z" fill="#a2a48b"/><path d="M391 150q60-22 122 0m-57 35q40-12 72 0m203-15q53-16 83-2" fill="none" stroke="#faf6e7" stroke-width="6" stroke-linecap="round"/>'
      : '<g stroke="#8c8b65" stroke-width="17" stroke-linecap="round"><path d="m82 277 23-237m44 231-7-190m677 197L846 23m83 270-4-213"/></g><g fill="#8ca56d"><ellipse cx="89" cy="47" rx="91" ry="77"/><ellipse cx="172" cy="85" rx="70" ry="56"/><ellipse cx="837" cy="49" rx="115" ry="78"/><ellipse cx="957" cy="92" rx="91" ry="67"/></g><path d="M715 288q-24-84 24-104 57 35 34 105Z" fill="#adb987"/><path d="M732 279q-2-59 15-73" fill="none" stroke="#677e51" stroke-width="4"/><g fill="#c38f6f"><path d="M560 277q0-43 53-43t53 43Z"/><path d="M614 293q0-24 31-24t31 24Z"/></g><path d="M611 277v40m34-24v26" stroke="#e6d4a6" stroke-width="13"/><g fill="#f7eac8"><circle cx="592" cy="258" r="7"/><circle cx="627" cy="250" r="8"/></g>';
  const changing = [
    '<g fill="#e5b77d"><circle cx="358" cy="258" r="6"/><circle cx="378" cy="249" r="4"/><circle cx="395" cy="266" r="5"/></g>',
    '<path d="M456 250q17-18 30 0 18-18 30 0" fill="none" stroke="#967e9e" stroke-width="4"/><path d="M488 245v22" stroke="#967e9e" stroke-width="3"/>',
    '<path d="m392 290 11-16 12 13m-5-13 13-14 15 17" fill="none" stroke="#ab8362" stroke-width="4" stroke-linecap="round"/>',
  ][variant] || '';
  return `<svg class="trail-scenery" viewBox="0 0 1000 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><rect width="1000" height="420" fill="${sky}"/><circle cx="653" cy="85" r="38" fill="#f8e9b5"/><path d="M0 260q207-121 463-39t537-32v231H0Z" fill="#c0cfa3"/>${detail}<path d="M0 347q286-57 459-7t541-5v85H0Z" fill="#acbf8d"/><path d="M430 420q-79-75 35-111 52-19 45-62" fill="none" stroke="#e6d9ad" stroke-width="38"/>${changing}<g stroke="#789556" stroke-width="4" fill="none"><path d="m53 375 8-32m-3 19-10-9m10 6 13-8M901 372v-35m0 14 13-10"/></g></svg>`;
}
