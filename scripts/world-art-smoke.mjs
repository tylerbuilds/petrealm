import { deflateSync } from 'node:zlib';

const WORLD_SAVE_KEY = 'petrealm.save.v1';
const WORLD_ART_KEY = 'petrealm.world-art.v1';
const FIXED_TIME = Date.parse('2026-10-10T12:00:00Z');

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit++) value = value & 1 ? (value >>> 1) ^ 0xedb88320 : value >>> 1;
  }
  return (value ^ 0xffffffff) >>> 0;
}

function pngChunk(name, bytes) {
  const type = Buffer.from(name), result = Buffer.alloc(bytes.length + 12);
  result.writeUInt32BE(bytes.length); type.copy(result, 4); bytes.copy(result, 8);
  result.writeUInt32BE(crc32(Buffer.concat([type, bytes])), result.length - 4);
  return result;
}

// A small fictional picture made here, with no downloaded or purchased art.
function sceneryFixture() {
  const width = 80, height = 48, header = Buffer.alloc(13), pixels = Buffer.alloc(height * (width * 4 + 1));
  header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1); pixels[row] = 0;
    for (let x = 0; x < width; x++) {
      const at = row + 1 + x * 4, sky = y < height / 2;
      pixels[at] = sky ? 135 : 80; pixels[at + 1] = sky ? 184 : 128;
      pixels[at + 2] = sky ? 218 : 73; pixels[at + 3] = 255;
    }
  }
  return Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), pngChunk('IHDR', header), pngChunk('IDAT', deflateSync(pixels)), pngChunk('IEND', Buffer.alloc(0))]);
}

/** Exercise private scenery through the built consumer UI, using an isolated world. */
export async function smokeWorldArt({ browser, expect, errors, output, readFile, resolve, url }) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, locale: 'en-GB', acceptDownloads: true });
  await context.addInitScript(time => { Date.now = () => time; }, FIXED_TIME);
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });

  const theme = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)), WORLD_ART_KEY);
  const worldRecords = () => page.evaluate(artKey => Object.fromEntries(Object.keys(localStorage)
    .filter(key => key.startsWith('petrealm.') && key !== artKey)
    .sort().map(key => [key, localStorage.getItem(key)])), WORLD_ART_KEY);
  const openSettings = async () => {
    await page.locator('#world-art-button').click();
    await expect(page.locator('#world-art-dialog')).toBeVisible();
  };
  const closeSettings = async () => {
    await page.locator('#close-world-art').click();
    await expect(page.locator('#world-art-dialog')).not.toBeVisible();
  };
  const choosePicture = async slot => {
    await page.locator(`#world-art-${slot}`).setInputFiles({ name: `fictional-${slot}.png`, mimeType: 'image/png', buffer: sceneryFixture() });
    await expect(page.locator('#world-art-status')).toContainText('Your new scenery is ready');
    await expect(page.locator(`#world-art-preview-${slot}`)).toBeVisible();
    await expect(page.locator(`#world-art-fit-${slot}`)).toBeEnabled();
  };

  try {
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    expect(response.status()).toBe(200);
    await page.locator('#pet-name').fill('Test Fern');
    await page.locator('#adopt-button').click();
    await expect(page.locator('#adoption-dialog')).not.toBeVisible();
    await expect(page.locator('#pet-profile')).toContainText('Test Fern');
    const baseline = await worldRecords();
    expect(JSON.parse(baseline[WORLD_SAVE_KEY]).pets[0].name).toBe('Test Fern');
    expect(await theme()).toBeNull();

    await openSettings();
    await choosePicture('meadow');
    const chosen = await theme();
    expect(chosen.version).toBe(1); expect(chosen.place).toBeNull();
    expect(chosen.meadow.src).toMatch(/^data:image\/(?:png|jpeg|webp);base64,/);
    expect(chosen.meadow.fit).toBe('cover');
    expect(await worldRecords()).toEqual(baseline);
    await closeSettings();
    const meadow = page.locator('.scene-card > .personal-scenery img');
    await expect(meadow).toHaveAttribute('src', chosen.meadow.src);
    await expect(meadow).toHaveCSS('object-fit', 'cover');
    await expect.poll(() => meadow.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);

    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('#pet-profile')).toContainText('Test Fern');
    expect(await theme()).toEqual(chosen);
    expect(await worldRecords()).toEqual(baseline);
    await expect(page.locator('.scene-card > .personal-scenery img')).toHaveAttribute('src', chosen.meadow.src);

    await openSettings();
    await page.locator('#world-art-fit-meadow').selectOption('contain');
    await expect(page.locator('#world-art-status')).toContainText('Picture fit saved');
    expect((await theme()).meadow).toEqual({ ...chosen.meadow, fit: 'contain' });
    await expect(page.locator('#world-art-preview-meadow')).toHaveCSS('object-fit', 'contain');
    expect(await worldRecords()).toEqual(baseline);

    await choosePicture('place');
    const bothPictures = await theme();
    expect(bothPictures.place.fit).toBe('cover');
    await closeSettings();
    await page.locator('.nav-button[data-area="market"]').click();
    const arrival = page.locator('.place-arrival > .personal-scenery img');
    await expect(arrival).toHaveAttribute('src', bothPictures.place.src);
    await expect.poll(() => arrival.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    expect(await worldRecords()).toEqual(baseline);
    await page.reload({ waitUntil: 'networkidle' });
    expect(await theme()).toEqual(bothPictures); expect(await worldRecords()).toEqual(baseline);

    await openSettings();
    await page.locator('#world-art-meadow').setInputFiles({ name: 'unsupported.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="80" height="48"/></svg>') });
    await expect(page.locator('#world-art-error')).toContainText('PNG, JPEG or WebP');
    expect(await theme()).toEqual(bothPictures); expect(await worldRecords()).toEqual(baseline);
    await expect(page.locator('#world-art-preview-meadow')).toHaveAttribute('src', bothPictures.meadow.src);

    await closeSettings();
    await page.locator('#save-button').click();
    const pending = page.waitForEvent('download'); await page.locator('#export-save').click();
    const item = await pending; expect(await item.failure()).toBeNull();
    const path = resolve(output, 'world-with-private-scenery.json'); await item.saveAs(path);
    const exported = JSON.parse((await readFile(path)).toString());
    expect(exported).toEqual(JSON.parse(baseline[WORLD_SAVE_KEY]));
    expect(JSON.stringify(exported)).not.toContain('data:image/');
    await page.locator('#close-save').click();

    await openSettings();
    await page.locator('#world-art-clear-meadow').click();
    await expect(page.locator('#world-art-status')).toHaveText('Petrealm scenery is back.');
    expect((await theme()).meadow).toBeNull(); expect((await theme()).place).toEqual(bothPictures.place);
    await expect(page.locator('#world-art-preview-meadow')).not.toBeVisible();
    await expect(page.locator('#world-art-fit-meadow')).toBeDisabled();
    await page.locator('#world-art-clear-place').click();
    expect(await theme()).toEqual({ version: 1, meadow: null, place: null });
    await closeSettings();
    expect(await worldRecords()).toEqual(baseline);
    await expect(page.locator('.personal-scenery')).toHaveCount(0);
    await page.reload({ waitUntil: 'networkidle' });
    expect(await theme()).toEqual({ version: 1, meadow: null, place: null });
    expect(await worldRecords()).toEqual(baseline);
    await expect(page.locator('.personal-scenery')).toHaveCount(0);
  } finally { await context.close(); }
}
