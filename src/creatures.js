// Original Petrealm illustrations, authored for this MIT-licensed project.
// Each animal and monster has its own anatomy; all paths are local and reusable.
const ink = '#414e46';
const line = (d, colour, width = 3) => `<path d="${d}" fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const eye = (x, y, rx = 4, ry = 6) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${ink}"/><circle cx="${x + 1}" cy="${y - 2}" r="1.3" fill="#fffbea"/>`;

function briarhare(grown) {
  return `<path d="M170 144Q206 120 212 148Q214 167 187 171" fill="#dcd6c3" stroke="#a6957f" stroke-width="3"/>
  <path d="M76 103Q53 26 77 16Q99 19 105 91M135 92Q139 19 160 24Q183 34 161 105" fill="#c4b297" stroke="#a28e72" stroke-width="3"/>
  <path d="M80 80Q69 35 79 29Q90 41 92 79M147 80Q151 38 159 38Q164 53 154 83" fill="#e5b7a0"/>
  <ellipse cx="127" cy="154" rx="51" ry="43" fill="#c5b598" stroke="#a28e72" stroke-width="3"/>
  <ellipse cx="126" cy="162" rx="31" ry="29" fill="#efe4cc"/>
  <path d="M71 189Q74 165 98 168L110 189Q109 204 73 203M139 189Q143 166 164 170Q188 177 185 201H142" fill="#b5a184" stroke="#a28e72" stroke-width="3"/>
  <path d="M70 116Q71 76 116 76Q164 72 173 115Q177 151 132 158Q83 161 70 116" fill="#d0bfa1" stroke="#a28e72" stroke-width="3"/>
  <ellipse cx="118" cy="139" rx="23" ry="14" fill="#f3e9d4"/>${eye(94,116)}${eye(139,114)}
  <path d="M110 129L121 128L116 135Z" fill="#b77e73"/>${line('M116 135v6m0-1q-9 7-15 0m15 0q7 6 14-1M88 133l-18-3m18 9l-17 3M143 130l17-4m-15 11l18 3', '#8e806b', 2)}
  ${grown ? `<path d="M97 80Q97 60 111 54Q125 68 122 80M122 78Q135 56 152 64Q151 82 122 83" fill="#8fa573" stroke="#728855" stroke-width="2"/><circle cx="121" cy="75" r="5" fill="#e1bb80"/>${line('M82 185l8 3m-6 6l8 1m64-8l8 3m-7 6l8 1','#e7d6ae',2)}` : `<path d="M170 143l8-5 7 7-8 6Z" fill="#92a577"/>`}`;
}

function pebblepup(grown) {
  return `<path d="M169 147Q208 119 211 90Q228 134 181 172" fill="#ac8569" stroke="#876b54" stroke-width="3"/>
  <ellipse cx="126" cy="157" rx="54" ry="40" fill="#c5a17a" stroke="#987957" stroke-width="3"/>
  <path d="M82 168Q58 199 78 204H104L106 169M144 167L144 204H178Q189 193 169 168" fill="#d8b790" stroke="#987957" stroke-width="3"/>
  <path d="M78 86Q43 74 48 129Q51 158 77 153L92 106M157 86Q192 70 196 116Q201 149 174 154L150 110" fill="#977456" stroke="#7f614c" stroke-width="3"/>
  <path d="M73 109Q74 68 123 67Q172 65 175 111Q181 150 126 168Q71 157 73 109" fill="#d5b28b" stroke="#987957" stroke-width="3"/>
  <path d="M109 70Q100 92 108 111L137 113Q142 88 133 69" fill="#efe0c3"/>
  <ellipse cx="122" cy="143" rx="32" ry="20" fill="#f2e3c7"/>${eye(96,115,5,6)}${eye(151,115,5,6)}
  <path d="M111 130Q123 124 135 130Q134 141 123 142Q112 138 111 130" fill="#665344"/>
  ${line('M123 142v7m0-1q-10 9-18 1m18-1q9 10 17 1M82 196h17m51 0h18', '#806a52', 2)}
  <path d="M117 158Q122 174 131 158" fill="#dba48d"/>
  ${grown ? `<path d="M70 97Q54 102 58 131M179 99Q192 112 184 132" stroke="#c7a685" stroke-width="4" fill="none"/><path d="M93 164Q120 179 151 163L153 177Q123 192 91 177Z" fill="#a3ac78"/><path d="M116 182l7-4 7 4-2 10h-9Z" fill="#e4c58f"/>` : ''}`;
}

function cloudmoth(grown) {
  return `<path d="M112 120Q72 36 30 64Q1 95 31 131L106 148Q32 135 29 169Q31 204 71 193L113 163M130 119Q171 37 208 61Q238 84 215 130L136 150Q211 128 215 164Q218 202 177 194L129 163" fill="#b4b0c8" stroke="#827f9b" stroke-width="3"/>
  <path d="M97 128Q71 68 43 77Q24 91 43 117ZM143 127Q170 68 198 77Q214 93 198 118Z" fill="#e5d8bb"/>
  <path d="M100 158Q54 146 44 166Q48 187 71 180ZM142 158Q190 143 201 165Q195 186 174 181Z" fill="#d0cadb"/>
  <circle cx="57" cy="104" r="12" fill="#9a98b5"/><circle cx="185" cy="104" r="12" fill="#9a98b5"/>
  <circle cx="57" cy="104" r="5" fill="#f1ead1"/><circle cx="185" cy="104" r="5" fill="#f1ead1"/>
  ${line('M104 96Q92 69 83 57m53 39q9-24 23-37M82 57l-10-7m13 13l-13-2m84-1l12-8m-16 15l15-4', '#72758a', 3)}
  <path d="M105 116Q105 91 120 89Q139 90 138 116L142 175Q131 195 119 193Q105 187 101 174Z" fill="#e6dfcb" stroke="#8d8b99" stroke-width="3"/>
  <path d="M102 151l38 1m-37 13l37 1m-34 13l29 1" stroke="#c5bdad" stroke-width="3"/>
  ${eye(113,111,3,4)}${eye(129,111,3,4)}${line('M116 122q5 4 10 0','#71777d',2)}
  ${grown ? `<path d="M33 133L48 141L36 153M207 132L193 141L207 154" fill="none" stroke="#e8c88e" stroke-width="4"/><path d="M60 78l4-8 4 8 9 2-7 5 1 9-7-5-7 5 1-9-7-5Zm115 0l4-8 4 8 9 2-7 5 1 9-7-5-7 5 1-9-7-5Z" fill="#f3e6bb"/>${line('M47 165l17 5m132-5l-16 5','#a3a27f',3)}` : ''}`;
}

function kilnback(grown) {
  return `<path d="M153 149Q208 116 210 149Q205 174 170 177" fill="#b67858" stroke="#8f654e" stroke-width="3"/>
  <path d="M82 148L81 194Q87 205 110 199L113 162M147 158L150 199Q172 207 182 194L177 149" fill="#b57c59" stroke="#8f654e" stroke-width="3"/>
  <path d="M74 122L96 78L136 67L177 89L188 143L155 179L106 171Z" fill="#cb9a73" stroke="#8f654e" stroke-width="3"/>
  <path d="M108 93l-8-50h25l6 41m7 0l5-57h24l-9 69" fill="#b67d5c" stroke="#8f654e" stroke-width="3"/>
  <path d="M98 42h30v10H98m42-25h31v11h-31" fill="#e3b58a" stroke="#8f654e" stroke-width="2"/>
  <path d="M88 113L106 129L130 109L159 133L178 120M111 129L117 157M156 135L148 168" fill="none" stroke="#edc385" stroke-width="4"/>
  <path d="M47 135Q50 102 82 99Q116 102 121 134Q120 169 85 179Q47 168 47 135" fill="#d9ae83" stroke="#8f654e" stroke-width="3"/>
  <path d="M50 125l-9-17 23 5m33-6l13-16 4 25" fill="#c08b63" stroke="#8f654e" stroke-width="3"/>
  ${eye(65,135,4,5)}${eye(98,131,4,5)}<path d="M74 149q9 7 17-2" stroke="#765a47" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M103 45Q89 30 101 18M152 28Q171 16 160 5" fill="none" stroke="#eadcc0" stroke-width="6" stroke-linecap="round"/>
  ${grown ? `<path d="M131 86l-1-17 16-9 12 14-4 19Z" fill="#809780" stroke="#617d68" stroke-width="2"/><path d="M126 109l7-6 4 8 9 1-5 7 2 8-8-2-6 6-2-9-8-3Z" fill="#f5d59a"/>${line('M86 191l13 1m57 0l12 1','#e7bd8e',3)}` : ''}`;
}

function gloomdrop(grown) {
  return `<path d="M67 155Q40 113 74 86Q83 55 117 57Q141 68 154 36Q184 41 175 83Q214 113 193 153Q225 187 196 191Q173 175 153 193Q132 179 111 196Q92 179 69 194Q32 195 49 175Z" fill="#788795" stroke="#546574" stroke-width="3"/>
  <path d="M99 67Q84 51 90 32Q112 36 117 63M145 75Q153 61 161 48" fill="#9aa7ae" stroke="#617480" stroke-width="3"/>
  <path d="M60 169Q123 188 190 164Q183 182 164 183L143 188L123 183L103 190L79 181Z" fill="#a4b3b6"/>
  <path d="M71 114Q73 89 95 89" stroke="#adbdbd" stroke-width="5" fill="none" stroke-linecap="round"/>
  ${eye(99,121,5,5)}${eye(152,120,7,6)}<path d="M116 144Q131 135 145 144Q131 156 116 144" fill="#d7c4b6"/>
  <path d="M75 145l2-5 2 5 5 2-5 2-2 5-2-5-5-2m84-49l2-5 2 5 5 2-5 2-2 5-2-5-5-2" fill="#e8d5a9"/>
  <g fill="#c5c4c0"><circle cx="119" cy="91" r="2"/><circle cx="174" cy="143" r="3"/><circle cx="94" cy="166" r="2"/></g>
  ${grown ? `<path d="M91 47Q75 34 69 47Q69 62 98 61M157 58Q184 47 182 65Q178 77 163 76" fill="#9fae9e" stroke="#728c7d" stroke-width="2"/><path d="M114 166l5-10 5 10 11 2-8 7 2 10-10-5-9 5 2-10-8-7Z" fill="#e8d5a9"/>` : ''}`;
}

function thistlehorn(grown) {
  return `<path d="M83 144L55 156L65 179L89 165M162 144L188 151L184 177L160 166" fill="#889d79" stroke="#5f7958" stroke-width="3"/>
  <path d="M86 169L79 196L104 204L113 178M137 178L144 204L167 196L161 168" fill="#829573" stroke="#5f7958" stroke-width="3"/>
  <path d="M68 109L59 88L82 88L77 64L99 74L113 53L128 72L150 58L156 83L181 81L174 106L188 118L172 131L179 153L158 154L151 182L131 173L113 187L99 172L80 180L77 156L60 146L71 129L59 117Z" fill="#a2b28b" stroke="#6e885f" stroke-width="3" stroke-linejoin="round"/>
  <path d="M91 91Q64 70 71 37Q83 61 107 66M141 66Q166 61 173 36Q181 70 156 91" fill="#dbc89d" stroke="#9e946e" stroke-width="3"/>
  <path d="M86 114Q123 84 160 114L150 154Q123 176 94 154Z" fill="#d5d7b3"/>
  ${eye(103,122,5,6)}${eye(143,122,5,6)}<path d="M112 139Q123 131 134 139Q125 150 112 139" fill="#6b785d"/>
  <path d="M107 151l4-8 4 7m15 0l5-7 3 7" fill="#fff1d1"/>
  ${line('M95 81l10 12m16-18l2 15m24-10l-9 12M77 134l10 3m74-3l9-5','#82986e',3)}
  ${grown ? `<path d="M73 39L67 17L77 23L82 5L89 32M171 39L179 19L171 24L165 7L158 32" fill="#c8b88c" stroke="#9e946e" stroke-width="2"/><g fill="#d5ab91"><path d="M94 74l-6-7 6-6 7 5 5-2 4 7-8 6Z"/><path d="M149 75l-4-9 8-4 6 5 6 2-4 8Z"/></g><circle cx="99" cy="70" r="3" fill="#f3dda3"/><circle cx="155" cy="71" r="3" fill="#f3dda3"/>` : ''}`;
}

const bodies = { briarhare, pebblepup, cloudmoth, kilnback, gloomdrop, thistlehorn };
export function creatureBody(species, { grown = false } = {}) {
  return typeof species === 'string' && Object.hasOwn(bodies, species) ? bodies[species](grown) : '';
}
export function accessoryAnchors(species) {
  const anchors = {
    briarhare: { head: 'translate(0 20)', neck: 'translate(0 -4)' },
    pebblepup: { head: 'translate(2 13)', neck: 'translate(2 7)' },
    cloudmoth: { head: 'translate(49 39) scale(.6)', neck: 'translate(43 25) scale(.65)' },
    kilnback: { head: 'translate(-3 58) scale(.72)', neck: 'translate(-3 50) scale(.72)' },
    gloomdrop: { head: 'translate(4 17)', neck: 'translate(5 3)' },
    thistlehorn: { head: 'translate(4 11)', neck: 'translate(3 2)' },
  };
  return typeof species === 'string' && Object.hasOwn(anchors, species) ? anchors[species] : { head: '', neck: '' };
}
