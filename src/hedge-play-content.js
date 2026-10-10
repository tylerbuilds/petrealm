/** Rewards belong to the places actually played; every route can be replayed freely. */
export const PLAY_LEVELS = Object.freeze([
  {id:'broadroot',name:'Broadroot Rush',place:'Broadroot Wood',description:'Dash through the ferns, gather fallen seeds and find Dindle’s hidden hollow.',requires:null,neighbour:'dindle',interest:'shelter',secretName:'Dindle’s hidden hollow',icon:'leaf'},
  {id:'dryfoot',name:'Brook Skip',place:'Dryfoot Crossing',description:'Hop across the brook, dodge the current and find Pell’s secret stepping stone.',requires:'broadroot',neighbour:'pell',interest:'sound',secretName:'Pell’s secret stepping stone',icon:'stone'},
  {id:'alderwater',name:'Lantern Trail',place:'Alderwater',description:'Follow the shore, gather seeds and discover the warm-root flowers with Mallow.',requires:'dryfoot',neighbour:'mallow',interest:'water',secretName:'The warm-root flowers',icon:'water'},
]);
export const DECORATION_SPOTS = Object.freeze(['root','riverside','canopy']);
export const DECORATIONS = Object.freeze([
  {id:'fern-arch',name:'Fern arch',description:'A curl of fern above the entrance. Earned in Broadroot.',cost:0,level:'broadroot',spot:'root',icon:'leaf'},
  {id:'pebble-stack',name:'Skipping stones',description:'Smooth stones beside the water. Earned at Dryfoot.',cost:0,level:'dryfoot',spot:'riverside',icon:'stone'},
  {id:'glow-petals',name:'Golden petals',description:'Fallen petals catch the light under the roots. Earned at Alderwater.',cost:0,level:'alderwater',spot:'canopy',icon:'star'},
  {id:'moss-patch',name:'Moss cushion',description:'A soft patch of moss to curl up on.',cost:4,level:'broadroot',spot:'root',icon:'leaf'},
  {id:'reed-chimes',name:'Rustling reeds',description:'Dry reeds whisper whenever the breeze passes.',cost:6,level:'dryfoot',spot:'canopy',icon:'sound'},
  {id:'ripple-ring',name:'Pebble pool',description:'A ring of river pebbles around the washing hollow.',cost:8,level:'alderwater',spot:'riverside',icon:'water'},
]);
