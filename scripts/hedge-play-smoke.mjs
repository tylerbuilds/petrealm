import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const SAVE = 'under-the-hedge.save.v1';
const NOW = Date.parse('2026-10-10T21:00:00Z');
const GRID = 20;

// This planner only reads the rendered run. All progress is made by browser key events.
function pathTo(run, target) {
  const radius = run.player.radius + 10;
  const blocked = (x,y) => x < 20 || y < 20 || x > 940 || y > 620 || run.walls.some(w => x > w.x-radius && x < w.x+w.w+radius && y > w.y-radius && y < w.y+w.h+radius);
  const key = (x,y) => `${x},${y}`;
  const snap = p => ({x:Math.round(p.x/GRID)*GRID,y:Math.round(p.y/GRID)*GRID});
  const start=snap(run.player), goal=snap(target), queue=[start], previous=new Map([[key(start.x,start.y),null]]);
  let reached=null;
  for (let head=0;head<queue.length;head++) {
    const point=queue[head];
    if (Math.hypot(point.x-goal.x,point.y-goal.y)<1) { reached=point; break; }
    for (const [dx,dy] of [[GRID,0],[-GRID,0],[0,GRID],[0,-GRID]]) {
      const x=point.x+dx,y=point.y+dy,id=key(x,y);
      if (!previous.has(id) && !blocked(x,y)) { previous.set(id,point); queue.push({x,y}); }
    }
  }
  if (!reached) throw new Error(`No safe input route from ${JSON.stringify(start)} to ${JSON.stringify(goal)}`);
  const points=[];
  while(reached) { points.unshift(reached); reached=previous.get(key(reached.x,reached.y)); }
  return points.filter((point,index) => !index || index===points.length-1 ||
    Math.sign(point.x-points[index-1].x)!==Math.sign(points[index+1].x-point.x) ||
    Math.sign(point.y-points[index-1].y)!==Math.sign(points[index+1].y-point.y));
}

/** Direct-control acceptance: no result injection, position writes or test win API. */
export async function smokeHedgePlay({browser,expect,output,url}) {
  await mkdir(output,{recursive:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000},locale:'en-GB',hasTouch:true});
  const page=await context.newPage(), errors=[],external=[],mobile=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  page.on('request',request=>{if(/^https?:/.test(request.url()) && new URL(request.url()).origin!==new URL(url).origin)external.push(request.url());});
  await page.clock.install({time:NOW});
  await context.addInitScript(()=>{
    const raf=window.requestAnimationFrame.bind(window),cancel=window.cancelAnimationFrame.bind(window);
    window.__hedgeFrameStats={requested:0,fired:0,cancelled:0,active:new Set()};
    window.requestAnimationFrame=callback=>{const stats=window.__hedgeFrameStats;let id;id=raf(time=>{stats.active.delete(id);stats.fired++;callback(time);});stats.requested++;stats.active.add(id);return id;};
    window.cancelAnimationFrame=id=>{window.__hedgeFrameStats.cancelled++;window.__hedgeFrameStats.active.delete(id);cancel(id);};
  });
  const state=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key))?.state,SAVE);
  const snapshot=()=>page.locator('#hedge-game-canvas').evaluate(canvas=>canvas.hedgeSnapshot);
  const run=async()=>{const value=await snapshot();return value.run || value;};
  const advance=ms=>page.clock.runFor(ms);
  const capture=async name=>{await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:resolve(output,`${name}.png`),fullPage:true,animations:'disabled'});};
  const hold=async(key,ms)=>{await page.keyboard.down(key);await advance(ms);await page.keyboard.up(key);};
  const resolveTiming=async({touch=false}={})=>{
    let challenge=(await run()).challenge;
    if (!challenge) return;
    for(let frame=0;frame<600;frame++) {
      const current=await run(); challenge=current.challenge;
      if (!challenge || current.finished || current.failed) return;
      if (challenge.status==='active') {
        const middle=(challenge.targetStart+challenge.targetEnd)/2;
        if (Math.abs(challenge.position-middle)<(challenge.targetEnd-challenge.targetStart)*.08) {
          if (touch) {
            await page.locator('[data-play-action="stop"]').tap();
          } else await page.keyboard.down('Space');
          await advance(16);
          if (!touch) await page.keyboard.up('Space');
          expect((await run()).challenge?.status).toMatch(/hit|perfect/);
        }
      }
      await advance(16);
    }
    throw new Error('Timing gate did not resolve through player input');
  };
  const walkTo=async(target,{resolveChallenges=true}={})=>{
    for(const point of pathTo(await run(),target)) {
      for(let attempt=0;attempt<150;attempt++) {
        let current=await run(); if(current.finished || current.failed)return;
        if (current.challenge) {
          if (!resolveChallenges) return;
          await resolveTiming(); current=await run();
        }
        const dx=point.x-current.player.x,dy=point.y-current.player.y;
        if(Math.hypot(dx,dy)<7)break;
        const horizontal=Math.abs(dx)>Math.abs(dy),distance=Math.abs(horizontal?dx:dy);
        const key=horizontal?(dx>0?'ArrowRight':'ArrowLeft'):(dy>0?'ArrowDown':'ArrowUp');
        await hold(key,Math.max(16,Math.min(150,Math.floor(distance/138*1000))));
        if(attempt===149)throw new Error(`Input steering stuck at ${JSON.stringify((await run()).player)} approaching ${JSON.stringify(point)}`);
      }
    }
  };
  try {
    await page.goto(url,{waitUntil:'networkidle'});
    await page.locator('#hedge-name').fill('Pip');
    await page.locator('#hedge-welcome-form button[type="submit"]').click();
    const canvas=page.locator('#hedge-game-canvas');
    await expect(canvas).toBeVisible();
    await advance(32); await canvas.focus();
    const initial=await run();
    await hold('ArrowLeft',150);
    const moved=await run(), walkDistance=initial.player.x-moved.player.x;
    expect(walkDistance).toBeGreaterThan(15);
    await page.keyboard.down('ArrowRight'); await page.keyboard.down('Space');
    await advance(120); await page.keyboard.up('Space'); await page.keyboard.up('ArrowRight');
    const dashed=await run(),dashDistance=dashed.player.x-moved.player.x;
    expect(dashDistance).toBeGreaterThan(walkDistance*1.4);
    expect(dashed.player.cooldown).toBeGreaterThan(0);
    await capture('play-desktop');

    const resume=async()=>{await page.locator('[data-play-action="resume"]').click();await advance(32);};
    const assertPaused=async reason=>{
      const before=await run(); expect(before.paused,reason).toBe(true);
      await advance(1200);
      const after=await run(); expect(after.elapsed,reason).toBe(before.elapsed); expect(after.player,reason).toEqual(before.player);
      expect(await page.evaluate(()=>window.__hedgeFrameStats.active.size),`${reason}: paused rendering stops`).toBe(0);
    };
    await page.locator('[data-play-action="pause"]').click(); await assertPaused('Pause button'); await resume();
    await page.keyboard.down('ArrowRight');
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    await assertPaused('Focus-loss handler'); await page.keyboard.up('ArrowRight'); await resume();
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
    await assertPaused('Hidden-document handler');
    await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));}); await resume();

    // CDP sends actual touch contact/release events through the browser's pointer pipeline.
    await page.setViewportSize({width:390,height:844});
    await page.locator('[data-play-move="left"]').scrollIntoViewIfNeeded();
    const touch=await context.newCDPSession(page),box=await page.locator('[data-play-move="left"]').boundingBox();
    expect(await page.locator('[data-play-move="left"]').evaluate(node=>{const r=node.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return node===top||node.contains(top);}), 'Touch direction must not be covered by navigation').toBe(true);
    const beforeTouch=await run();
    await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2,id:1}]});
    await advance(350);
    await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    const afterTouch=await run(); expect(beforeTouch.player.x-afterTouch.player.x).toBeGreaterThan(25);
    await advance(350); const released=await run();
    expect(released.player.x).toBeCloseTo(afterTouch.player.x,5);
    expect(released.player.y).toBeCloseTo(afterTouch.player.y,5);
    await touch.detach();
    for(const width of [390,320]) {
      await page.setViewportSize({width,height:844}); await advance(32);
      const dimensions=await canvas.evaluate(node=>({document:document.documentElement.scrollWidth,width:innerWidth,canvas:node.getBoundingClientRect().toJSON(),camera:node.hedgeSnapshot.camera}));
      expect(dimensions.document,`Play at ${width}px`).toBeLessThanOrEqual(width);
      expect(dimensions.camera.w).toBeLessThan(700);
      mobile.push({width,document:dimensions.document,visibleWorldWidth:dimensions.camera.w,playerDrawWidth:92*dimensions.canvas.width/dimensions.camera.w});
      await capture(`play-${width}`);
    }

    // Ordinary navigation keeps the in-memory trail, while removing its render loop.
    await canvas.evaluate(node=>{window.__hedgeQaCanvas=node;});
    await page.locator('.hedge-nav a[href="#home"]').click();
    await expect(page.locator('.hedge-home-scene')).toBeVisible();
    const detached=await page.evaluate(()=>window.__hedgeQaCanvas.hedgeSnapshot);
    expect(detached.paused).toBe(true);
    const frames=await page.evaluate(()=>window.__hedgeFrameStats.fired);
    await advance(1500);
    expect(await page.evaluate(()=>window.__hedgeFrameStats.active.size)).toBe(0);
    expect(await page.evaluate(()=>window.__hedgeFrameStats.fired)).toBe(frames);
    expect(await page.evaluate(()=>window.__hedgeQaCanvas.hedgeSnapshot.elapsed)).toBe(detached.elapsed);
    await page.locator('.hedge-nav a[href="#play"]').click();
    await expect(canvas).toBeVisible();
    expect(await canvas.evaluate(node=>node===window.__hedgeQaCanvas)).toBe(true);
    expect((await run()).player).toEqual(detached.player);
    await resume(); await page.setViewportSize({width:1440,height:1000}); await canvas.focus();

    // Failure is earned through genuine mistimed presses and a missed deadline.
    const waitForActive=async()=>{
      for(let frame=0;frame<160;frame++) {
        if ((await run()).challenge?.status==='active') return;
        await advance(16);
      }
      throw new Error('Timing gate did not become active');
    };
    await walkTo((await run()).seeds[0],{resolveChallenges:false});
    await waitForActive();
    const initialGate=await run(); expect(initialGate.collected).toBe(0);
    expect(initialGate.challenge.position).toBeLessThan(initialGate.challenge.targetStart);
    await page.keyboard.down('Space'); await advance(16);
    expect((await run()).misses).toBe(1); expect((await run()).collected).toBe(0);
    expect((await run()).challenge.position,'Miss marker stays at the input position').toBe(initialGate.challenge.position);
    await waitForActive(); await advance(1000);
    expect((await run()).misses,'Held Space cannot repeatedly submit a timing attempt').toBe(1);
    expect((await run()).collected,'Held Space cannot automatically collect a seed').toBe(0);
    expect((await run()).challenge.status).toBe('active');
    await page.keyboard.up('Space'); await advance(16);
    await advance(Math.ceil((await run()).challenge.remaining*1000)+32);
    expect((await run()).misses,'Doing nothing misses the deadline').toBe(2);
    expect((await run()).collected).toBe(0);
    await waitForActive();
    await page.keyboard.down('Space'); await advance(16); await page.keyboard.up('Space');
    const failure=await run();
    expect(failure.failed).toBe(true); expect(failure.finished).toBe(true); expect(failure.result).toBeNull();
    expect(failure.misses).toBe(3); expect(failure.collected).toBe(0);
    await expect(page.locator('[data-play-overlay]')).toContainText('Out of chances');
    const failedSave=await state();
    expect(failedSave.play.seeds).toBe(0); expect(failedSave.play.best.broadroot.clears).toBe(0);
    expect(failedSave.play.best.dryfoot.clears).toBe(0); expect(failedSave.play.decorations).toEqual([]);
    expect(failedSave.play.claimed).toEqual([]);
    await capture('timing-failed-no-reward');
    await page.locator('[data-play-action="replay"]').click(); await advance(32);
    await expect.poll(async()=>(await run()).failed).toBe(false); expect((await run()).misses).toBe(0);
    await walkTo((await run()).seeds[0],{resolveChallenges:false}); await waitForActive();
    await page.locator('[data-play-action="pause"]').click();
    const pausedGate=await run(); await assertPaused('Active timing challenge');
    expect((await run()).challenge).toEqual(pausedGate.challenge);
    await resume();
    for (const width of [390,320]) {
      await page.setViewportSize({width,height:844});
      const stop=page.locator('[data-play-action="stop"]');
      await expect(stop).toBeVisible();
      expect(await stop.evaluate(node=>{const r=node.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return r.y>=0&&r.bottom<=innerHeight&&(node===top||node.contains(top));}),`Timing Stop reachable at ${width}px`).toBe(true);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await capture(`timing-challenge-${width}`);
    }
    await page.setViewportSize({width:390,height:844});
    await resolveTiming({touch:true});
    expect((await run()).collected,'Actual touch Stop earns a seed').toBe(1);
    expect((await run()).misses).toBe(0);
    await page.setViewportSize({width:1440,height:1000}); await canvas.focus();

    for(const seed of (await run()).seeds) {
      if(!(await run()).seeds.find(item=>item.id===seed.id).collected) await walkTo(seed);
    }
    expect((await run()).collected).toBe(8);
    await walkTo((await run()).secret); expect((await run()).secret.collected).toBe(true);
    await walkTo((await run()).goal);
    const completed=await run(); expect(completed.finished).toBe(true);
    expect(completed.result.seeds).toBe(8); expect(completed.result.stars).toBeGreaterThanOrEqual(2);
    await expect(page.locator('[data-play-save]')).toHaveAttribute('data-status','saved');
    await expect.poll(async()=>(await state()).play.best.broadroot.clears).toBe(1);
    const rewarded=await state(); expect(rewarded.play.seeds).toBe(8);
    expect(rewarded.play.decorations).toContain('fern-arch'); expect(rewarded.play.equipped.root).toBe('fern-arch');
    await capture('play-earned-result');
    for (const width of [390,320]) {
      await page.setViewportSize({width,height:844});
      await page.locator('[data-play-action="home"]').scrollIntoViewIfNeeded();
      expect(await page.locator('[data-play-action="home"]').evaluate(node=>{const r=node.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return node===top||node.contains(top);}),`Result home action reachable at ${width}px`).toBe(true);
      await capture(`play-result-${width}`);
    }
    await page.setViewportSize({width:1440,height:1000});
    await advance(2000);
    expect((await state()).play.best.broadroot.clears).toBe(1);
    await page.reload({waitUntil:'networkidle'});
    expect((await state()).play).toEqual(rewarded.play);
    await expect(page.locator('[data-action="play-run"][data-level="dryfoot"]').first()).toBeEnabled();
    await expect(page.locator('[data-action="play-run"][data-level="alderwater"]')).toBeDisabled();
    await capture('play-unlocked-trails');
    await page.locator('.hedge-nav a[href="#home"]').click();
    await expect(page.locator('.adventure-home-prop--root')).toHaveAttribute('aria-label','Fern arch');
    await page.locator('#hedge-workshop [data-action="build-decoration"][data-decoration="moss-patch"]').click();
    await expect.poll(async()=>(await state()).play.equipped.root).toBe('moss-patch');
    expect((await state()).play.seeds).toBe(4);
    await expect(page.locator('.adventure-home-prop--root')).toHaveAttribute('aria-label','Moss cushion');
    await capture('home-earned-build');
    await page.reload({waitUntil:'networkidle'});
    expect((await state()).play.equipped.root).toBe('moss-patch');
    expect((await state()).play.best.broadroot.clears).toBe(1);
    const completedLevels=[completed.result];
    for (const level of ['dryfoot','alderwater']) {
      await page.locator('.hedge-nav a[href="#play"]').click();
      await page.locator(`[data-action="play-run"][data-level="${level}"]`).first().click();
      await expect(canvas).toBeVisible(); await canvas.focus(); await advance(32);
      expect((await run()).level).toBe(level);
      for (const seed of (await run()).seeds) {
        if (!(await run()).seeds.find(item=>item.id===seed.id).collected) await walkTo(seed);
      }
      expect((await run()).collected).toBe(8);
      await walkTo((await run()).secret); expect((await run()).secret.collected).toBe(true);
      await walkTo((await run()).goal);
      const finished=await run(); expect(finished.finished).toBe(true);
      expect(finished.result.stars).toBeGreaterThanOrEqual(2); expect(finished.result.stars).toBeLessThanOrEqual(3);
      await expect(page.locator('[data-play-save]')).toHaveAttribute('data-status','saved');
      await expect.poll(async()=>(await state()).play.best[level].clears).toBe(1);
      completedLevels.push(finished.result);
      await capture(`play-${level}-earned-result`);
      const earned=await state();
      expect(earned.play.best[level]).toEqual({clears:1,stars:finished.result.stars,seeds:8,secret:true,timeMs:finished.result.timeMs});
      expect(earned.play.best.broadroot).toEqual(rewarded.play.best.broadroot);
      await page.reload({waitUntil:'networkidle'});
      expect((await state()).play).toEqual(earned.play);
    }
    const finalPlay=(await state()).play;
    expect(finalPlay.seeds).toBe(20);
    expect(finalPlay.decorations).toEqual(expect.arrayContaining(['fern-arch','moss-patch','pebble-stack','glow-petals']));
    expect(finalPlay.equipped).toEqual({root:'moss-patch',riverside:'pebble-stack',canopy:'glow-petals'});
    expect(Object.values(finalPlay.best).map(item=>item.clears)).toEqual([1,1,1]);
    for (const level of ['broadroot','dryfoot','alderwater']) await expect(page.locator(`[data-action="play-run"][data-level="${level}"]`).first()).toBeEnabled();
    await capture('all-three-trails-complete');
    await page.locator('.hedge-nav a[href="#home"]').click();
    await expect(page.locator('.adventure-home-prop--riverside')).toHaveAttribute('aria-label','Skipping stones');
    await expect(page.locator('.adventure-home-prop--canopy')).toHaveAttribute('aria-label','Golden petals');
    await capture('home-all-trail-rewards');
    expect(errors,'Browser errors').toEqual([]); expect(external,'External requests').toEqual([]);
    const receipt={passed:true,inputOnlyCompletion:true,compulsoryTiming:true,clock:'Playwright virtual requestAnimationFrame time; real browser input events',missMarkerFrozenAtInput:true,earlyPressMiss:true,timeoutMiss:true,threeMissFailureNoRewards:true,retryAfterFailure:true,heldSpaceCannotAutoEarn:true,touchStopSuccess:true,timingPauseFreezesMarkerAndDeadline:true,mobileStopReachable:[320,390],keyboardWalkDistance:walkDistance,keyboardDashDistance:dashDistance,touchMovedAndReleased:true,pauseAndFocusLossHandler:true,hiddenDocumentHandlerSimulated:true,navigationPreservedRun:true,offscreenAnimationFramesStopped:true,result:completed.result,clearsAfterReload:1,nextTrailUnlocked:true,homeDecoration:'moss-patch',seedsAfterBuilding:4,completedLevels,finalSeedBank:finalPlay.seeds,persistedPersonalBests:finalPlay.best,errors,external,mobile};
    await writeFile(resolve(output,'hedge-play.json'),`${JSON.stringify(receipt,null,2)}\n`);
    return receipt;
  } finally {await context.close();}
}
