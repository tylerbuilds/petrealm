import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const SAVE = 'petrealm.save.v1';
const LOCK = 'petrealm:world-save-v1';
const NOW = Date.parse('2026-10-10T12:00:00Z');

/** Exercise the actual built experience in a fresh world, including native two-tab saves. */
export async function smokeCompanionExperience({ browser, expect, output, url }) {
  await mkdir(output, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, locale: 'en-GB', acceptDownloads: true });
  const errors = [];
  const page = await context.newPage();
  const listen = p => p.on('pageerror', error => errors.push(error.message));
  listen(page);
  await page.clock.install({ time: NOW });
  await page.clock.setFixedTime(NOW);
  const world = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), SAVE);
  const download = async (selector, filename) => {
    const pending = page.waitForEvent('download');
    await page.locator(selector).click();
    const file = await pending;
    expect(await file.failure()).toBeNull();
    const path = resolve(output, filename);
    await file.saveAs(path);
    return { name: file.suggestedFilename(), text: await readFile(path, 'utf8') };
  };
  const capture = async name => page.screenshot({ path: resolve(output, `${name}.png`), fullPage: true, animations: 'disabled' });
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.locator('#pet-name').fill('Fern');
    await page.locator('#pet-personality').selectOption('gentle');
    await page.locator('#adopt-button').click();
    await expect(page.locator('#adoption-dialog')).not.toBeVisible();
    await expect(page.locator('#companion-name')).toHaveText('Fern');
    await capture('companion-meadow-desktop');
    await page.locator('.nav-button[data-area="journal"]').click();
    await expect(page.locator('#expedition-form')).toBeVisible();
    await page.locator('input[name="expedition-route"][value="glowpool"]').check();
    await page.locator('input[name="expedition-intent"][value="help"]').check();
    const intention = page.locator('input[name="expedition-intent"][value="help"]');
    await intention.focus();
    await page.clock.fastForward(61_000);
    await expect(intention).toBeFocused();
    await expect(intention).toBeChecked();
    await expect(page.locator('input[name="expedition-route"][value="glowpool"]')).toBeChecked();
    await capture('companion-journal-planner-desktop');
    await page.locator('#expedition-start').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#expedition-countdown')).toBeVisible();
    await expect(page.locator('#expedition-status-title')).toBeFocused();
    const away = await world();
    expect(away.companionship.active.routeId).toBe('glowpool');
    expect(away.companionship.active.intent).toBe('help');
    expect(away.companionship.active.readyAt - away.companionship.active.startedAt).toBe(30_000);
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('#expedition-countdown')).toBeVisible();
    expect((await world()).companionship.active).toEqual(away.companionship.active);
    await page.clock.fastForward(1100);
    await page.clock.setFixedTime(NOW + 31_000);
    await page.clock.fastForward(1100);
    const claim = `[data-claim-expedition="${away.companionship.active.id}"]`;
    await expect(page.locator(claim)).toBeVisible();
    await capture('companion-return-ready-desktop');

    // Both real tabs click the same ready story while the native save lock is held.
    // The second queued action must observe the first claim and reject a duplicate.
    const peer = await context.newPage();
    listen(peer);
    await peer.clock.install({ time: NOW + 31_000 });
    await peer.clock.setFixedTime(NOW + 31_000);
    await peer.goto(new URL('#journal', url).href, { waitUntil: 'networkidle' });
    await expect(peer.locator(claim)).toBeVisible();
    await peer.evaluate(lock => {
      let release;
      const gate = new Promise(resolve => { release = resolve; });
      window.__releaseCompanionLock = release;
      window.__companionLockHeld = false;
      window.__companionLockTask = navigator.locks.request(lock, async () => { window.__companionLockHeld = true; await gate; });
    }, LOCK);
    await expect.poll(() => peer.evaluate(() => window.__companionLockHeld)).toBe(true);
    await page.locator(claim).click();
    await peer.locator(claim).click();
    await expect.poll(() => peer.evaluate(async lock => (await navigator.locks.query()).pending.filter(item => item.name === lock).length, LOCK)).toBeGreaterThanOrEqual(2);
    await peer.evaluate(async () => { window.__releaseCompanionLock(); await window.__companionLockTask; });
    await expect(page.locator('.memory-page')).toHaveCount(1);
    await expect(peer.locator('.memory-page')).toHaveCount(1);
    await expect.poll(() => peer.evaluate(async lock => (await navigator.locks.query()).pending.filter(item => item.name === lock).length, LOCK)).toBe(0);
    const claimed = await world();
    expect(claimed.companionship.active).toBeNull();
    expect(claimed.companionship.profiles[0].trips).toBe(1);
    expect(claimed.companionship.profiles[0].kindness).toBe(3);
    expect(claimed.companionship.collection).toHaveLength(1);
    expect(claimed.wallet).toBe(away.wallet);
    const biography = await page.locator('.journal-biography').innerText();
    const memory = await page.locator('.memory-page').innerText();
    await expect(page.locator('.journal-biography')).toContainText('kindness');
    await expect(page.locator('.memory-find')).toContainText('Brought home:');
    await peer.close();
    await page.reload({ waitUntil: 'networkidle' });
    expect((await world()).companionship).toEqual(claimed.companionship);
    await expect(page.locator('.journal-biography')).toHaveText(biography);
    await expect(page.locator('.memory-page')).toHaveText(memory, { useInnerText: true });
    await capture('companion-earned-story-desktop');
    const html = await download('[data-export-companion]', 'fern-story.html');
    const portrait = await download('[data-export-portrait]', 'fern-portrait.svg');
    expect(html.name).toMatch(/\.html$/);
    expect(html.text).toContain(biography);
    expect(html.text).toMatch(/<svg[^>]+xmlns=/);
    expect(portrait.name).toMatch(/\.svg$/);
    expect(portrait.text).toMatch(/^<svg[^>]+xmlns=/);
    expect(portrait.text).toContain('Fern');

    await page.locator('.nav-button[data-area="glen"]').click();
    await page.locator('[data-game-mode="memory"]').click();
    await expect(page.locator('#memory-timer')).toHaveText('No timer');
    await page.locator('#memory-start').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('[data-memory-index="0"]')).toBeFocused();
    await page.clock.fastForward(90_000);
    await expect(page.locator('#memory-start')).toBeDisabled();
    await expect(page.locator('#memory-timer')).toHaveText('No timer');
    // Learn cards through the visible UI, then finish, proving rewards and focus still work.
    const known = new Map();
    for (let index = 0; index < 12; index += 2) {
      if (await page.locator('#memory-start').isEnabled()) break;
      for (const cardIndex of [index, index + 1]) {
        const card = page.locator(`[data-memory-index="${cardIndex}"]`);
        await card.focus();
        await page.keyboard.press('Space');
        if (await page.locator('#memory-start').isEnabled()) break;
        await expect(card).toBeFocused();
        const label = (await card.getAttribute('aria-label')).replace(', matched', '');
        known.set(cardIndex, label);
      }
      await page.clock.fastForward(1600);
    }
    if (await page.locator('#memory-start').isDisabled()) {
      for (const label of new Set(known.values())) {
        const indices = [...known].filter(([, value]) => value === label).map(([index]) => index);
        expect(indices).toHaveLength(2);
        if ((await page.locator(`[data-memory-index="${indices[0]}"]`).getAttribute('class')).includes('matched')) continue;
        for (const index of indices) { await page.locator(`[data-memory-index="${index}"]`).focus(); await page.keyboard.press('Space'); }
      }
    }
    await expect(page.locator('#memory-feedback')).toContainText('6 pairs');
    await expect(page.locator('#memory-start')).toBeFocused();
    await capture('companion-memory-complete-desktop');
    await page.locator('[data-game-mode="firefly"]').click();
    await page.locator('#game-start').click();
    const journalNav = page.locator('.nav-button[data-area="journal"]');
    await journalNav.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#companion-story-title')).toBeVisible();
    expect((await world()).game.rounds.firefly).toBe(claimed.game.rounds.firefly);

    const mobile = [];
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      for (const area of ['garden', 'journal']) {
        await page.locator(`.nav-button[data-area="${area}"]`).click();
        const sizing = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth,
          overflowing: [...document.querySelectorAll('body *')].filter(node => { const r = node.getBoundingClientRect(); return r.width && (r.right > innerWidth + 1 || r.left < -1); }).slice(0, 10).map(node => ({ tag: node.tagName, id: node.id, class: node.className?.baseVal ?? node.className })) }));
        expect(sizing.document, `${area} at ${width}px: ${JSON.stringify(sizing.overflowing)}`).toBeLessThanOrEqual(width);
        if (area === 'journal') {
          const clippedRoutes = await page.locator('.expedition-route-name').evaluateAll(nodes => nodes.filter(node => node.scrollWidth > node.clientWidth + 1).map(node => ({ name: node.textContent, available: node.clientWidth, content: node.scrollWidth })));
          expect(clippedRoutes, `Route names must fit at ${width}px`).toEqual([]);
        }
        await capture(`companion-${area}-${width}`);
        mobile.push({ area, width, documentWidth: sizing.document });
      }
    }

    // A returning story belongs to its departing friend even while another friend is selected.
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.locator('input[name="expedition-route"][value="whisperwood"]').check();
    await page.locator('input[name="expedition-intent"][value="brave"]').check();
    await page.locator('#expedition-start').click();
    await expect(page.locator('#expedition-countdown')).toBeVisible();
    const secondDeparture = (await world()).companionship.active;
    await page.locator('#friends-button').click();
    await page.locator('#adopt-another').click();
    await page.locator('#pet-name').fill('Clover');
    await page.locator('[data-species="emberkit"]').click();
    await page.locator('#adopt-button').click();
    await expect(page.locator('#companion-name')).toHaveText('Clover');
    await page.locator('.nav-button[data-area="journal"]').click();
    await page.clock.setFixedTime(secondDeparture.readyAt + 1000);
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('#companion-story-title')).toContainText('Clover');
    await expect(page.locator('#expedition-status-title')).toContainText('Fern is back');
    await page.locator(`[data-claim-expedition="${secondDeparture.id}"]`).click();
    await expect(page.locator('.latest-arrival')).toContainText('Fern at Whisperwood');
    await expect(page.locator('#latest-memory-title')).toBeFocused();
    await expect(page.locator('#companion-story-title')).toContainText('Clover');
    const ownership = await world();
    expect(ownership.activePetId).toBe('pet-2');
    expect(ownership.companionship.profiles.map(profile => ({ petId: profile.petId, trips: profile.trips }))).toEqual([
      { petId: 'pet-1', trips: 2 }, { petId: 'pet-2', trips: 0 },
    ]);
    expect(ownership.companionship.last.petId).toBe('pet-1');
    expect(ownership.companionship.profiles[1].memories).toEqual([]);
    await capture('companion-returning-other-friend-desktop');
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('.latest-arrival')).toContainText('Fern at Whisperwood');
    expect((await world()).companionship).toEqual(ownership.companionship);
    expect(errors).toEqual([]);
    const result = { passed: true, firstOutingMs: 30_000, route: away.companionship.active.routeId, intent: away.companionship.active.intent,
      tripsAfterTwoTabClaim: claimed.companionship.profiles[0].trips, collection: claimed.companionship.collection,
      untimedMemoryCompletedAfterMs: 90_000, radioSelectionAndFocusSurvivedPoll: true,
      storyOwnershipAfterFriendChange: ownership.companionship.profiles.map(profile => ({ petId: profile.petId, trips: profile.trips })),
      exports: [html.name, portrait.name], mobile, errors };
    await writeFile(resolve(output, 'companion-experience.json'), `${JSON.stringify(result, null, 2)}\n`);
    return result;
  } finally { await context.close(); }
}
