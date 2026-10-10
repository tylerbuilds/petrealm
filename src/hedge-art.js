/**
 * Original, editable Under the Hedge family illustrations.
 * Each family has its own anatomy and pose rig. No external artwork, fonts,
 * filters or shared SVG IDs: portraits can be repeated and exported safely.
 */
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const pick = (table, key, fallback) => typeof key === 'string' && Object.hasOwn(table, key) ? table[key] : table[fallback];
const palettes = {
  clay: {body:'#b9967e',light:'#cfb499',shade:'#947961',belly:'#e4d5b4',fold:'#9a786b',edge:'#e0bca2',ink:'#524b40'},
  stone: {body:'#99a6a0',light:'#bcc6b8',shade:'#75877f',belly:'#dddcc2',fold:'#7c9790',edge:'#becdbd',ink:'#414f49'},
  river: {body:'#86a6a4',light:'#b0c4b7',shade:'#678b8a',belly:'#d9dcc0',fold:'#72918d',edge:'#bbceba',ink:'#3f5550'},
  water: {body:'#86a6a4',light:'#b0c4b7',shade:'#678b8b',belly:'#d9dcc0',fold:'#72918d',edge:'#bbceba',ink:'#3f5550'},
  reed: {body:'#a4ad83',light:'#c6c9a4',shade:'#818d67',belly:'#e4dfb8',fold:'#8b9472',edge:'#d1d2af',ink:'#505942'},
};
const poses = {
  settle: {body:'translate(0 5) scale(1 .975)',head:'rotate(0 130 143)',paw:'rotate(0 112 190)',fold:'scale(1)',eye:'soft',tail:'rotate(0 232 181)',label:'settling comfortably'},
  greet: {body:'translate(0 -3)',head:'rotate(-4 130 143)',paw:'rotate(64 113 188)',fold:'scale(1)',eye:'bright',tail:'rotate(-8 232 181)',label:'lifting a forepaw in greeting'},
  investigate: {body:'translate(-3 0)',head:'rotate(7 130 143)',paw:'rotate(-24 112 190)',fold:'translate(-7 -8) scale(1.055)',eye:'focus',tail:'rotate(5 232 181)',label:'leaning forward to investigate'},
  choose: {body:'translate(-1 -2)',head:'rotate(-7 130 143)',paw:'rotate(-15 112 190)',fold:'scale(1)',eye:'focus',tail:'rotate(-3 232 181)',label:'considering a find'},
  hesitate: {body:'translate(5 0)',head:'rotate(-6 130 143)',paw:'rotate(25 112 190)',fold:'translate(7 7) scale(.95)',eye:'uncertain',tail:'rotate(7 232 181)',label:'pausing before the next step'},
  listen: {body:'translate(0 -1)',head:'rotate(-9 130 143)',paw:'rotate(0 112 190)',fold:'translate(-4 -5) scale(1.035)',eye:'focus',tail:'rotate(-10 232 181)',label:'holding still to listen'},
  familiar: {body:'translate(-2 2)',head:'rotate(4 130 143)',paw:'rotate(-12 112 190)',fold:'scale(1)',eye:'happy',tail:'rotate(-5 232 181)',label:'recognising something familiar'},
};
const line = (d, stroke, width = 1.6, extra = '') => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const shape = (d, fill, stroke, extra = '') => `<path d="${d}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"` : ''} ${extra}/>`;
const eye = (x, y, kind, ink, scale = 1) => {
  if (kind === 'happy') return line(`M${x-4} ${y+1}q4-6 8 0`, ink, 2.7);
  if (kind === 'soft') return `<ellipse cx="${x}" cy="${y}" rx="${3.9*scale}" ry="${4.5*scale}" fill="${ink}"/><circle cx="${x+1}" cy="${y-1.5}" r="1" fill="#fff9dc"/>`;
  return `<ellipse cx="${x}" cy="${y}" rx="${4*scale}" ry="${5.6*scale}" fill="${ink}"/><circle cx="${x+1.3}" cy="${y-2}" r="1.4" fill="#fff9dc"/>`;
};
const dots = (positions, colour, opacity = .65) => `<g fill="${colour}" opacity="${opacity}">${positions.map(([x,y,r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r*.72}" transform="rotate(-18 ${x} ${y})"/>`).join('')}</g>`;

function rillum(p, pose, marking, character) {
  const mallow = character === 'mallow';
  const tail = `${shape(mallow ? 'M220 169C247 158 274 153 299 171C311 180 306 196 288 202C263 208 244 198 224 192Z' : 'M221 168C246 164 269 155 290 170C306 181 300 197 283 199C258 203 244 192 224 191Z',p.body,p.ink)}${shape('M240 179Q268 169 292 180Q282 194 251 185Z',marking === 'tail' ? p.belly : p.light)}${line('M239 182Q265 177 284 183',p.shade)}${line('M259 172l-3 11m16-14-5 13m17-8-9 10',p.shade,1.2)}`;
  const hindfeet = `<g data-anatomy="webbed-hindfeet">${shape('M226 181Q251 180 260 192L275 204Q280 211 269 212L253 209L245 214L233 209Q226 205 224 198Z',p.shade,p.ink)}${line('m244 194 9 13m1-13 11 12',p.ink,1.1)}${shape('M193 198Q213 194 226 208L243 223Q246 230 234 232L217 229L206 233L193 228Q185 224 189 214Z',p.body,p.ink)}${line('m208 213 9 14m1-16 13 15',p.shade,1.4)}</g>`;
  const body = `${shape('M81 153C77 119 113 94 154 87C198 76 239 107 246 149C254 191 228 217 181 220C126 224 86 203 81 153Z',p.body,p.ink)}${shape('M124 99Q177 74 213 112Q185 101 168 116Q121 134 102 144Q97 118 124 99Z',p.light)}${shape('M113 171Q139 158 174 173Q198 187 187 212Q152 222 123 205Q108 191 113 171Z',p.belly)}${shape('M215 123Q245 160 225 193Q222 202 213 205Q226 170 212 149Z',p.shade)}${line('M173 96q14 0 25 6m9 7 6 7m17 41q2 19-6 31',p.edge,2.8)}${line('M184 191q11-6 20 0m-14 5 10 1',p.shade,1.2)}`;
  const freckles = marking === 'speckles' || mallow ? dots([[177,123,3],[190,119,2],[199,128,3.2],[207,136,2],[181,132,1.7],[216,154,3],[221,163,2],[208,163,1.6],[178,104,1.4]],mallow ? '#f0e3c8' : p.belly) : '';
  const belly = marking === 'belly' ? shape('M105 148Q118 135 140 141Q163 146 163 166Q157 193 135 190Q110 187 105 148Z',p.belly) : '';
  const folds = `<g data-anatomy="pleated-cheek-folds" transform="${pose.fold}">${shape('M92 128Q76 120 63 129Q67 133 61 140Q66 145 64 151Q71 156 70 161Q84 164 97 151Z',p.fold,p.ink)}${line('M69 132l19 5m-21 6 21 2m-15 12 15-6',p.edge,2)}${shape('M155 127Q170 119 182 127Q177 132 183 139Q178 144 180 150Q173 154 173 158Q161 162 153 149Z',p.fold,p.ink)}${line('M175 130l-15 8m17 3-16 4m11 9-12-4',p.edge,2)}</g>`;
  const face = `<g data-part="head" transform="${pose.head}">${folds}${shape('M83 134Q86 105 119 106Q153 103 165 133Q173 157 150 174Q130 184 103 172Q81 163 83 134Z',p.body,p.ink)}${shape('M92 132Q98 110 122 113Q143 111 153 128Q129 120 110 130Z',p.light)}${belly}${eye(105,143,pose.eye,p.ink)}${eye(146,140,pose.eye,p.ink)}${shape('M121 152q5-3 9 0q-4 6-9 0',p.shade)}${line('M121 164q7 4 14-2',p.ink,1.7)}${dots([[93,151,2],[99,157,1.2],[153,152,1.7]],p.fold,.55)}${pose.eye === 'uncertain' ? line('M100 132l8-3m32-2 8 3',p.ink,1.5) : ''}${line('M115 119q8-3 15-1',p.edge,2)}</g>`;
  const paws = `<g data-anatomy="small-forepaws"><g transform="${pose.paw}">${shape('M103 185Q95 193 97 207Q97 217 109 220Q120 222 124 215Q125 210 120 205L119 189',p.body,p.ink)}${line('m106 212 1 5m6-5 1 5',p.shade,1.2)}</g><g${mallow ? ' transform="rotate(-12 154 199)"' : ''}>${shape('M144 193Q137 208 141 220Q146 230 159 227Q168 224 161 216L160 197',p.body,p.ink)}${line('m150 219 1 5m6-6 1 5',p.shade,1.2)}</g></g>`;
  return `<g data-part="body" transform="${pose.body}"><g data-anatomy="paddle-tail" transform="${pose.tail}">${tail}</g>${hindfeet}${body}${freckles}${face}${paws}</g>`;
}

function tuffet(p, pose, marking, character) {
  const dindle = character === 'dindle';
  const feet = `<g data-anatomy="four-short-feet">${shape('M78 194Q65 208 72 217Q80 223 94 218L103 199M127 206Q116 222 126 229Q137 232 148 226L150 209M199 205Q191 223 201 228Q215 231 223 222L226 202M244 193Q260 199 262 211Q258 220 244 216L234 201',p.shade,p.ink)}${line('m79 214 7 2m45 8 8 1m68-2 9 1m34-12 7 3',p.belly,1.4)}</g>`;
  const body = `${shape('M59 178C57 140 86 108 126 101C181 89 228 116 250 153Q267 180 253 202C226 227 91 225 65 201Q60 192 59 178Z',p.body,p.ink)}${shape('M85 140Q114 107 154 111Q193 109 222 139Q185 124 151 135Q115 152 85 159Z',p.light)}${shape('M209 149Q247 163 246 198Q211 217 172 212Q217 199 209 149Z',p.shade)}${shape('M76 180Q102 169 130 188L143 213Q98 219 76 199Z',p.belly)}${line('M87 137l7-5m13-11 8-3m12-4 12-1m58 10 8 4m18 17 5 6',p.belly,2)}${marking === 'speckles' ? dots([[168,148,3],[180,140,2],[194,151,2.5],[203,158,1.4],[220,185,2],[212,194,1.7]],p.belly) : ''}`;
  const ears = `<g data-anatomy="broad-folding-ears">${shape('M98 136Q65 125 56 103Q48 82 66 78Q93 77 118 117Z',p.body,p.ink)}${shape('M61 92Q64 115 99 127L87 104Z',p.fold)}${line('M65 87Q72 104 93 115',p.edge,2)}<g transform="${dindle ? 'rotate(12 151 135)' : pose.eye === 'focus' ? 'rotate(-18 151 135)' : 'rotate(0 151 135)'}">${shape('M142 118Q155 87 177 87Q195 88 187 106Q179 125 157 139Z',p.body,p.ink)}${shape('M179 95Q170 113 153 129L155 111Z',p.fold)}${line('M178 96l-15 19',p.edge,2)}</g></g>`;
  const face = `<g data-part="head" transform="${pose.head}">${ears}${shape('M71 160Q70 131 102 125Q135 118 154 144Q166 170 146 187Q124 204 95 192Q73 182 71 160Z',p.body,p.ink)}${shape('M83 164Q94 150 112 154Q132 156 146 174Q133 194 107 190Q87 183 83 164Z',p.belly)}${eye(91,153,pose.eye,p.ink,.94)}${eye(133,149,pose.eye,p.ink,.94)}${shape('M103 168q7-7 16-2q0 8-7 9q-7-1-9-7',p.ink)}${line('M112 175v5m0 0q-5 3-8-1m8 1q5 3 9-2',p.ink,1.5)}${line('M81 170l7 1m48-4 8-2M94 136l6-3',p.shade,1.3)}</g>`;
  const moss = dindle ? `<g data-character="dindle-moss">${shape('M191 135l-5-9 6 2 3-10 4 8 8-5 1 8 8-1-4 8-8 5Z','#7d8c62')}${line('m194 135 3-9m2 13 5-10m1 8 5-4','#b7bd88',1.6)}</g>` : '';
  return `<g data-part="body" transform="${pose.body}">${feet}${body}${face}${moss}${line('M167 193l3 4m8-7 3 4m-8-12 3 3',p.light,1.5)}</g>`;
}

function limmer(p, pose, marking, character) {
  const pell = character === 'pell', ossel = character === 'ossel';
  const tail = `<g data-anatomy="long-balancing-tail" transform="${pose.tail}">${shape('M193 172C241 182 271 155 259 119C251 91 266 68 284 65L285 73C269 79 269 99 275 119C289 163 250 194 201 186Z',p.body,p.ink)}${line('M208 180Q265 183 269 144',p.light,2.5)}<g data-anatomy="small-light-tuft"><ellipse cx="285" cy="67" rx="16" ry="15" fill="#f0dc9d" opacity=".18"/>${shape(ossel ? 'M278 76l-6-6 7-3-3-10 9 3 5-9 3 10 8 1-6 7 3 7-10-2-6 7Z' : 'M277 74Q272 64 281 58L286 54L290 60Q301 64 294 74L286 78Z','#dacf99',p.ink)}${shape('M282 71q-3-7 4-11q7 5 3 11Z','#f4e8b4')}</g></g>`;
  const feet = `<g data-anatomy="four-climbing-feet">${shape('M155 174L157 205Q164 209 165 215Q160 221 149 217L144 187M190 173Q213 183 221 206L234 211Q239 217 229 219L214 215L196 194',p.shade,p.ink)}${shape('M97 173Q89 189 89 212L77 218Q73 225 83 226L102 219L110 184M124 176Q125 201 119 221Q122 229 133 227L140 217L145 178',pell ? '#52625a' : p.body,p.ink)}${line('M80 221l8-1m36 4 8-2m19-7 8 1m61-1 9 2',p.light,1.2)}</g>`;
  const body = `${shape('M98 150C118 132 159 135 192 158Q208 168 207 184Q187 201 153 187L102 178Z',p.body,p.ink)}${shape('M112 150Q151 137 185 157Q157 153 143 163L113 167Z',p.light)}${shape('M109 173Q143 163 164 177L189 190Q165 193 141 182Z',p.belly)}${line('M157 147l9 3m9 4 7 4m12 12 2 5',p.edge,2)}${marking === 'speckles' ? dots([[157,162,2],[167,166,2.7],[176,172,1.7],[153,171,1.3]],p.belly) : ''}`;
  const fans = `<g data-anatomy="folding-side-fans">${shape('M74 156Q43 140 41 119Q54 119 62 121L66 108Q87 113 94 144Z',p.fold,p.ink)}${line('M48 125l30 24m-21-26 24 21m-11-29 16 27',p.edge,1.5)}${shape(ossel ? 'M106 138Q111 108 135 99L137 113L149 113L148 128Q130 146 115 153Z' : 'M105 139Q108 115 132 104L136 116L149 117Q142 144 116 154Z',p.fold,p.ink)}${line('M113 143l18-32m-12 34 22-23',p.edge,pell ? 2.8 : 1.5)}${pell ? line('M131 105l5 11 12 2','#e2dec0',3) : ''}</g>`;
  const face = `<g data-part="head" transform="${ossel ? 'rotate(-9 110 153)' : pose.head}">${fans}${shape('M69 152Q72 133 93 132Q121 126 132 149Q141 172 119 185Q98 194 77 179Q64 170 69 152Z',p.body,p.ink)}${shape('M74 162Q90 151 112 160L125 173Q114 186 96 184Q80 178 74 162Z',p.belly)}${eye(81,154,pose.eye,p.ink,.82)}${eye(116,150,pose.eye,p.ink,.82)}${shape('M92 166q4-4 9-1q-3 6-7 3Z',p.ink)}${line('M98 171q5 5 11 1',p.ink,1.4)}${line('M89 141l7-2m-22 29 6 1m40-5 6-2',p.shade,1.2)}</g>`;
  return `<g data-part="body" transform="${pose.body}">${tail}${feet}${body}${face}</g>`;
}

/** An accessible, self-contained portrait; all dynamic inputs are allowlisted or escaped. */
export function familyCreature(family = 'rillum', options = {}) {
  const {name = '', tone = 'clay', marking = 'speckles', pose = 'settle'} = options && typeof options === 'object' ? options : {};
  const familyId = ['rillum','tuffet','limmer'].includes(family) ? family : 'rillum';
  const poseId = typeof pose === 'string' && Object.hasOwn(poses,pose) ? pose : 'settle';
  const markings = ['speckles','belly','tail'].includes(marking) ? marking : 'speckles';
  const safeName = typeof name === 'string' ? name.slice(0,120) : '';
  const palette = pick(palettes,tone,'clay');
  const state = poses[poseId];
  const character = safeName.trim().toLowerCase();
  const label = `${safeName ? `${safeName}, a` : 'A'} ${familyId === 'rillum' ? 'Rillum' : familyId === 'tuffet' ? 'Tuffet' : 'Limmer'}, ${state.label}`;
  const art = ({rillum,tuffet,limmer})[familyId](palette,state,markings,character);
  return `<svg class="hedge-creature hedge-creature--${familyId}" data-family="${familyId}" data-pose="${poseId}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 260" role="img" aria-label="${escape(label)}" focusable="false"><title>${escape(label)}</title><ellipse cx="168" cy="232" rx="105" ry="10" fill="#394b36" opacity=".10"/>${art}</svg>`;
}

/** Small drawn UI marks. Labels belong to the enclosing button or link. */
export function hedgeIcon(name = 'leaf') {
  const icons = {
    leaf: 'M5 20C3 9 11 3 22 3C22 15 15 22 5 20ZM4 22L17 9M9 17l-1-5m5 1 5 1',
    home: 'M3 21V14C3 7 8 3 13 4C20 3 23 9 23 15V21M8 21V16C8 9 18 9 18 16V21M2 22h22M5 9l3 2m11-2-2 2',
    paths: 'M4 22C3 16 17 18 14 13S8 7 14 3M19 22C23 16 21 13 18 11M3 6l3-2 3 2-3 2ZM19 5l3-2 2 3-3 2Z',
    journal: 'M4 4h14q3 0 3 3v16H7q-3 0-3-3ZM8 4v15M5 19h16M12 9h5m-5 4h5',
    neighbours: 'M2 21q0-8 6-8t6 8M13 15q2-3 5-3q6 0 6 8M5 8a3 3 0 1 0 6 0a3 3 0 1 0-6 0M16 6a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
    save: 'M13 3v13m-5-5 5 5 5-5M4 16v6h18v-6',
    sound: 'M4 10h4l5-5v16l-5-5H4ZM17 8q6 5 0 10m3-13q9 8 0 16',
    muted: 'M4 10h4l5-5v16l-5-5H4ZM18 10l6 6m0-6-6 6',
    settings: 'M4 7h18M4 19h18M8 4v6m10 6v6',
    back: 'M22 13H4m7-7-7 7 7 7',
    close: 'M6 6l14 14M20 6 6 20',
    check: 'M4 13l6 6L22 6',
  };
  return `<svg class="hedge-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${pick(icons,name,'leaf')}"/></svg>`;
}
