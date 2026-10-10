import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const NOW=Date.parse('2026-10-10T12:00:00Z');
const SAVE='petrealm.save.v1',GEN='petrealm.world-generation.v1',LOCK='petrealm:world-save-v1';
const hash=value=>createHash('sha256').update(value).digest('hex');

/** Native two-tab persistence/action regressions. No operator profile or real world. */
export async function smokeAppBoundary({browser,expect,url,output,mode='fixed',suite='all'}) {
  assert(['fixed','baseline'].includes(mode));await mkdir(output,{recursive:true});const results=[];
  assert(['all','extra'].includes(suite));
  async function setup({oneFriend=false,outfit=false,battle=false}={}){
    const context=await browser.newContext({viewport:{width:1440,height:960},locale:'en-GB',acceptDownloads:true,serviceWorkers:'block'});
    await context.addInitScript(now=>{
      Date.now=()=>now;window.__qaStorageEvents=[];window.addEventListener('storage',e=>window.__qaStorageEvents.push({key:e.key}));
      // Deliver the actual app interval callback deterministically; never mock its save logic.
      const native=window.setInterval;window.__qaMinuteCallbacks=[];window.setInterval=(fn,ms,...args)=>{if(ms===60000)window.__qaMinuteCallbacks.push(()=>fn(...args));return native(fn,ms,...args);};
    },NOW);
    const peer=await context.newPage();await peer.goto(new URL('public/art/acorn.svg',url).href,{waitUntil:'networkidle'});
    const seed=await peer.evaluate(async({url,now,SAVE,GEN,oneFriend,outfit,battle})=>{
      const m=await import(new URL('src/model.js',url).href);let s=m.createState(now);s=m.adopt(s,'Fern','mossling',now,'curious');if(!oneFriend)s=m.adopt(s,'Cinder','emberkit',now,'spirited');s=m.selectPet(s,'pet-1',now);
      if(outfit)s=m.purchase(s,'leafcap',now);if(battle)s=m.startBattle(s,'ashgrub',now);
      const raw=m.serialiseSave(s);localStorage.setItem(SAVE,raw);localStorage.setItem(GEN,'fiction-world-a');return{raw,actor:s.activePetId};
    },{url,now:NOW,SAVE,GEN,oneFriend,outfit,battle});
    const app=await context.newPage();await app.goto(url,{waitUntil:'networkidle'});await expect(app.locator('#companion-name')).toHaveText('Fern');
    return{context,peer,app,seed};
  }
  async function capture(page,label){const path=join(output,`${label}.png`);await page.screenshot({path,animations:'disabled',fullPage:false});return{path,sha256:hash(await readFile(path))};}
  async function perform(name,action,options){const h=await setup(options);try{const before=await capture(h.app,`${name}-before`);const detail=await action(h);const after=await capture(h.app,`${name}-after`);const result={name,...detail,screenshots:[before,after]};results.push(result);await writeFile(join(output,'boundary-in-progress.json'),JSON.stringify({mode,results},null,2)+'\n');if(mode==='fixed')expect(detail.fixedBehaviour,JSON.stringify(result)).toBe(true);}finally{await h.context.close();}}
  async function hold(peer){await peer.evaluate(LOCK=>{let release;const gate=new Promise(resolve=>{release=resolve;});window.__qaRelease=release;window.__qaHeld=false;window.__qaHolding=navigator.locks.request(LOCK,async()=>{window.__qaHeld=true;await gate;});},LOCK);await expect.poll(()=>peer.evaluate(()=>window.__qaHeld)).toBe(true);}
  async function queued(peer){await expect.poll(()=>peer.evaluate(async LOCK=>(await navigator.locks.query()).pending.filter(l=>l.name===LOCK).length,LOCK)).toBeGreaterThan(0);}
  async function release(peer){await peer.evaluate(async()=>{window.__qaRelease();await window.__qaHolding;});await expect.poll(()=>peer.evaluate(async LOCK=>(await navigator.locks.query()).pending.filter(l=>l.name===LOCK).length,LOCK)).toBe(0);await peer.waitForTimeout(100);}

  if(suite!=='extra') {
  for(const kind of ['remove-save-key','clear-all-storage'])await perform(kind,async({app,peer,seed})=>{
    await peer.evaluate(({SAVE,kind})=>kind==='clear-all-storage'?localStorage.clear():localStorage.removeItem(SAVE),{SAVE,kind});
    await expect.poll(()=>app.evaluate(({kind,SAVE})=>window.__qaStorageEvents.some(e=>e.key===(kind==='clear-all-storage'?null:SAVE)),{kind,SAVE})).toBe(true);
    const beforeTick=await peer.evaluate(SAVE=>localStorage.getItem(SAVE),SAVE);assert.equal(beforeTick,null);
    await app.evaluate(async()=>{for(const deliver of window.__qaMinuteCallbacks)await deliver();});
    const afterTick=await peer.evaluate(SAVE=>localStorage.getItem(SAVE),SAVE);
    return{fixedBehaviour:afterTick===null,eventKey:kind==='clear-all-storage'?null:SAVE,delivery:'Actual registered60000ms app callback at fixed Date.now',keyAbsentBeforeTick:true,resurrected:afterTick!==null,resurrectedRaw:afterTick,seedSha256:hash(seed.raw),toast:await app.locator('#toast').innerText(),saveLocation:await app.locator('#save-location').innerText()};
  });
  await perform('stale-care-after-peer-selects-friend',async({app,peer})=>{
    await hold(peer);await app.locator('#feed-berry').click();await queued(peer);
    const selected=await peer.evaluate(async({url,now,SAVE})=>{const m=await import(new URL('src/model.js',url).href);const s=m.selectPet(m.parseSave(localStorage.getItem(SAVE)),'pet-2',now),raw=m.serialiseSave(s);localStorage.setItem(SAVE,raw);return raw;},{url,now:NOW,SAVE});
    await release(peer);const final=await peer.evaluate(SAVE=>localStorage.getItem(SAVE),SAVE);const before=JSON.parse(selected),after=JSON.parse(final);
    return{fixedBehaviour:final===selected,clickedFriend:'Fern /pet-1',peerSelectedFriend:'Cinder /pet-2',inventoryBefore:before.inventory,inventoryAfter:after.inventory,pets:after.pets.map(p=>({id:p.id,name:p.name,journey:p.journey})),expectedSha256:hash(selected),actualSha256:hash(final),toast:await app.locator('#toast').innerText()};
  });
  await perform('stale-deposit-after-peer-replaces-world',async({app,peer})=>{
    await app.locator('.nav-button[data-area="market"]').click();await app.locator('#bank-amount').fill('25');await hold(peer);await app.locator('#bank-deposit').click();await queued(peer);
    const replaced=await peer.evaluate(async({url,now,SAVE,GEN})=>{const m=await import(new URL('src/model.js',url).href);let s=m.createState(now);s=m.adopt(s,'Nova','thistlehorn',now,'gentle');const raw=m.serialiseSave(s);localStorage.setItem(SAVE,raw);localStorage.setItem(GEN,'fiction-world-b');return raw;},{url,now:NOW,SAVE,GEN});
    await release(peer);const final=await peer.evaluate(SAVE=>localStorage.getItem(SAVE),SAVE),before=JSON.parse(replaced),after=JSON.parse(final);
    return{fixedBehaviour:final===replaced,staleAmount:25,replacementFriend:'Nova',walletBefore:before.wallet,walletAfter:after.wallet,bankBefore:before.bank,bankAfter:after.bank,expectedSha256:hash(replaced),actualSha256:hash(final),toast:await app.locator('#toast').innerText()};
  });
  for(const action of [
    {name:'outfit',area:'garden',selector:'[data-equip="leafcap"]',disclosure:'#wardrobe',options:{outfit:true}},
    {name:'quest',area:'realm',selector:'[data-claim-quest="growing-family"]'},
    {name:'battle-start',area:'arena',selector:'[data-battle-start="ashgrub"]'},
  ]) await perform(`stale-${action.name}-after-peer-selects-friend`,async({app,peer})=>{
    await app.locator(`.nav-button[data-area="${action.area}"]`).click();
    const target=app.locator(action.selector),disclosure=await target.evaluate(node=>node.closest('details')?.id);
    if(disclosure&&!await app.locator(`#${disclosure}`).evaluate(node=>node.open))await app.locator(`#${disclosure}>summary`).click();
    await expect(target).toBeEnabled();await hold(peer);await target.click();await queued(peer);
    const selected=await peer.evaluate(async({url,now,SAVE})=>{const m=await import(new URL('src/model.js',url).href),raw=m.serialiseSave(m.selectPet(m.parseSave(localStorage.getItem(SAVE)),'pet-2',now));localStorage.setItem(SAVE,raw);return raw;},{url,now:NOW,SAVE});
    await release(peer);const final=await peer.evaluate(SAVE=>localStorage.getItem(SAVE),SAVE);
    return{fixedBehaviour:final===selected,clickedFriend:'Fern /pet-1',peerSelectedFriend:'Cinder /pet-2',selector:action.selector,expectedSha256:hash(selected),actualSha256:hash(final),finalRaw:final,toast:await app.locator('#toast').innerText()};
  },action.options);
  await perform('duplicate-arena-turn-queued-behind-lock',async({app,peer,seed})=>{
    await app.locator('.nav-button[data-area="arena"]').click();await hold(peer);
    await app.locator('[data-battle-action="attack"]').evaluate(button=>{button.click();button.click();});
    await queued(peer);const pendingBeforeRelease=await peer.evaluate(async LOCK=>(await navigator.locks.query()).pending.filter(l=>l.name===LOCK).length,LOCK);await release(peer);
    const expected=await peer.evaluate(async({url,now,raw})=>{const m=await import(new URL('src/model.js',url).href);return m.serialiseSave(m.battleAction(m.parseSave(raw),'attack',now));},{url,now:NOW,raw:seed.raw}),final=await peer.evaluate(SAVE=>localStorage.getItem(SAVE),SAVE);
    return{fixedBehaviour:final===expected,clickIntents:2,pendingBeforeRelease,expectedTurn:1,actualTurn:JSON.parse(final).battle.turn,expectedSha256:hash(expected),actualSha256:hash(final),finalRaw:final,toast:await app.locator('#toast').innerText()};
  },{battle:true});
  }
  await perform('duplicate-adoption-queued-behind-lock',async({app,peer})=>{
    const friends=app.locator('#friends');if(await friends.count()&&!await friends.evaluate(node=>node.open))await friends.locator('summary').click();
    await app.locator('#adopt-another').click();await app.locator('#pet-name').fill('Sprout');await hold(peer);
    await app.locator('#adoption-form').evaluate(form=>{form.requestSubmit();form.requestSubmit();});
    await queued(peer);const pendingBeforeRelease=await peer.evaluate(async LOCK=>(await navigator.locks.query()).pending.filter(l=>l.name===LOCK).length,LOCK);
    await release(peer);const raw=await peer.evaluate(SAVE=>localStorage.getItem(SAVE),SAVE),world=JSON.parse(raw);
    return{fixedBehaviour:world.pets.length===2&&world.pets.filter(p=>p.name==='Sprout').length===1,initialFriends:1,submissions:2,pendingBeforeRelease,finalFriends:world.pets.map(p=>({id:p.id,name:p.name})),raw,adoptionError:await app.locator('#adoption-error').innerText()};
  },{oneFriend:true});
  await perform('latest-import-wins-delayed-earlier-file',async({app,peer})=>{
    const files=await peer.evaluate(async({url,now})=>{const m=await import(new URL('src/model.js',url).href);return ['Earlier Rowan','Latest Hazel'].map(name=>m.serialiseSave(m.adopt(m.createState(now),name,'mossling',now,'curious')));},{url,now:NOW});
    await app.evaluate(()=>{const original=File.prototype.text;window.__qaFirstReadStarted=false;File.prototype.text=function(){if(this.name==='earlier.json'){window.__qaFirstReadStarted=true;return new Promise(resolve=>{window.__qaReleaseFirstFile=async()=>resolve(await original.call(this));});}return original.call(this);};});
    await app.locator('#save-button').click();await app.locator('#import-save').setInputFiles({name:'earlier.json',mimeType:'application/json',buffer:Buffer.from(files[0])});
    await expect.poll(()=>app.evaluate(()=>window.__qaFirstReadStarted)).toBe(true);
    await app.locator('#import-save').setInputFiles({name:'latest.json',mimeType:'application/json',buffer:Buffer.from(files[1])});await expect(app.locator('#companion-name')).toHaveText('Latest Hazel');
    const afterLatest=await peer.evaluate(SAVE=>localStorage.getItem(SAVE),SAVE);await capture(app,'latest-import-wins-latest-applied');await app.evaluate(async()=>window.__qaReleaseFirstFile());await app.waitForTimeout(150);
    const final=await peer.evaluate(SAVE=>localStorage.getItem(SAVE),SAVE),name=await app.locator('#companion-name').innerText();
    return{fixedBehaviour:final===afterLatest&&name==='Latest Hazel',firstRead:'Native File.text delayed before model parsing; later file is actual native chooser selection',afterLatestSha256:hash(afterLatest),finalSha256:hash(final),finalFriend:name,finalRaw:final};
  });
  const receipt={mode,suite,desiredFixedBehaviour:mode==='fixed',allFixed:results.every(r=>r.fixedBehaviour),reproducedBugs:results.filter(r=>!r.fixedBehaviour).length,results};await writeFile(join(output,'app-boundary-receipt.json'),JSON.stringify(receipt,null,2)+'\n');return receipt;
}
