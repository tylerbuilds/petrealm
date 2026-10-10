import { familyCreature } from './hedge-art.js';
import { createRun, stepRun, LEVELS, WORLD_WIDTH, WORLD_HEIGHT } from './hedge-play-engine.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const clock = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const TAU = Math.PI * 2;
const palette = { broadroot: ['#7c966a','#506f50','#f0dca1'], dryfoot: ['#839e7f','#4c795e','#e6dcb0'], alderwater: ['#7a9581','#416b60','#e5d39c'] };
const neighbours = { broadroot: ['Dindle','tuffet','reed'], dryfoot: ['Pell','limmer','stone'], alderwater: ['Mallow','rillum','clay'] };

function ellipse(ctx, x, y, rx, ry, fill, rotation = 0) {
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rotation, 0, TAU); ctx.fillStyle = fill; ctx.fill();
}
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}
function seeded(seed = 1997) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}
function seedShape(ctx, x, y, scale = 1, collected = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.rotate(-.3);
  ellipse(ctx, 0, 3, 9, 11, '#45533025');
  ctx.beginPath(); ctx.moveTo(0,-11); ctx.bezierCurveTo(14,-6,12,8,0,11); ctx.bezierCurveTo(-12,8,-13,-5,0,-11);
  ctx.fillStyle = collected ? '#718b52' : '#ffda73'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#826134'; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,-6); ctx.quadraticCurveTo(-3,0,0,6); ctx.strokeStyle = '#fff2b2'; ctx.stroke();
  ctx.restore();
}
function leaf(ctx, x, y, length, angle, colour) {
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle); ctx.beginPath(); ctx.moveTo(0,0);
  ctx.quadraticCurveTo(-length*.6,-length*.6,0,-length); ctx.quadraticCurveTo(length*.6,-length*.6,0,0);
  ctx.fillStyle = colour; ctx.fill(); ctx.restore();
}
function imageFor(family, options) {
  const image = new Image();
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(familyCreature(family,options))}`;
  return image;
}
function isBlocked(x, y, walls, padding = 25) {
  return x < padding || y < padding || x > WORLD_WIDTH-padding || y > WORLD_HEIGHT-padding || walls.some(w => x > w.x-padding && x < w.x+w.w+padding && y > w.y-padding && y < w.y+w.h+padding);
}

// Tap destinations use the same obstacle geometry as movement. A small grid keeps
// taps useful on narrow screens without changing the skill of the dash challenges.
function findPath(start, end, walls) {
  const size = 24, cols = Math.ceil(WORLD_WIDTH/size), rows = Math.ceil(WORLD_HEIGHT/size);
  const position = index => ({x:(index%cols)*size+size/2, y:Math.floor(index/cols)*size+size/2});
  const nearest = point => {
    let best = -1, distance = Infinity;
    for (let i=0;i<cols*rows;i++) { const p=position(i), d=(p.x-point.x)**2+(p.y-point.y)**2;
      if (d<distance && !isBlocked(p.x,p.y,walls)) { best=i; distance=d; }
    } return best;
  };
  const source=nearest(start), target=nearest(end); if (source<0 || target<0) return [];
  const open=[source], visited=new Set([source]), previous=new Map();
  for (let cursor=0;cursor<open.length;cursor++) {
    const current=open[cursor]; if (current===target) break;
    const x=current%cols, y=Math.floor(current/cols);
    for (const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]) {
      const nx=x+dx, ny=y+dy, next=ny*cols+nx;
      if(nx<0||ny<0||nx>=cols||ny>=rows||visited.has(next)) continue;
      const p=position(next); if(isBlocked(p.x,p.y,walls)) continue;
      visited.add(next); previous.set(next,current); open.push(next);
    }
  }
  if (!visited.has(target)) return [];
  const path=[]; let cursor=target;
  while(cursor!==source) { path.push(position(cursor)); cursor=previous.get(cursor); }
  path.reverse();path.unshift(position(source));
  if (!isBlocked(end.x,end.y,walls)) path.push(end);
  return path;
}

function buildGround(run, levelId) {
  const canvas=document.createElement('canvas'); canvas.width=WORLD_WIDTH; canvas.height=WORLD_HEIGHT;
  const ctx=canvas.getContext('2d'); const random=seeded(levelId==='broadroot'?113:levelId==='dryfoot'?411:715);
  const colours=palette[levelId] || palette.broadroot;
  ctx.fillStyle=colours[0]; ctx.fillRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);
  // Broad wash and uneven patches keep the playable floor distinct from roots.
  for(let i=0;i<65;i++) ellipse(ctx,random()*WORLD_WIDTH,random()*WORLD_HEIGHT,35+random()*70,20+random()*45,i%3?'#d4d5a512':'#344f3713',random()*3);
  const sunlight=ctx.createLinearGradient(WORLD_WIDTH,0,90,WORLD_HEIGHT);sunlight.addColorStop(0,'#fbe5a421');sunlight.addColorStop(.6,'#fbe5a407');sunlight.addColorStop(1,'#264f3726');ctx.fillStyle=sunlight;ctx.fillRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);
  const points=[run.player,...run.seeds,run.goal];
  points.forEach((point,i)=>{ ellipse(ctx,point.x,point.y,54+(i%3)*8,38+(i%4)*5,'#e6d8a023',-.15); });
  for(let i=0;i<1100;i++) {
    const x=random()*WORLD_WIDTH,y=random()*WORLD_HEIGHT;
    if(run.walls.some(w=>x>w.x-9&&x<w.x+w.w+9&&y>w.y-9&&y<w.y+w.h+9))continue;
    if(i%4===0){ctx.strokeStyle='#e3e2b730';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-2,y-4);ctx.moveTo(x,y);ctx.lineTo(x+3,y-3);ctx.stroke();}
    else ellipse(ctx,x,y,1+random()*2,.7+random(),'#364e321b');
  }
  // A dark, leafy boundary is visibly solid without pretending to be a wall.
  for(let i=0;i<76;i++) {
    const side=i%4,t=i/76*4%1;
    const x=side===0?-11:side===1?WORLD_WIDTH+11:t*WORLD_WIDTH;
    const y=side===2?-10:side===3?WORLD_HEIGHT+10:t*WORLD_HEIGHT;
    ellipse(ctx,x,y,26+random()*19,23+random()*15,'#354f3c',random()*3);
    leaf(ctx,x+(random()-.5)*24,y+(random()-.5)*24,16+random()*15,random()*TAU,'#718961');
  }
  // Very small flowers provide texture; only the outlined gold seeds are pickups.
  for(let i=0;i<24;i++){
    const x=random()*WORLD_WIDTH,y=random()*WORLD_HEIGHT;
    if(isBlocked(x,y,run.walls,28))continue;
    ctx.strokeStyle='#4c6c4a';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+2,y-8);ctx.stroke();
    ellipse(ctx,x+2,y-9,2.5,2,'#eddfa8');
  }
  return canvas;
}

function drawWall(ctx, wall, time, reducedMotion) {
  const {x,y,w,h,kind}=wall;
  if(kind==='water'){
    roundRect(ctx,x-2,y-2,w+4,h+4,9,'#365c56');
    roundRect(ctx,x,y,w,h,7,'#76aaa3');
    ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,7);ctx.clip();
    const movement=reducedMotion?0:time*7;
    for(let j=0;j<Math.ceil(h/26);j++){
      const yy=y+10+j*26;ctx.beginPath();
      for(let xx=x-20;xx<x+w+21;xx+=10){const py=yy+Math.sin((xx+movement)/32+j)*3;xx===x-20?ctx.moveTo(xx,py):ctx.lineTo(xx,py);}
      ctx.strokeStyle=j%2?'#e0efe656':'#497d7859';ctx.lineWidth=2;ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle='#b7c59d';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+5,y+1);ctx.lineTo(x+w-5,y+1);ctx.stroke();
    for(let i=0;i<Math.ceil(w/65);i++) {const xx=x+18+i*65;if(xx>x+w-5)continue;leaf(ctx,xx,y+4,14,-.3,'#536f49');leaf(ctx,xx+5,y+4,11,.4,'#a2b078');}
    return;
  }
  if(kind==='stone'){
    roundRect(ctx,x,y+4,w,h,Math.min(14,w/3,h/3),'#3b503f38');
    roundRect(ctx,x,y,w,h,Math.min(12,w/3,h/3),'#89958a','#526858');
    ctx.strokeStyle='#bcc3ab';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+9,y+6);ctx.lineTo(x+w-10,y+6);ctx.stroke();
    ctx.strokeStyle='#63786a';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+w*.63,y+3);ctx.lineTo(x+w*.5,y+h*.38);ctx.lineTo(x+w*.58,y+h*.6);ctx.stroke();
    ellipse(ctx,x+w*.25,y+h*.72,Math.min(17,w*.21),Math.min(7,h*.16),'#76875c');return;
  }
  roundRect(ctx,x,y+5,w,h,8,'#2b423641');
  roundRect(ctx,x,y,w,h,7,'#6c6751','#474c39');
  ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,7);ctx.clip();
  const vertical=h>w;
  for(let i=1;i<6;i++){
    ctx.beginPath();
    if(vertical){ctx.moveTo(x+w*i/6,y-4);ctx.bezierCurveTo(x+w*i/6+8,y+h*.3,x+w*i/6-6,y+h*.65,x+w*i/6+2,y+h+4);}
    else{ctx.moveTo(x-4,y+h*i/6);ctx.bezierCurveTo(x+w*.3,y+h*i/6-7,x+w*.7,y+h*i/6+6,x+w+4,y+h*i/6);}
    ctx.strokeStyle=i%2?'#968565':'#4a4f3b';ctx.lineWidth=i%2?2:1.5;ctx.stroke();
  }
  ctx.restore();
  for(let i=0;i<Math.floor((w+h)/39);i++){
    if(i%5===1||i%7===0)continue;
    const xx=vertical?x+4:x+13+i*37,yy=vertical?y+15+i*37:y+3;
    if(xx>x+w||yy>y+h)continue;
    ellipse(ctx,xx,yy+2,vertical?6:14,vertical?14:6,'#4e6747');
    leaf(ctx,xx,yy,9+i%4,-.8,'#698253');leaf(ctx,xx+5,yy,12+i%5,.35,'#b1ba79');
  }
  ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,7);ctx.clip();
  for(let i=0;i<Math.floor((w+h)/150);i++){
    const xx=vertical?x+w*.55:x+83+i*143,yy=vertical?y+83+i*143:y+h*.55;
    ctx.beginPath();ctx.ellipse(xx,yy,vertical?4:17,vertical?17:4,0,0,TAU);ctx.strokeStyle='#484d39';ctx.lineWidth=1.5;ctx.stroke();
    ctx.beginPath();ctx.ellipse(xx,yy,vertical?1.5:8,vertical?8:1.5,0,0,TAU);ctx.strokeStyle='#b2a47c';ctx.stroke();
  }ctx.restore();
}

function drawHazard(ctx, hazard, time, reducedMotion) {
  const {x,y,radius:r,kind,active}=hazard;
  const phase=reducedMotion?0:Math.sin(time*4);
  ctx.save();ctx.translate(x,y);
  if(kind==='mud'){
    ellipse(ctx,0,2,r+3,r*.8,'#4c57452e');ellipse(ctx,0,0,r,r*.74,'#807258');
    ellipse(ctx,-r*.1,-r*.12,r*.7,r*.42,'#a08b65');ellipse(ctx,r*.25,r*.1,r*.2,r*.13,'#655e49');
    ctx.strokeStyle='#d6c398';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(-3,-2,r*.37,r*.17,-.1,0,Math.PI);ctx.stroke();
  }else if(kind==='ripple'){
    ellipse(ctx,0,0,r,r,'#9bd3c244');
    for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,r*(.35+i*.29)+(active?phase*1.7:0),0,TAU);ctx.strokeStyle=active?'#ebf5cc':'#83bbaa';ctx.lineWidth=active?2:1;ctx.stroke();}
    if(active){ctx.beginPath();ctx.moveTo(-5,2);ctx.lineTo(0,-5);ctx.lineTo(5,2);ctx.strokeStyle='#fdf4c3';ctx.lineWidth=2;ctx.stroke();}
  }else{
    ellipse(ctx,0,3,r+3,r*.77,'#2f45352b');
    for(let i=0;i<7;i++){const a=i*TAU/7;leaf(ctx,Math.cos(a)*r*.4,Math.sin(a)*r*.35,r*.78,a+.4,active?'#805f45':'#839769');}
    ellipse(ctx,0,0,r*.25,r*.2,active?'#cd8b51':'#ccd49a');
    if(active){ctx.beginPath();ctx.arc(0,0,r+3,0,TAU);ctx.setLineDash([3,6]);ctx.strokeStyle='#f7d190';ctx.lineWidth=1.5;ctx.stroke();}
  }
  ctx.restore();
}

/** A complete, disposable game session. Save ownership remains with the app. */
export function mountHedgePlay(container, options={}) {
  const levelId=typeof options.level==='string'?options.level:options.level?.id;
  const metadata=LEVELS.find(level=>level.id===levelId)||LEVELS[0];
  let run=createRun(metadata.id,{assist:Boolean(options.assist),seed:1});
  let ground=buildGround(run,metadata.id), destroyed=false, paused=false, finishedAnnounced=false, frame=0, previousTime=0, hudTime=-1, noticeTime=0;
  let path=[], pointerPoint=null, pointerHeld=false, dashQueued=false, lastSoundEffect=-1, lastCollected=0;
  const keys=new Set(), held=new Map(), listenerRemovers=[];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const camera={x:WORLD_WIDTH/2,y:WORLD_HEIGHT/2,w:WORLD_WIDTH,h:WORLD_HEIGHT};
  const companion=options.companion||{}, appearance=companion.appearance||{};
  const playerImage=imageFor('rillum',{name:companion.name||'Fen',tone:appearance.colour||'river',marking:appearance.marking||'speckles',pose:'investigate'});
  const [neighbourName,neighbourFamily,neighbourTone]=neighbours[metadata.id]||neighbours.broadroot;
  const neighbourImage=imageFor(neighbourFamily,{name:neighbourName,tone:neighbourTone,pose:'greet'});
  container.innerHTML=`<section class="hedge-game" aria-label="${esc(metadata.title)} adventure">
    <header class="hedge-game-toolbar"><div class="hedge-game-quest"><span class="hedge-game-kicker">${options.assist?'Easy exploring':'Take the trail'}</span><h2>${esc(metadata.title)}</h2><p id="hedge-game-instructions">Move with arrows or WASD. Space to dash. Or tap where you want to go.</p></div><button type="button" class="hedge-game-icon-button" data-play-action="pause" aria-label="Pause adventure" title="Pause (Escape)"><span aria-hidden="true">Ⅱ</span></button></header>
    <div class="hedge-game-scorebar"><span class="hedge-game-seeds"><span aria-hidden="true">◆</span> <strong data-play-seeds>0 / ${run.seeds.length}</strong><span>seeds</span></span><span class="hedge-game-secret" data-play-secret><span aria-hidden="true">✧</span> Secret to find</span><span class="hedge-game-time"><strong data-play-time>0:00</strong><span>Star pace ${clock(metadata.parSeconds||90)}</span></span></div>
    <div class="hedge-game-viewport"><canvas id="hedge-game-canvas" tabindex="0" aria-label="Control ${esc(companion.name||'Fen')} through ${esc(metadata.title)}. Collect the gold seeds, then reach ${esc(neighbourName)}." aria-describedby="hedge-game-instructions"></canvas><div class="hedge-game-objective" data-play-objective>Find 5 glowseeds, then reach ${esc(neighbourName)}.</div><div class="hedge-game-notice" data-play-notice role="status" aria-live="polite"></div><div class="hedge-game-overlay" data-play-overlay hidden></div><div class="hedge-game-dash-state" aria-hidden="true"><span data-play-dash-meter></span></div></div>
    <div class="hedge-game-controls"><div class="hedge-game-dpad" aria-label="Movement controls"><button type="button" data-play-move="up" aria-label="Move up">↑</button><button type="button" data-play-move="left" aria-label="Move left">←</button><span aria-hidden="true">✦</span><button type="button" data-play-move="right" aria-label="Move right">→</button><button type="button" data-play-move="down" aria-label="Move down">↓</button></div><p class="hedge-game-control-tip"><strong>Small paws. Big shortcuts.</strong><span>Dash through tricky patches.<br>5 seeds open the finish.</span></p><button type="button" class="hedge-game-dash" data-play-action="dash" aria-label="Dash forward"><span aria-hidden="true">↗</span><strong>Dash</strong><small>Space</small></button></div>
    <footer class="hedge-game-footer"><span>Finish. Find all 8 seeds. Beat ${clock(metadata.parSeconds)}. Three stars to chase.</span><button type="button" data-play-action="exit">Back to trails</button></footer>
  </section>`;
  const canvas=container.querySelector('canvas'),ctx=canvas.getContext('2d'),viewport=canvas.parentElement;
  const overlay=container.querySelector('[data-play-overlay]'),timeEl=container.querySelector('[data-play-time]'),seedsEl=container.querySelector('[data-play-seeds]'),secretEl=container.querySelector('[data-play-secret]'),objectiveEl=container.querySelector('[data-play-objective]'),noticeEl=container.querySelector('[data-play-notice]'),dashMeter=container.querySelector('[data-play-dash-meter]');
  if(!ctx){container.innerHTML='<p>This browser cannot draw the adventure. Try a browser with canvas support.</p>';return{destroy(){},pause(){},resume(){},setSaveStatus(){},getSnapshot(){return null;}};}
  const on=(target,event,handler,options)=>{target.addEventListener(event,handler,options);listenerRemovers.push(()=>target.removeEventListener(event,handler,options));};
  const clearInput=()=>{keys.clear();held.clear();dashQueued=false;pointerHeld=false;container.querySelectorAll('.is-held').forEach(button=>button.classList.remove('is-held'));};
  function announce(message){noticeEl.textContent=message;noticeTime=2.8;}
  function focusCanvas(){canvas.focus({preventScroll:true});}
  function resize(){
    const bounds=viewport.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,2);if(bounds.width<=0||bounds.height<=0)return;
    canvas.width=Math.max(1,Math.round(bounds.width*ratio));canvas.height=Math.max(1,Math.round(bounds.height*ratio));
    const aspect=bounds.width/Math.max(1,bounds.height);
    camera.h=WORLD_HEIGHT;camera.w=Math.min(WORLD_WIDTH,WORLD_HEIGHT*aspect);
    if(aspect>WORLD_WIDTH/WORLD_HEIGHT){camera.w=WORLD_WIDTH;camera.h=WORLD_WIDTH/aspect;}
    if(bounds.width<=600&&camera.w>540){camera.w=540;camera.h=540/aspect;}
    camera.x=clamp(run.player.x,camera.w/2,WORLD_WIDTH-camera.w/2);camera.y=clamp(run.player.y,camera.h/2,WORLD_HEIGHT-camera.h/2);if(paused||run.finished)draw(run.elapsed,false);
  }
  function saveMarkup(status,message){
    const node=container.querySelector('[data-play-save]');if(!node)return;
    node.dataset.status=status;node.textContent=message||({pending:'Keeping this adventure…',saved:'Adventure saved.',error:'This adventure could not be saved. Keep this page open and try saving again.'})[status]||'';
    container.querySelector('.hedge-game-result')?.setAttribute('aria-busy',String(status==='pending'));
    for(const button of container.querySelectorAll('[data-play-action="replay"],[data-play-action="home"],[data-play-action="exit"]'))button.disabled=status==='pending';
    container.querySelector('[data-play-action="retry-save"]')?.remove();
    if(status==='error'&&options.onRetrySave){const button=document.createElement('button');button.type='button';button.className='hedge-game-secondary';button.dataset.playAction='retry-save';button.textContent='Try saving again';node.insertAdjacentElement('afterend',button);}
    if(status!=='pending'&&document.activeElement===container.querySelector('.hedge-game-result h3'))container.querySelector(status==='error'&&options.onRetrySave?'[data-play-action="retry-save"]':'[data-play-action="replay"]')?.focus({preventScroll:true});
  }
  function setSaveStatus(status,message){if(!destroyed)saveMarkup(status,message);}
  function pause(){
    if(destroyed||paused||run.finished)return;paused=true;cancelAnimationFrame(frame);clearInput();path=[];
    overlay.hidden=false;overlay.innerHTML=`<section class="hedge-game-pause-card"><span class="hedge-game-kicker">A breather</span><h3>Right where you left it.</h3><p>Your clock is paused.</p><button type="button" class="hedge-game-primary" data-play-action="resume">Keep exploring <span aria-hidden="true">↗</span></button><button type="button" class="hedge-game-secondary" data-play-action="exit">Back to trails</button></section>`;
    container.querySelector('[data-play-action="pause"]').setAttribute('aria-label','Resume adventure');
    overlay.querySelector('button').focus({preventScroll:true});
  }
  function resume(){if(destroyed||!paused||run.finished)return;paused=false;previousTime=0;clearInput();overlay.hidden=true;container.querySelector('[data-play-action="pause"]').setAttribute('aria-label','Pause adventure');focusCanvas();frame=requestAnimationFrame(tick);}
  function complete(){
    if(finishedAnnounced)return;finishedAnnounced=true;clearInput();path=[];
    const result=run.result;
    overlay.hidden=false;overlay.innerHTML=`<section class="hedge-game-result"><span class="hedge-game-kicker">Trail complete</span><div class="hedge-game-stars" aria-label="${result.stars} out of 3 stars">${Array.from({length:3},(_,i)=>`<span class="${i<result.stars?'is-earned':''}" aria-hidden="true">★</span>`).join('')}</div><h3>${result.stars===3?'A little trail legend.':result.stars===2?'That was a good run.':'Look how far you came.'}</h3><p>${esc(neighbourName)} has a place ready for you.</p><dl class="hedge-game-result-stats"><div><dt>Seeds</dt><dd>${result.seeds}/${run.seeds.length}</dd></div><div><dt>Time</dt><dd>${clock(result.timeMs/1000)}</dd></div><div><dt>Secret</dt><dd>${result.secret?'Found!':'Still out there'}</dd></div></dl><p class="hedge-game-next-try">${result.stars===3?(result.secret?'Every seed, a hidden keepsake, and a pace to be proud of.':'Three stars! There is still a hidden keepsake to find.'):result.seeds<8?'Collect all 8 glowseeds for another star.':`Try a dash shortcut: finish under ${clock(metadata.parSeconds)} for another star.`}</p><p class="hedge-game-save" data-play-save role="status">Keeping this adventure…</p><div class="hedge-game-result-actions"><button type="button" class="hedge-game-primary" data-play-action="replay">Play again <span aria-hidden="true">↗</span></button><button type="button" class="hedge-game-secondary" data-play-action="exit">Back to trails</button></div>${options.onHome?'<button type="button" class="hedge-game-home-reward" data-play-action="home">Take your finds home ↗</button>':''}</section>`;
    const resultTitle=overlay.querySelector('h3');resultTitle.tabIndex=-1;resultTitle.focus({preventScroll:true});
    saveMarkup('pending');
    try{const pending=options.onComplete?.({...result});if(pending?.catch)pending.catch(error=>setSaveStatus('error',error.message));if(!options.onComplete)setSaveStatus('saved','Trail complete.');}
    catch(error){setSaveStatus('error',error.message);}
  }
  function replay(){
    if(options.onReplay){options.onReplay();return;}
    run=createRun(metadata.id,{assist:Boolean(options.assist),seed:1});ground=buildGround(run,metadata.id);finishedAnnounced=false;paused=false;previousTime=0;hudTime=-1;lastCollected=0;lastSoundEffect=-1;path=[];clearInput();overlay.hidden=true;secretEl.innerHTML='<span aria-hidden="true">✧</span> Secret to find';secretEl.classList.remove('is-found');seedsEl.textContent=`0 / ${run.seeds.length}`;objectiveEl.textContent=`Find 5 glowseeds, then reach ${neighbourName}.`;noticeEl.textContent='';resize();focusCanvas();frame=requestAnimationFrame(tick);
  }
  function input(){
    let x=0,y=0;
    if(keys.has('ArrowLeft')||keys.has('a'))x--;if(keys.has('ArrowRight')||keys.has('d'))x++;
    if(keys.has('ArrowUp')||keys.has('w'))y--;if(keys.has('ArrowDown')||keys.has('s'))y++;
    for(const direction of held.values()){if(direction==='left')x--;if(direction==='right')x++;if(direction==='up')y--;if(direction==='down')y++;}
    if(x||y)path=[];
    else if(path.length){
      while(path.length&&Math.hypot(path[0].x-run.player.x,path[0].y-run.player.y)<8)path.shift();
      if(path.length){const point=path[0],distance=Math.hypot(point.x-run.player.x,point.y-run.player.y);x=(point.x-run.player.x)/Math.max(1,distance);y=(point.y-run.player.y)/Math.max(1,distance);}
    }
    const dash=dashQueued;dashQueued=false;return{x,y,dash};
  }
  function worldPoint(event){const rect=canvas.getBoundingClientRect();return{x:(event.clientX-rect.left)/rect.width*camera.w+camera.x-camera.w/2,y:(event.clientY-rect.top)/rect.height*camera.h+camera.y-camera.h/2};}
  function pathToDestination(point){
    // A tap on another seed is not an instruction to finish the adventure.
    // Keep the open arch out of that route until the player taps the arch itself.
    const goal=run.goal,avoidFinish=goal.open&&Math.hypot(point.x-goal.x,point.y-goal.y)>goal.radius+run.player.radius;
    const obstacles=avoidFinish?[...run.walls,{x:goal.x-goal.radius,y:goal.y-goal.radius,w:goal.radius*2,h:goal.radius*2}]:run.walls;
    return findPath(run.player,point,obstacles);
  }
  function setDestination(event){pointerPoint=worldPoint(event);path=pathToDestination(pointerPoint);if(!path.length)announce('Tap a clear patch of ground.');}
  on(canvas,'pointerdown',event=>{if(paused||run.finished||event.button>0)return;event.preventDefault();pointerHeld=true;focusCanvas();canvas.setPointerCapture?.(event.pointerId);setDestination(event);});
  on(canvas,'pointermove',event=>{if(pointerHeld&&!paused&&!run.finished)setDestination(event);});
  on(canvas,'pointerup',()=>{pointerHeld=false;});on(canvas,'pointercancel',()=>{pointerHeld=false;});
  on(window,'keydown',event=>{
    if(!container.contains(document.activeElement))return;
    if(event.key==='Escape'){event.preventDefault();paused?resume():pause();return;}
    if(paused||run.finished||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
    const key=event.key.length===1?event.key.toLowerCase():event.key;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d',' '].includes(key)){
      event.preventDefault();if(key===' '){if(!event.repeat)dashQueued=true;}else keys.add(key);
    }
  });
  on(window,'keyup',event=>{keys.delete(event.key.length===1?event.key.toLowerCase():event.key);});
  for(const button of container.querySelectorAll('[data-play-move]')){
    on(button,'pointerdown',event=>{if(paused||run.finished)return;event.preventDefault();button.setPointerCapture?.(event.pointerId);held.set(event.pointerId,button.dataset.playMove);button.classList.add('is-held');});
    const release=event=>{held.delete(event.pointerId);button.classList.remove('is-held');};on(button,'pointerup',release);on(button,'pointercancel',release);on(button,'lostpointercapture',release);
    // Enter/Space on a focused direction button is also a usable movement input.
    on(button,'keydown',event=>{if((event.key==='Enter'||event.key===' ')&&!paused&&!run.finished){event.preventDefault();event.stopPropagation();held.set(`key-${button.dataset.playMove}`,button.dataset.playMove);}});
    on(button,'keyup',()=>held.delete(`key-${button.dataset.playMove}`));on(button,'blur',()=>held.delete(`key-${button.dataset.playMove}`));
  }
  on(container,'click',event=>{
    const action=event.target.closest('[data-play-action]')?.dataset.playAction;if(!action)return;
    if(action==='pause')paused?resume():pause();if(action==='resume')resume();if(action==='exit'){clearInput();options.onExit?.();}
    if(action==='home')options.onHome?.();if(action==='replay')replay();if(action==='dash'&&!paused&&!run.finished){dashQueued=true;focusCanvas();}
    if(action==='retry-save'&&run.finished){setSaveStatus('pending');try{const pending=options.onRetrySave?.({...run.result});if(pending?.catch)pending.catch(error=>setSaveStatus('error',error.message));}catch(error){setSaveStatus('error',error.message);}}
  });
  on(window,'blur',()=>pause());on(document,'visibilitychange',()=>{if(document.hidden)pause();});
  on(window,'resize',resize);
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;observer?.observe(viewport);

  function drawGoal(time){
    const {x,y,radius,open}=run.goal,pulse=reduced.matches?0:Math.sin(time*3)*2;
    ellipse(ctx,x,y+8,radius+15,radius*.55+8,'#2f49363b');
    ctx.beginPath();ctx.moveTo(x-38,y+8);ctx.bezierCurveTo(x-49,y-65,x+46,y-72,x+38,y+8);ctx.strokeStyle=open?'#e8cf88':'#6b7750';ctx.lineWidth=7;ctx.stroke();
    ctx.beginPath();ctx.moveTo(x-38,y+8);ctx.bezierCurveTo(x-49,y-65,x+46,y-72,x+38,y+8);ctx.strokeStyle=open?'#fff0b2':'#abb582';ctx.lineWidth=2;ctx.stroke();
    for(let i=0;i<7;i++){const angle=Math.PI+i*Math.PI/6,xx=x+Math.cos(angle)*37,yy=y-5+Math.sin(angle)*43;leaf(ctx,xx,yy,10,angle+.3,open?'#dce6a3':'#74865b');if(open)ellipse(ctx,xx,yy,2.5,2.5,'#fff5b6');}
    ctx.beginPath();ctx.ellipse(x,y,radius+7+pulse,radius*.68+5+pulse,0,0,TAU);ctx.fillStyle=open?'#f7dc7947':'#f4e2ae26';ctx.fill();ctx.strokeStyle=open?'#f9e6a3':'#c4cca477';ctx.lineWidth=open?3:1.5;ctx.setLineDash(open?[]:[4,7]);ctx.stroke();ctx.setLineDash([]);
    if(neighbourImage.complete&&neighbourImage.naturalWidth)ctx.drawImage(neighbourImage,x-48,y-72,96,78);
    roundRect(ctx,x-40,y+24,80,23,11,open?'#fff1c4':'#e0e5c9');ctx.fillStyle='#354735';ctx.font='600 11px "DM Sans",sans-serif';ctx.textAlign='center';ctx.fillText(open?`${neighbourName} · finish`:neighbourName,x,y+39);
  }
  function drawPlayer(time,moving){
    const p=run.player,bounce=reduced.matches?0:(moving?Math.sin(time*17)*2:Math.sin(time*2)*.7),dash=p.dashTime>0;
    ellipse(ctx,p.x,p.y+12,dash?27:23,8,dash?'#eaf3bc4d':'#29453243');
    if(dash&&!reduced.matches){ctx.strokeStyle='#f2efbca8';ctx.lineWidth=3;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(p.x+(p.facing==='left'?29:-29),p.y-9+i*9);ctx.lineTo(p.x+(p.facing==='left'?45:-45),p.y-9+i*9);ctx.stroke();}}
    ctx.save();ctx.translate(p.x,p.y+bounce);if(p.facing==='right')ctx.scale(-1,1);if(dash)ctx.scale(1.11,.91);
    if(playerImage.complete&&playerImage.naturalWidth)ctx.drawImage(playerImage,-47,-49,92,75);
    else{ellipse(ctx,0,-3,21,16,'#acc9b4');ellipse(ctx,-10,-11,11,11,'#c9dec3');ellipse(ctx,-13,-13,2,2,'#293f36');}
    ctx.restore();
    if(p.slowTime>0){ctx.fillStyle='#fff2c6';ctx.font='700 11px "DM Sans",sans-serif';ctx.textAlign='center';ctx.fillText('Dash!',p.x,p.y-40);}
  }
  function drawParticles(){
    if(reduced.matches)return;
    for(const effect of run.effects||[]){
      const life=clamp(effect.life,0,1),travel=(1-life)*30;
      ctx.globalAlpha=life;
      if(effect.type==='seed'||effect.type==='secret'||effect.type==='finish'){
        for(let i=0;i<6;i++){const a=i*TAU/6+(effect.id||0);ellipse(ctx,effect.x+Math.cos(a)*travel,effect.y+Math.sin(a)*travel-12*(1-life),2.5*life+1,2.5*life+1,effect.type==='secret'?'#dbefc0':'#ffe4a0');}
        if(effect.type!=='finish'){ctx.textAlign='center';ctx.font='750 16px "DM Sans",sans-serif';ctx.lineWidth=3;ctx.strokeStyle='#476a4d';ctx.fillStyle='#fff4bd';const label=effect.type==='seed'?'+1':'Secret!';ctx.strokeText(label,effect.x,effect.y-16-travel);ctx.fillText(label,effect.x,effect.y-16-travel);}
      }else if(effect.type==='bump'){
        ctx.beginPath();ctx.arc(effect.x,effect.y,15+travel*.65,0,TAU);ctx.strokeStyle='#efd1a5';ctx.lineWidth=2;ctx.stroke();
      }ctx.globalAlpha=1;
    }
  }
  function drawCompass(){
    if(camera.w>=WORLD_WIDTH-1&&camera.h>=WORLD_HEIGHT-1)return;
    const point=run.goal.open?run.goal:[...run.seeds].filter(seed=>!seed.collected).sort((a,b)=>Math.hypot(a.x-run.player.x,a.y-run.player.y)-Math.hypot(b.x-run.player.x,b.y-run.player.y))[0];
    if(!point)return;
    const left=camera.x-camera.w/2,right=camera.x+camera.w/2,top=camera.y-camera.h/2,bottom=camera.y+camera.h/2;
    if(point.x>left+26&&point.x<right-26&&point.y>top+55&&point.y<bottom-26)return;
    const x=clamp(point.x,left+25,right-25),y=clamp(point.y,top+62,bottom-27),angle=Math.atan2(point.y-y,point.x-x);
    ellipse(ctx,x,y,18,18,'#fff0ba');ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-4,-5);ctx.lineTo(-4,5);ctx.closePath();ctx.fillStyle='#536749';ctx.fill();ctx.restore();
  }
  function drawMinimap(){
    if(camera.w>=WORLD_WIDTH-1&&camera.h>=WORLD_HEIGHT-1)return;
    const w=102,h=68;
    ctx.save();ctx.setTransform(canvas.width/viewport.clientWidth,0,0,canvas.height/viewport.clientHeight,0,0);
    const xx=viewport.clientWidth-w-12,yy=viewport.clientHeight-h-12;
    roundRect(ctx,xx,yy,w,h,6,'#f4edd5df');ctx.save();ctx.translate(xx+3,yy+3);ctx.scale((w-6)/WORLD_WIDTH,(h-6)/WORLD_HEIGHT);
    ctx.fillStyle='#879a76';ctx.fillRect(0,0,WORLD_WIDTH,WORLD_HEIGHT);for(const wall of run.walls){ctx.fillStyle=wall.kind==='water'?'#afccc1':'#53664d';ctx.fillRect(wall.x,wall.y,wall.w,wall.h);}
    for(const seed of run.seeds)if(!seed.collected)ellipse(ctx,seed.x,seed.y,12,12,'#ffed9d');
    ellipse(ctx,run.goal.x,run.goal.y,20,20,run.goal.open?'#ffe190':'#d3dabb');ellipse(ctx,run.player.x,run.player.y,21,21,'#fffcdf');ellipse(ctx,run.player.x,run.player.y,10,10,'#354f3c');
    ctx.restore();ctx.restore();
  }
  function draw(time,moving){
    const targetX=clamp(run.player.x,camera.w/2,WORLD_WIDTH-camera.w/2),targetY=clamp(run.player.y,camera.h/2,WORLD_HEIGHT-camera.h/2);
    camera.x=reduced.matches?targetX:camera.x+(targetX-camera.x)*.12;camera.y=reduced.matches?targetY:camera.y+(targetY-camera.y)*.12;
    ctx.setTransform(canvas.width/camera.w,0,0,canvas.height/camera.h,(camera.w/2-camera.x)*canvas.width/camera.w,(camera.h/2-camera.y)*canvas.height/camera.h);
    ctx.drawImage(ground,0,0);
    if(path.length){ctx.strokeStyle='#fff4c878';ctx.lineWidth=2;ctx.setLineDash([3,8]);ctx.beginPath();ctx.moveTo(run.player.x,run.player.y);for(const p of path)ctx.lineTo(p.x,p.y);ctx.stroke();ctx.setLineDash([]);const end=path[path.length-1];ctx.beginPath();ctx.arc(end.x,end.y,8,0,TAU);ctx.stroke();}
    for(const hazard of run.hazards)drawHazard(ctx,hazard,time,reduced.matches);
    for(const wall of run.walls)drawWall(ctx,wall,time,reduced.matches);
    for(let i=0;i<run.seeds.length;i++){
      const seed=run.seeds[i];if(seed.collected)continue;const bounce=reduced.matches?0:Math.sin(time*3+i)*2;
      ellipse(ctx,seed.x,seed.y+4,15,7,'#4353362c');ellipse(ctx,seed.x,seed.y,18,18,'#ffe9a424');seedShape(ctx,seed.x,seed.y-3+bounce);
    }
    if(run.secret&&!run.secret.collected){
      const {x,y}=run.secret;const glow=reduced.matches?.15:.13+Math.sin(time*2)*.05;
      ellipse(ctx,x,y,23,23,`rgba(247,240,183,${glow})`);ctx.save();ctx.translate(x,y);ctx.rotate(-.2);
      ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(5,-5);ctx.lineTo(13,0);ctx.lineTo(5,5);ctx.lineTo(0,13);ctx.lineTo(-5,5);ctx.lineTo(-13,0);ctx.lineTo(-5,-5);ctx.closePath();ctx.fillStyle='#e8edc6';ctx.fill();ctx.strokeStyle='#6d8970';ctx.lineWidth=2;ctx.stroke();ellipse(ctx,0,0,3,3,'#91ad8c');ctx.restore();
    }
    drawGoal(time);drawPlayer(time,moving);drawParticles();drawCompass();drawMinimap();
    ctx.setTransform(1,0,0,1,0,0);
  }
  function updateHud(){
    const seconds=Math.floor(run.elapsed);if(seconds!==hudTime){hudTime=seconds;timeEl.textContent=clock(run.elapsed);}
    if(run.collected!==lastCollected){lastCollected=run.collected;seedsEl.textContent=`${run.collected} / ${run.seeds.length}`;if(run.goal.open){if(run.collected===5&&path.length)path=pathToDestination(path[path.length-1]);objectiveEl.textContent=`Finish with ${neighbourName}, or find all 8 seeds.`;announce(run.collected===5?`The finish is open. Find ${neighbourName}!`:`${run.collected} of 8 glowseeds.`);}else announce(`${run.collected} of ${run.seeds.length} seeds.`);}
    if(run.secret?.collected&&!secretEl.classList.contains('is-found')){secretEl.innerHTML='<span aria-hidden="true">✦</span> Secret found';secretEl.classList.add('is-found');announce('A hidden keepsake!');}
    const cooldown=Math.max(0,run.player.cooldown||0);dashMeter.style.width=`${clamp((1-cooldown/1.2)*100,0,100)}%`;
    const dashButton=container.querySelector('[data-play-action="dash"]');dashButton.dataset.ready=cooldown<=0?'true':'false';dashButton.querySelector('strong').textContent=cooldown<=0?'Dash':'Charging';
    for(const effect of run.effects||[]){if(effect.id>lastSoundEffect){lastSoundEffect=effect.id;try{options.onSound?.(effect.type);}catch{/* Optional audio never blocks play. */}}}
  }
  function tick(timestamp){
    if(destroyed)return;const dt=previousTime?Math.min((timestamp-previousTime)/1000,.05):0;previousTime=timestamp;
    let moving=false;
    if(!paused&&!run.finished){const controls=input();moving=Boolean(controls.x||controls.y);stepRun(run,controls,dt);updateHud();if(noticeTime>0){noticeTime-=dt;if(noticeTime<=0)noticeEl.textContent='';}if(run.finished)complete();}
    draw(run.elapsed,moving);if(!paused&&!run.finished)frame=requestAnimationFrame(tick);
  }
  function getSnapshot(){return JSON.parse(JSON.stringify({level:metadata.id,player:run.player,seeds:run.seeds,walls:run.walls,hazards:run.hazards,goal:run.goal,secret:run.secret,collected:run.collected,elapsed:run.elapsed,paused,finished:run.finished,result:run.result,camera,assist:Boolean(options.assist)}));}
  // A read-only snapshot helps diagnose input and accessibility issues. It cannot
  // move the creature, finish a run, or grant a reward.
  Object.defineProperty(canvas,'hedgeSnapshot',{get:getSnapshot,configurable:true});
  function destroy(){if(destroyed)return;destroyed=true;cancelAnimationFrame(frame);observer?.disconnect();listenerRemovers.forEach(remove=>remove());clearInput();playerImage.onload=null;neighbourImage.onload=null;delete canvas.hedgeSnapshot;container.replaceChildren();}
  resize();focusCanvas();frame=requestAnimationFrame(tick);
  return{destroy,pause,resume,setSaveStatus,getSnapshot};
}
