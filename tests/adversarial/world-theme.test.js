import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD_ART_KEY, WORLD_ART_LIMITS, inspectRaster, parseWorldArt, prepareWorldArtFile, createWorldArtController } from '../../src/world-theme.js';

// All eight adversarial categories are covered below. Shell/SQL/path traversal
// execution is impossible here: this module has no process, SQL, path or network
// sinks. Their strings are tested as rejected image/JSON data instead.
// Structural fixtures intentionally omit codec payload validity: browser pixel
// corruption fallback belongs to app.js and browser tests, not a second codec.
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
function chunk(type, body = Buffer.alloc(0)) {
  const bytes = Buffer.alloc(body.length + 12);
  bytes.writeUInt32BE(body.length); bytes.write(type, 4, 4, 'ascii'); body.copy(bytes, 8);
  return bytes;
}
function png(width = 32, height = 24, { header = {}, extra = [], dataBytes = 1 } = {}) {
  const body = Buffer.alloc(13); body.writeUInt32BE(width); body.writeUInt32BE(height, 4);
  body[8] = header.depth ?? 8; body[9] = header.colour ?? 6;
  body[10] = header.compression ?? 0; body[11] = header.filter ?? 0; body[12] = header.interlace ?? 0;
  return Buffer.concat([signature, chunk('IHDR', body), ...extra, chunk('IDAT', Buffer.alloc(dataBytes)), chunk('IEND')]);
}
function webpChunk(type, body = Buffer.alloc(0), padding = 0) {
  const bytes = Buffer.alloc(8); bytes.write(type); bytes.writeUInt32LE(body.length, 4);
  return Buffer.concat([bytes, body, ...(body.length & 1 ? [Buffer.from([padding])] : [])]);
}
function webp({ flags = 0, reserved = 0, extra = [] } = {}) {
  const extended = Buffer.alloc(10); extended[0] = flags; extended[1] = reserved;
  extended.writeUIntLE(31, 4, 3); extended.writeUIntLE(23, 7, 3);
  const lossless = Buffer.alloc(5); lossless[0] = 0x2f; lossless.writeUInt32LE(31 + 23 * 16384, 1);
  const body = Buffer.concat([Buffer.from('WEBP'), webpChunk('VP8X', extended), ...extra, webpChunk('VP8L', lossless)]);
  const riff = Buffer.alloc(8); riff.write('RIFF'); riff.writeUInt32LE(body.length, 4);
  return Buffer.concat([riff, body]);
}
const uri = (bytes = png(), type = 'image/png') => `data:${type};base64,${bytes.toString('base64')}`;
const saved = (src = uri(), fit = 'cover') => ({ version: 1, meadow: { src, fit }, place: null });
const file = (bytes = png(), type = 'image/png') => ({ type, size: bytes.length, arrayBuffer: async () => Uint8Array.from(bytes).buffer });
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
function storage(initial = null) {
  const values = new Map(initial === null ? [] : [[WORLD_ART_KEY, initial]]);
  values.set('petrealm.save.v1', 'fictional unchanged world');
  const writes = [];
  return { values, writes, getItem: (key) => values.get(key) ?? null, setItem(key, value) { writes.push(key); values.set(key, value); } };
}
function globals(t, replacements) {
  const original = new Map(Object.keys(replacements).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(replacements)) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  t.after(() => { for (const [key, descriptor] of original) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
}

test('malformed inputs and type confusion: public parsers reject unsupported containers and JSON primitives', () => {
  for (const value of [null, undefined, false, 0, NaN, Infinity, '', [], {}, new DataView(new ArrayBuffer(16))]) assert.throws(() => inspectRaster(value, 'image/png'), /could not be read/);
  for (const raw of [false, 1, [], {}, '\0', '\u202e', ' ', 'null', 'true', '1', '[]', '"text"', '{"version":1}']) assert.throws(() => parseWorldArt(raw));
  for (const value of [null, undefined, '']) assert.deepEqual(parseWorldArt(value), { version: 1, meadow: null, place: null });
});

test('regression: unreadable Blob errors are normalised before reaching the consumer', async () => {
  // The read happened outside prepare's catch and leaked native/private details.
  const broken = { ...file(), arrayBuffer: async () => { throw new Error('NotReadableError: /fictional/private/picture.png'); } };
  await assert.rejects(prepareWorldArtFile(broken), { message: 'Choose a PNG, JPEG or WebP picture. This file could not be read.' });
  const reading = deferred(); let current = true;
  const stale = prepareWorldArtFile({ ...file(), arrayBuffer: () => reading.promise }, { isCurrent: () => current });
  current = false; reading.reject(new Error('fictional vanished source'));
  await assert.rejects(stale, { name: 'WorldArtCancelled' });
});

test('regression: PNG mandatory header fields are refused before browser decoding', async () => {
  // Width/height alone previously accepted impossible bit-depth/colour/methods.
  let decoded = 0;
  for (const header of [{ depth: 0 }, { depth: 32 }, { colour: 1 }, { colour: 3, depth: 16 }, { colour: 2, depth: 4 }, { compression: 1 }, { filter: 1 }, { interlace: 2 }]) {
    await assert.rejects(prepareWorldArtFile(file(png(32, 24, { header })), { decode() { decoded++; throw new Error('decoder must not run'); } }));
  }
  assert.equal(decoded, 0);
  for (const header of [{ depth: 1, colour: 0 }, { depth: 16, colour: 2 }, { depth: 4, colour: 3 }, { depth: 16, colour: 4 }, { depth: 8, colour: 6, interlace: 1 }]) assert.equal(inspectRaster(png(32, 24, { header }), 'image/png').width, 32);
});

test('invalid assumptions: WebP readers ignore reserved extension fields while checking actual frame bounds', () => {
  // Google specifies readers MUST ignore these fields; rejection is not a fix.
  for (const options of [{ flags: 1 }, { flags: 64 }, { flags: 128 }, { reserved: 1 }]) {
    assert.deepEqual(inspectRaster(webp(options), 'image/webp'), { type: 'image/webp', width: 32, height: 24 });
  }
  assert.throws(() => inspectRaster(webp({ flags: 2 }), 'image/webp'), /still picture/);
});

test('regression: a JPEG marker-fill run cannot exceed the header walking budget', () => {
  // Fill bytes formerly bypassed the 256 KiB bound inside the inner while loop.
  const bytes = Buffer.alloc(512 * 1024, 0xff); bytes[1] = 0xd8; bytes[bytes.length - 1] = 0xd9;
  let maximumRead = 0;
  const counted = new Proxy(bytes, { get(target, key) {
    if (/^\d+$/.test(String(key))) maximumRead = Math.max(maximumRead, Number(key));
    const value = Reflect.get(target, key, target); return typeof value === 'function' ? value.bind(target) : value;
  } });
  assert.throws(() => inspectRaster(counted, 'image/jpeg'));
  assert.ok(maximumRead <= 256 * 1024 + 1, `read byte ${maximumRead} beyond header budget`);
});

test('boundary values: byte caps are exact and invalid File sizes never read or decode', async () => {
  let reads = 0;
  for (const size of [-1, 0, 0.5, NaN, Infinity, WORLD_ART_LIMITS.inputBytes + 1]) await assert.rejects(prepareWorldArtFile({ type: 'image/png', size, arrayBuffer() { reads++; } }));
  assert.equal(reads, 0);
  const exact = png(1, 1, { dataBytes: WORLD_ART_LIMITS.inputBytes - png(1, 1).length + 1 });
  assert.equal(exact.length, WORLD_ART_LIMITS.inputBytes);
  assert.equal(inspectRaster(exact, 'image/png').width, 1);
  assert.throws(() => inspectRaster(Buffer.concat([exact, Buffer.from([0])]), 'image/png'));
  for (const dimensions of [[0, 1], [1, 0], [0xffffffff, 1]]) assert.throws(() => inspectRaster(png(...dimensions), 'image/png'));
});

test('resource exhaustion: hostile tiny chunk collections and deeply nested JSON stop at bounds', () => {
  assert.throws(() => inspectRaster(png(1, 1, { extra: Array.from({ length: 4096 }, () => chunk('tEXt')) }), 'image/png'));
  assert.throws(() => inspectRaster(webp({ extra: Array.from({ length: 4096 }, () => webpChunk('JUNK')) }), 'image/webp'));
  assert.throws(() => parseWorldArt('['.repeat(500) + '0' + ']'.repeat(500)));
  assert.throws(() => parseWorldArt(JSON.stringify(Array.from({ length: 100_000 }, () => null))));
});

test('state corruption: canonical base64, trailing data, missing chunks and dangerous schema keys are rejected', () => {
  const malformed = [Buffer.concat([png(), Buffer.from([0])]), png().subarray(0, -12), Buffer.concat([signature, chunk('IHDR', png().subarray(16, 29)), chunk('IEND')])];
  for (const bytes of malformed) assert.throws(() => parseWorldArt(JSON.stringify(saved(uri(bytes)))));
  for (const src of [uri() + '\n', uri().replace(/.$/, '$'), 'data:image/png;base64,AA==', 'data:image/png;base64,AB==']) assert.throws(() => parseWorldArt(JSON.stringify(saved(src))));
  for (const raw of [JSON.stringify({ ...saved(), __proto__: null, constructor: {} }), '{"version":1,"meadow":null,"place":null,"__proto__":{"polluted":true}}']) assert.throws(() => parseWorldArt(raw));
  assert.equal({}.polluted, undefined);
});

test('injection: executable URLs, paths, markup and shell/SQL text never become retained images', () => {
  const payloads = ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'data:image/svg+xml;base64,PHN2Zz4=', 'https://fictional.invalid/pic.png', '../../../etc/passwd', '$(touch /fictional/pwned)', "'; DROP TABLE images;--", '<img src=x onerror=alert(1)>', '\u202ephoto.png\0'];
  for (const src of payloads) assert.throws(() => parseWorldArt(JSON.stringify(saved(src))));
  for (const fit of payloads) assert.throws(() => parseWorldArt(JSON.stringify(saved(uri(), fit))));
  const ctl = createWorldArtController({ storage: storage() });
  for (const slot of payloads) assert.throws(() => ctl.choose(slot, file()), /meadow or a place/);
});

test('invalid assumptions: mismatched array buffers and native decoder rejections never commit', async () => {
  let decoded = 0;
  for (const value of [null, [], new Uint8Array(16), new ArrayBuffer(0), new ArrayBuffer(1)]) await assert.rejects(prepareWorldArtFile({ ...file(), arrayBuffer: async () => value }, { decode() { decoded++; } }));
  assert.equal(decoded, 0);
  const keep = storage(JSON.stringify(saved()));
  const ctl = createWorldArtController({ storage: keep, prepare: (input, options) => prepareWorldArtFile(input, { ...options, decode: async () => { throw new Error('fictional native decoder failure'); } }) });
  ctl.restore(); const before = keep.getItem(WORLD_ART_KEY);
  await assert.rejects(ctl.choose('place', file()), /could not be read/);
  assert.equal(keep.getItem(WORLD_ART_KEY), before); assert.equal(keep.writes.length, 0);
});

test('lifecycle: default Image fallback revokes its object URL after decode error or cancellation', async (t) => {
  let image; const revoked = [];
  globals(t, { createImageBitmap: undefined, URL: { createObjectURL: () => 'blob:fictional-picture', revokeObjectURL: (url) => revoked.push(url) }, Image: class { constructor() { image = this; this.naturalWidth = 32; this.naturalHeight = 24; } } });
  const failed = prepareWorldArtFile(file()); await Promise.resolve(); await Promise.resolve(); image.onerror();
  await assert.rejects(failed, /could not be read/);
  let current = true;
  const stale = prepareWorldArtFile(file(), { isCurrent: () => current, encode: () => { throw new Error('must not encode'); } });
  await Promise.resolve(); await Promise.resolve(); current = false; image.onload();
  await assert.rejects(stale, { name: 'WorldArtCancelled' });
  assert.deepEqual(revoked, ['blob:fictional-picture', 'blob:fictional-picture']);
});

test('lifecycle: default canvas errors clear the bitmap and release decoded pictures', async (t) => {
  const canvases = []; let closed = 0; let stage;
  globals(t, { document: { createElement() { const canvas = { width: 0, height: 0, getContext() { if (stage === 'context') return null; return { drawImage() { if (stage === 'draw') throw new Error('fictional canvas lost'); } }; }, toDataURL() { throw new Error('fictional encoder lost'); } }; canvases.push(canvas); return canvas; } } });
  for (stage of ['context', 'draw', 'encode']) await assert.rejects(prepareWorldArtFile(file(), { decode: async () => ({ width: 32, height: 24, close() { closed++; } }) }));
  assert.equal(closed, 3); assert.ok(canvases.every((canvas) => canvas.width === 0 && canvas.height === 0));
});

test('race/resource exhaustion: a thousand rapid picks retain one active and the last queued intent', async () => {
  const first = deferred(); const last = deferred(); let active = 0, peak = 0; const started = [];
  const ctl = createWorldArtController({ storage: storage(), prepare: async (id) => { started.push(id); peak = Math.max(peak, ++active); try { return await (id === 0 ? first.promise : last.promise); } finally { active--; } } });
  const work = Array.from({ length: 1000 }, (_, id) => ctl.choose('meadow', id));
  for (let id = 1; id < 999; id++) assert.equal((await work[id]).status, 'cancelled');
  first.resolve(uri()); assert.equal((await work[0]).status, 'cancelled');
  last.resolve(uri()); assert.equal((await work[999]).status, 'saved');
  assert.deepEqual(started, [0, 999]); assert.equal(peak, 1);
});

test('race/state corruption: external replacement while encode waits preserves both tabs and the world', async () => {
  const waiting = deferred(); const keep = storage(JSON.stringify(saved()));
  const ctl = createWorldArtController({ storage: keep, prepare: () => waiting.promise }); ctl.restore();
  const job = ctl.choose('place', file());
  const newer = JSON.stringify({ version: 1, meadow: null, place: { src: uri(png(10, 10)), fit: 'contain' } });
  keep.values.set(WORLD_ART_KEY, newer); waiting.resolve(uri());
  assert.equal((await job).status, 'cancelled'); assert.equal(keep.getItem(WORLD_ART_KEY), newer);
  assert.equal(keep.getItem('petrealm.save.v1'), 'fictional unchanged world'); assert.equal(keep.writes.length, 0);
});

test('race/invalid assumptions: failed active preparation drains to the latest queued choice', async () => {
  const first = deferred(); const latest = deferred(); const keep = storage();
  const ctl = createWorldArtController({ storage: keep, prepare: (id) => id === 1 ? first.promise : latest.promise });
  const old = ctl.choose('meadow', 1); const queued = ctl.choose('place', 2);
  first.reject(new Error('fictional old failure')); assert.equal((await old).status, 'cancelled');
  latest.resolve(uri()); assert.equal((await queued).status, 'saved');
  assert.equal(ctl.getState().meadow, null); assert.ok(ctl.getState().place); assert.deepEqual(keep.writes, [WORLD_ART_KEY]);
});

test('state corruption/quota: repairing corrupt pictures is deliberate and denied writes preserve raw recovery data', async () => {
  const broken = '{fictional damaged record'; const keep = storage(broken);
  const ctl = createWorldArtController({ storage: keep, prepare: async () => uri() });
  assert.ok(ctl.restore().warning); keep.setItem = () => { throw new Error('QuotaExceededError'); };
  await assert.rejects(ctl.choose('meadow', file()), /previous pictures/);
  assert.equal(keep.getItem(WORLD_ART_KEY), broken); assert.equal(keep.getItem('petrealm.save.v1'), 'fictional unchanged world');
  keep.setItem = (key, value) => keep.values.set(key, value);
  assert.equal((await ctl.choose('meadow', file())).status, 'saved'); assert.ok(parseWorldArt(keep.getItem(WORLD_ART_KEY)).meadow);
});

test('lifecycle/type confusion: disposed controllers refuse changes without accessing storage', async () => {
  let calls = 0;
  const ctl = createWorldArtController({ storage: { getItem() { calls++; return null; }, setItem() { calls++; } } }); ctl.dispose();
  for (const action of [() => ctl.choose('meadow', file()), () => ctl.clear('place'), () => ctl.clearAll(), () => ctl.setFit('meadow', 'cover')]) assert.throws(action, /settings again/);
  ctl.cancel(); assert.equal(ctl.reload().warning, null); assert.equal(calls, 0);
});
