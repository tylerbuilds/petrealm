import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const SAVE = 'under-the-hedge.save.v1';
const LEGACY = 'petrealm.save.v1';
const LOCK = 'under-the-hedge:save-v1';
const NOW = Date.parse('2026-10-10T12:00:00Z');

/** Built-browser acceptance of the authored story and real persistence boundary. */
export async function smokeHedge({ browser, expect, output, url }) {
  await mkdir(output, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, locale: 'en-GB', acceptDownloads: true });
  const errors = [], external = [], mobile = [];
  const observe = page => {
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', request => { if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(url).origin) external.push(request.url()); });
    page.on('dialog', dialog => dialog.accept());
  };
  const page = await context.newPage(); observe(page);
  await page.clock.install({ time: NOW }); await page.clock.setFixedTime(NOW);
  await context.addInitScript(({key, value}) => { if (!localStorage.getItem(key)) localStorage.setItem(key, value); }, { key: LEGACY, value: 'legacy-save-must-remain-byte-for-byte' });
  await context.addInitScript(() => {
    window.__hedgeAudioPlays = 0; window.__hedgeAudioElements = [];
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function(...args) { window.__hedgeAudioPlays++; window.__hedgeAudioElements.push(this); return play.apply(this,args); };
  });
  const envelope = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE);
  const state = async () => (await envelope()).state;
  const action = (name, attrs = '') => page.locator(`[data-action="${name}"]${attrs}`);
  const nav = async route => {
    await page.locator(`a[href="#${route}"]`).first().click();
    await expect(page.locator('#hedge-content')).toBeVisible();
  };
  const capture = async name => { await page.evaluate(()=>window.scrollTo(0,0)); return page.screenshot({ path: resolve(output, `${name}.png`), fullPage: true, animations: 'disabled' }); };
  const download = async (target, filename) => {
    const pending = page.waitForEvent('download'); await page.locator(target).click();
    const item = await pending; expect(await item.failure()).toBeNull();
    const path = resolve(output, filename); await item.saveAs(path);
    return { name: item.suggestedFilename(), path, text: await readFile(path, 'utf8') };
  };
  const openSave = async () => { if (!(await page.locator('#hedge-save-dialog').isVisible())) await page.locator('#hedge-save-button').click(); await expect(page.locator('#hedge-save-dialog')).toBeVisible(); };
  const closeSave = async () => { await page.locator('#hedge-save-close').click(); await expect(page.locator('#hedge-save-dialog')).not.toBeVisible(); };
  const ready = async () => {
    const outing = (await state()).outing;
    await page.clock.setFixedTime(outing.readyAt + 1000); await page.clock.fastForward(1100);
    await expect(action('collect-outing', `[data-id="${outing.id}"]`)).toBeVisible();
    return outing;
  };
  const outing = async (route, condition = 'calm') => {
    await nav('paths'); await page.locator(`input[name="outing-condition"][value="${condition}"]`).check();
    const before = await state(); await action('start-outing', `[data-route="${route}"]`).click();
    await expect.poll(async () => (await state()).outing?.route).toBe(route);
    const trip = await ready(); await action('collect-outing', `[data-id="${trip.id}"]`).click();
    await expect.poll(async () => (await state()).completedOutings).toBe(before.completedOutings + 1);
    expect((await state()).outing).toBeNull(); return state();
  };
  const holdLock = async peer => {
    await peer.evaluate(lock => {
      let release; const gate = new Promise(resolve => { release = resolve; });
      window.__releaseHedgeLock = release; window.__hedgeLockHeld = false;
      window.__hedgeLockTask = navigator.locks.request(lock, async () => { window.__hedgeLockHeld = true; await gate; });
    }, LOCK);
    await expect.poll(() => peer.evaluate(() => window.__hedgeLockHeld)).toBe(true);
  };
  const releaseLock = peer => peer.evaluate(async () => { window.__releaseHedgeLock(); await window.__hedgeLockTask; });
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle' }); expect(response.status()).toBe(200);
    await expect(page.locator('#hedge-welcome-form')).toBeVisible();
    await capture('welcome-desktop');
    for (const width of [390,320]) {
      await page.setViewportSize({width,height:844});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth),`Welcome at ${width}px`).toBeLessThanOrEqual(width);
      await capture(`welcome-${width}`);
    }
    await page.setViewportSize({width:1440,height:960});
    await page.locator('#hedge-name').fill('Fern');
    await page.locator('input[name="colour"][value="clay"]').check();
    await page.locator('input[name="marking"][value="tail"]').check();
    await page.locator('#hedge-welcome-form button[type="submit"]').click();
    await expect(action('surface')).toHaveCount(2);
    expect((await state()).companion).toEqual({name:'Fern', appearance:{colour:'clay',marking:'tail'}});
    await action('surface', '[data-choice="reeds"]').focus();
    await page.keyboard.press('Enter');
    await action('opening', '[data-choice="ask-pell"]').click();
    await action('opening', '[data-choice="waterside"]').click();
    await expect.poll(async () => (await state()).opening.step).toBe('notice');
    await page.reload({ waitUntil: 'networkidle' });
    await expect(action('opening', '[data-choice="water"]')).toBeVisible();
    expect((await state()).opening).toEqual({step:'notice',surface:'reeds',route:'waterside',interest:null});
    await action('opening', '[data-choice="water"]').click();
    await expect(page.locator('.hedge-visitor-seat')).toBeVisible();
    const opening = await state();
    expect(opening.home).toEqual({visitorSeat:true,returningStones:1});
    expect(opening.opening).toEqual({step:'complete',surface:'reeds',route:'waterside',interest:'water'});
    expect(opening.finds[0].disposition).toBe('washing-hollow');
    expect(opening.events.at(-1).text).toContain('waterside');
    await page.reload({ waitUntil:'networkidle' });
    expect(await state()).toEqual(opening);
    await capture('first-home-desktop');

    // The first outing persists through reload, waits 30 seconds, and is claimed once across tabs.
    await nav('paths'); await action('start-outing','[data-route="broadroot"]').click();
    await expect.poll(async () => (await state()).outing?.route).toBe('broadroot');
    const departure = (await state()).outing;
    expect(departure.readyAt - departure.startedAt).toBe(30_000);
    await page.reload({ waitUntil:'networkidle' }); expect((await state()).outing).toEqual(departure);
    await ready();
    const claim = `[data-action="collect-outing"][data-id="${departure.id}"]`;
    const peer = await context.newPage(); observe(peer);
    await peer.clock.install({time:departure.readyAt+1000}); await peer.clock.setFixedTime(departure.readyAt+1000);
    await peer.goto(new URL('#paths',url).href,{waitUntil:'networkidle'});
    await expect(peer.locator(claim)).toBeVisible(); await holdLock(peer);
    await page.locator(claim).click(); await peer.locator(claim).click();
    await expect.poll(() => peer.evaluate(async lock => (await navigator.locks.query()).pending.filter(x=>x.name===lock).length, LOCK)).toBeGreaterThanOrEqual(2);
    await releaseLock(peer);
    await expect.poll(async () => (await state()).completedOutings).toBe(1);
    await expect.poll(() => peer.evaluate(async lock => (await navigator.locks.query()).pending.filter(x=>x.name===lock).length, LOCK)).toBe(0);
    expect((await state()).events.filter(e=>e.type==='return')).toHaveLength(1);
    expect((await state()).home.returningStones).toBe(2); await peer.close();

    await outing('broadroot','rainy');
    expect((await state()).events.at(-1).text).toContain('puts its resonant wood back');
    await outing('dryfoot'); await outing('alderwater'); await outing('alderwater');
    const beforeResolution = await state(); expect(beforeResolution.mystery).toEqual({chapter:2,resolved:false});
    await outing('alderwater','rainy'); expect((await state()).mystery.resolved).toBe(false);
    await outing('alderwater');
    const resolved = await state(); expect(resolved.mystery).toEqual({chapter:3,resolved:true});
    expect(resolved.events.at(-1).text).toContain('still warmth');
    expect(resolved.finds.map(f=>f.kind)).toContain('flower-seed');
    expect(resolved.routeVisits).toEqual({broadroot:2,dryfoot:1,alderwater:4});
    await capture('paths-mystery-resolved-desktop');

    await nav('home');
    const seed = resolved.finds.find(f=>f.kind==='seed-case');
    await page.locator('.hedge-find').filter({hasText:'Curved seed case'}).locator('summary').click();
    await action('place-find',`[data-id="${seed.id}"][data-spot="threshold"]`).click();
    await expect.poll(async () => (await state()).finds.find(f=>f.id===seed.id).disposition).toBe('threshold');
    expect((await state()).events.at(-1).text).toContain('leaving the visitor’s dry bit clear');
    await nav('neighbours');
    for (const neighbour of ['pell','dindle','mallow','ossel']) {
      const count=(await state()).neighbours[neighbour];
      await action('speak',`[data-neighbour="${neighbour}"]`).click();
      await expect.poll(async () => (await state()).neighbours[neighbour]).toBe(count+1);
    }
    expect((await state()).events.at(-1).text).toContain('Better here');
    await capture('neighbours-desktop');
    await nav('journal'); await expect(page.locator('.hedge-journal-pages')).toContainText('still warmth');
    await capture('journal-desktop');

    await openSave();
    const saved = await download('#hedge-export-save','fern-world.json'); const exported = JSON.parse(saved.text);
    expect(exported).toEqual(await state()); expect(exported.format).toBeUndefined();
    const story = await download('#hedge-export-story','fern-story.html');
    const portrait = await download('#hedge-export-portrait','fern-portrait.svg');
    expect(story.text).toContain('Fern'); expect(story.text).toContain('still warmth');
    expect(portrait.text).toMatch(/<svg[^>]+xmlns=/); expect(portrait.text).toContain('Fern');
    await closeSave(); await nav('neighbours'); await action('speak','[data-neighbour="pell"]').click();
    await expect.poll(async () => (await state()).sequence).toBe(exported.sequence+1);
    const beforeImport = await state(), oldGeneration = (await envelope()).generation;
    await openSave(); await page.locator('#hedge-import-save').setInputFiles(saved.path);
    await expect.poll(async () => (await state()).sequence).toBe(exported.sequence);
    expect(await state()).toEqual(exported); expect((await envelope()).generation).not.toBe(oldGeneration);
    await page.locator('#hedge-restore-backup').click();
    await expect.poll(async () => (await state()).sequence).toBe(beforeImport.sequence);
    expect(await state()).toEqual(beforeImport); await closeSave();

    // A queued action captured before import cannot act upon the newly imported generation.
    await nav('neighbours');
    const stalePeer = await context.newPage(); observe(stalePeer);
    await stalePeer.clock.install({time:beforeImport.updatedAt}); await stalePeer.clock.setFixedTime(beforeImport.updatedAt);
    await stalePeer.goto(new URL('#neighbours',url).href,{waitUntil:'networkidle'});
    await holdLock(stalePeer); await openSave();
    await page.locator('#hedge-import-save').setInputFiles(saved.path);
    await expect.poll(() => stalePeer.evaluate(async lock => (await navigator.locks.query()).pending.filter(x=>x.name===lock).length, LOCK)).toBeGreaterThanOrEqual(1);
    await stalePeer.locator('[data-action="speak"][data-neighbour="pell"]').click();
    await expect.poll(() => stalePeer.evaluate(async lock => (await navigator.locks.query()).pending.filter(x=>x.name===lock).length, LOCK)).toBeGreaterThanOrEqual(2);
    await releaseLock(stalePeer);
    await expect.poll(() => stalePeer.evaluate(async lock => (await navigator.locks.query()).pending.filter(x=>x.name===lock).length, LOCK)).toBe(0);
    expect(await state()).toEqual(exported); await stalePeer.close(); await closeSave();

    for (const width of [390,320]) {
      await page.setViewportSize({width,height:844});
      for (const route of ['home','paths','journal','neighbours']) {
        await nav(route);
        const dimensions = await page.evaluate(()=>({width:innerWidth, document:document.documentElement.scrollWidth}));
        expect(dimensions.document, `${route} overflows at ${width}px`).toBeLessThanOrEqual(width);
        await capture(`${route}-${width}`); mobile.push({route,...dimensions});
      }
    }
    await openSave();
    expect(await page.locator('#hedge-save-dialog').evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);
    await capture('save-dialog-320'); await closeSave();
    expect(await page.evaluate(key=>localStorage.getItem(key),LEGACY)).toBe('legacy-save-must-remain-byte-for-byte');
    expect(await page.locator('audio[autoplay]').count()).toBe(0);
    expect(await page.locator('audio').evaluateAll(nodes=>nodes.every(node=>node.paused))).toBe(true);
    expect(await page.evaluate(()=>window.__hedgeAudioPlays)).toBe(0);
    await page.locator('#hedge-sound').click();
    await expect.poll(()=>page.evaluate(()=>window.__hedgeAudioElements.some(node=>!node.paused))).toBe(true);
    await page.locator('#hedge-sound').click();
    expect(await page.evaluate(()=>window.__hedgeAudioElements.every(node=>node.paused))).toBe(true);
    await page.setViewportSize({width:1440,height:960}); await nav('home'); await capture('home-finished-desktop');

    // Corrupt browser data is retained for recovery; opening the app must never replace it.
    const broken = await browser.newContext(); const brokenPage = await broken.newPage(); observe(brokenPage);
    try {
      await broken.addInitScript(({key})=>localStorage.setItem(key,'{broken-save'),{key:SAVE});
      await brokenPage.goto(url,{waitUntil:'networkidle'});
      expect(await brokenPage.evaluate(key=>localStorage.getItem(key),SAVE)).toBe('{broken-save');
      if (!(await brokenPage.locator('#hedge-save-dialog').isVisible())) await brokenPage.locator('#hedge-save-button').click();
      await expect(brokenPage.locator('#hedge-save-dialog')).toBeVisible();
      await brokenPage.locator('#hedge-import-save').setInputFiles(saved.path);
      await expect.poll(()=>brokenPage.evaluate(key=>{try{return JSON.parse(localStorage.getItem(key)).state?.companion?.name}catch{return null}},SAVE)).toBe('Fern');
    } finally { await broken.close(); }

    // Quota failure keeps the user's newly entered companion available in an export.
    const quota = await browser.newContext({acceptDownloads:true}); const quotaPage = await quota.newPage(); observe(quotaPage);
    try {
      await quota.addInitScript(key=>{ const original=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('Storage is full','QuotaExceededError'); return original.call(this,k,v);};},SAVE);
      await quotaPage.goto(url,{waitUntil:'networkidle'});
      await quotaPage.locator('#hedge-name').fill('Rowan');
      await quotaPage.locator('#hedge-welcome-form button[type="submit"]').click();
      expect(await quotaPage.evaluate(key=>localStorage.getItem(key),SAVE)).toBeNull();
      if (!(await quotaPage.locator('#hedge-save-dialog').isVisible())) await quotaPage.locator('#hedge-save-button').click();
      const pending=quotaPage.waitForEvent('download'); await quotaPage.locator('#hedge-export-save').click();
      const item=await pending, path=resolve(output,'quota-recovery.json'); await item.saveAs(path);
      expect(JSON.parse(await readFile(path,'utf8')).companion.name).toBe('Rowan');
    } finally { await quota.close(); }

    // Personalisation retains the same story and must not cross an imported world boundary.
    const beforeDetails = await state(), longName = 'W'.repeat(24);
    await openSave(); await page.locator('#hedge-customise').click();
    await page.locator('#hedge-edit-name').fill(longName);
    await page.locator('#hedge-edit-colour').selectOption('stone');
    await page.locator('#hedge-edit-marking').selectOption('belly');
    await page.locator('#hedge-customise-form button[type="submit"]').click();
    await expect(page.locator('#hedge-customise-dialog')).not.toBeVisible();
    const personalised = await state();
    expect(personalised.companion).toEqual({name:longName,appearance:{colour:'stone',marking:'belly'}});
    expect(personalised.events.slice(0,-1)).toEqual(beforeDetails.events);
    expect(personalised.events.at(-1).type).toBe('rename');
    expect(personalised.finds).toEqual(beforeDetails.finds);
    expect(personalised.preferences).toEqual(beforeDetails.preferences);
    await closeSave(); await page.reload({waitUntil:'networkidle'});
    expect((await state()).companion).toEqual(personalised.companion);
    await page.setViewportSize({width:320,height:844});
    for (const route of ['home','paths','journal','neighbours']) {
      await nav(route);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth),`${route} with a 24-letter name at 320px`).toBeLessThanOrEqual(320);
      if (route === 'home' || route === 'journal') await capture(`${route}-long-name-320`);
    }
    await openSave(); await page.locator('#hedge-customise').click();
    await page.locator('#hedge-edit-name').fill('Elm');
    const detailsGeneration = (await envelope()).generation;
    const detailsPeer = await context.newPage(); observe(detailsPeer);
    try {
      await detailsPeer.goto(url,{waitUntil:'networkidle'});
      await detailsPeer.locator('#hedge-save-button').click();
      await detailsPeer.locator('#hedge-import-save').setInputFiles(saved.path);
      await expect.poll(async () => (await envelope()).generation).not.toBe(detailsGeneration);
      await expect(page.locator('#hedge-content')).toContainText('Fern');
      await page.locator('#hedge-customise-form button[type="submit"]').click();
      await expect(page.locator('#hedge-customise-error')).toContainText('changed in another tab');
      await expect(page.locator('#hedge-customise-dialog')).toBeVisible();
      expect(await state()).toEqual(exported);
      await page.locator('#hedge-customise-close').click(); await closeSave();
    } finally { await detailsPeer.close(); }

    expect(errors,'Browser runtime and console errors').toEqual([]);
    expect(external,'All first-playable resources should be self-contained').toEqual([]);
    const receipt={passed:true,opening:opening.opening,firstOutingMs:departure.readyAt-departure.startedAt,completedOutings:resolved.completedOutings,routeVisits:resolved.routeVisits,mystery:resolved.mystery,twoTabClaimOnce:true,staleGenerationRejected:true,importBackupRestored:true,corruptionPreserved:true,quotaExportRecovered:true,legacyUntouched:true,audioRequiresExplicitToggle:true,personalisationPreservesHistory:true,stalePersonalisationRejected:true,longNameMobileWidth:320,exports:[saved.name,story.name,portrait.name],mobile,errors,external};
    await writeFile(resolve(output,'hedge-experience.json'),`${JSON.stringify(receipt,null,2)}\n`); return receipt;
  } finally { await context.close(); }
}
