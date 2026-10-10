import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORLD_ART_KEY, WORLD_ART_LIMITS, inspectRaster, parseWorldArt,
  prepareWorldArtFile, createWorldArtController,
} from '../src/world-theme.js';

// These bounded structural fixtures test the header guard, not an image codec.
// Real image decoding and canvas output are exercised by the browser checks.
function chunk(type, body) {
  const result = Buffer.alloc(body.length + 12);
  result.writeUInt32BE(body.length, 0);
  result.write(type, 4, 4, 'ascii');
  body.copy(result, 8);
  return result;
}
function png(width = 32, height = 24, { extra = [], dataBytes = 1 } = {}) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4);
  header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), ...extra, chunk('IDAT', Buffer.alloc(dataBytes)), chunk('IEND', Buffer.alloc(0))]);
}
function jpeg(width = 32, height = 24, { prefix = Buffer.alloc(0), duplicate = false } = {}) {
  const frame = Buffer.from([0xff, 0xc0, 0, 11, 8, height >> 8, height & 255, width >> 8, width & 255, 1, 1, 0x11, 0]);
  return Buffer.concat([Buffer.from([0xff, 0xd8]), prefix, frame, duplicate ? frame : Buffer.alloc(0), Buffer.from([0xff, 0xda, 0, 8, 1, 1, 0, 0, 63, 0, 0, 0xff, 0xd9])]);
}
function webpChunk(type, body) {
  const header = Buffer.alloc(8);
  header.write(type, 0, 4, 'ascii'); header.writeUInt32LE(body.length, 4);
  return Buffer.concat([header, body, body.length & 1 ? Buffer.alloc(1) : Buffer.alloc(0)]);
}
function webp(width = 32, height = 24, { lossy = false, extended, animation = false, extra = [] } = {}) {
  const data = lossy ? Buffer.alloc(10) : Buffer.alloc(5);
  if (lossy) {
    data[3] = 0x9d; data[4] = 1; data[5] = 0x2a;
    data.writeUInt16LE(width, 6); data.writeUInt16LE(height, 8);
  } else {
    data[0] = 0x2f;
    const packed = (width - 1) + (height - 1) * 16384;
    data.writeUInt32LE(packed, 1);
  }
  const chunks = [];
  if (extended) {
    const header = Buffer.alloc(10); header[0] = animation ? 2 : 0;
    header.writeUIntLE(extended[0] - 1, 4, 3); header.writeUIntLE(extended[1] - 1, 7, 3);
    chunks.push(webpChunk('VP8X', header));
  }
  chunks.push(...extra, webpChunk(lossy ? 'VP8 ' : 'VP8L', data));
  const body = Buffer.concat([Buffer.from('WEBP'), ...chunks]);
  const header = Buffer.alloc(8); header.write('RIFF'); header.writeUInt32LE(body.length, 4);
  return Buffer.concat([header, body]);
}
const dataUri = (bytes = png(), type = 'image/png') => `data:${type};base64,${bytes.toString('base64')}`;
function file(bytes, type = 'image/png') {
  return { size: bytes.length, type, arrayBuffer: async () => Uint8Array.from(bytes).buffer };
}
function memoryStorage(initial = null) {
  const values = new Map(initial === null ? [] : [[WORLD_ART_KEY, initial]]);
  const writes = [];
  return { values, writes, getItem: (key) => values.get(key) ?? null, setItem(key, value) { writes.push({ key, value }); values.set(key, value); } };
}
function deferred() {
  let resolve; let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test('PNG, JPEG and both WebP frame formats yield bounded actual dimensions', () => {
  assert.deepEqual(inspectRaster(png(300, 200), 'image/png'), { type: 'image/png', width: 300, height: 200 });
  assert.deepEqual(inspectRaster(jpeg(300, 200), 'image/jpeg'), { type: 'image/jpeg', width: 300, height: 200 });
  for (const options of [{}, { lossy: true }, { extended: [300, 200] }]) {
    assert.deepEqual(inspectRaster(webp(300, 200, options), 'image/webp'), { type: 'image/webp', width: 300, height: 200 });
  }
});

test('wrong MIME, active formats, broken headers and truncated chunks are refused', () => {
  for (const [bytes, type] of [
    [png(), 'image/jpeg'], [jpeg(), 'image/png'], [webp(), 'image/png'],
    [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>'), 'image/png'],
    [Buffer.from('GIF89a'), 'image/gif'], [png(), 'application/octet-stream'],
    [png().subarray(0, 30), 'image/png'], [jpeg().subarray(0, 12), 'image/jpeg'],
    [webp().subarray(0, 25), 'image/webp'], [jpeg(32, 24, { duplicate: true }), 'image/jpeg'],
  ]) assert.throws(() => inspectRaster(bytes, type), /Choose a PNG, JPEG or WebP/);
  const broken = png(); broken.writeUInt32BE(0xffffffff, 33);
  assert.throws(() => inspectRaster(broken, 'image/png'), /could not be read/);
});

test('highly compressed dimension bombs are rejected before the decoder runs', async () => {
  let decoded = 0;
  for (const [bytes, type] of [[png(6001, 1), 'image/png'], [png(6000, 6000), 'image/png'], [jpeg(6001, 100), 'image/jpeg'], [webp(6001, 100), 'image/webp']]) {
    await assert.rejects(prepareWorldArtFile(file(bytes, type), { decode() { decoded++; } }), /6000 pixels/);
  }
  assert.equal(decoded, 0);
  const huge = { size: WORLD_ART_LIMITS.inputBytes + 1, type: 'image/png', arrayBuffer() { throw new Error('must not read'); } };
  await assert.rejects(prepareWorldArtFile(huge), /up to 8 MiB/);
});

test('ordinary large purchased pictures fit the bounded source allowance', () => {
  assert.equal(inspectRaster(jpeg(4237, 4237), 'image/jpeg').width, 4237);
  assert.equal(inspectRaster(png(5000, 5000), 'image/png').height, 5000);
  assert.equal(inspectRaster(webp(6000, 4000), 'image/webp').width, 6000);
  assert.throws(() => inspectRaster(png(6000, 4167), 'image/png'), /25 million pixels/);
});

test('APNG and animated or inconsistent extended WebP are refused', () => {
  assert.throws(() => inspectRaster(png(32, 24, { extra: [chunk('acTL', Buffer.alloc(8))] }), 'image/png'), /still picture/);
  assert.throws(() => inspectRaster(webp(32, 24, { extended: [32, 24], animation: true }), 'image/webp'), /still picture/);
  assert.throws(() => inspectRaster(webp(32, 24, { extended: [64, 24] }), 'image/webp'), /could not be read/);
  assert.throws(() => inspectRaster(webp(32, 24, { extra: [webpChunk('ANIM', Buffer.alloc(6))] }), 'image/webp'), /still picture/);
});

test('JPEG metadata walking is bounded and malformed lengths do not reach decoding', () => {
  const app = Buffer.from([0xff, 0xe1, 0, 6, 1, 2, 3, 4]);
  assert.equal(inspectRaster(jpeg(100, 80, { prefix: app }), 'image/jpeg').width, 100);
  assert.throws(() => inspectRaster(jpeg(100, 80, { prefix: Buffer.from([0xff, 0xe1, 0xff, 0xff]) }), 'image/jpeg'), /could not be read/);
  assert.throws(() => inspectRaster(jpeg(100, 80, { prefix: Buffer.from([0xff, 0xe1, 0, 1]) }), 'image/jpeg'), /could not be read/);
  const section = Buffer.alloc(65537); section[0] = 0xff; section[1] = 0xe1; section.writeUInt16BE(65535, 2);
  assert.throws(() => inspectRaster(jpeg(100, 80, { prefix: Buffer.concat([section, section, section, section]) }), 'image/jpeg'), /could not be read/);
});

test('a chosen image is resized, re-encoded and released without retaining its source metadata', async () => {
  const source = png(3200, 2000, { extra: [chunk('tEXt', Buffer.from('private-camera-name'))] });
  const calls = [];
  let closed = 0;
  const result = await prepareWorldArtFile(file(source), {
    decode: async () => ({ width: 3200, height: 2000, close() { closed++; } }),
    encode: async (_image, options) => { calls.push(options); return dataUri(png(options.width, options.height)); },
  });
  assert.deepEqual(calls[0], { width: 1600, height: 1000, quality: 0.86 });
  assert.equal(closed, 1);
  assert.equal(Buffer.from(result.split(',')[1], 'base64').includes(Buffer.from('private-camera-name')), false);
  assert.equal(inspectRaster(Buffer.from(result.split(',')[1], 'base64'), 'image/png').width, 1600);
});

test('oversized canvas output is retried at smaller sizes and never retained', async () => {
  const attempted = [];
  const result = await prepareWorldArtFile(file(png(2000, 1000)), {
    decode: async () => ({ width: 2000, height: 1000 }),
    encode: async (_image, options) => {
      attempted.push(options.width);
      return dataUri(png(options.width, options.height, { dataBytes: options.width > 900 ? WORLD_ART_LIMITS.outputBytes + 100 : 1 }));
    },
  });
  assert.deepEqual(attempted, [1600, 1600, 1200, 1200, 900]);
  assert.equal(inspectRaster(Buffer.from(result.split(',')[1], 'base64'), 'image/png').width, 900);
  await assert.rejects(prepareWorldArtFile(file(png()), {
    decode: async () => ({ width: 32, height: 24 }),
    encode: async (_image, options) => dataUri(png(options.width, options.height, { dataBytes: WORLD_ART_LIMITS.outputBytes + 100 })),
  }), /could not be made small enough/);
});

test('mismatched decoder/output dimensions and non-raster canvas results are rejected and closed', async () => {
  let closed = 0;
  await assert.rejects(prepareWorldArtFile(file(png()), {
    decode: async () => ({ width: 6001, height: 1, close() { closed++; } }),
  }), /6000 pixels/);
  await assert.rejects(prepareWorldArtFile(file(png()), {
    decode: async () => ({ width: 30, height: 24, close() { closed++; } }),
  }), /could not be read/);
  await assert.rejects(prepareWorldArtFile(file(png()), {
    decode: async () => ({ width: 32, height: 24, close() { closed++; } }),
    encode: async () => 'data:image/svg+xml;base64,PHN2Zz4=',
  }), /could not be read/);
  await assert.rejects(prepareWorldArtFile(file(png()), {
    decode: async () => ({ width: 32, height: 24, close() { closed++; } }),
    encode: async () => dataUri(png(33, 24)),
  }), /could not be read/);
  assert.equal(closed, 4);
});

test('cancelling while reading or decoding skips stale work and releases decoded pictures', async () => {
  const read = deferred(); let current = true; let decoded = 0;
  const job = prepareWorldArtFile({ ...file(png()), arrayBuffer: () => read.promise }, { isCurrent: () => current, decode() { decoded++; } });
  current = false; read.resolve(Uint8Array.from(png()).buffer);
  await assert.rejects(job, { name: 'WorldArtCancelled' }); assert.equal(decoded, 0);
  const decode = deferred(); current = true; let closed = 0;
  const afterDecode = prepareWorldArtFile(file(png()), { isCurrent: () => current, decode: () => decode.promise });
  await Promise.resolve(); await Promise.resolve();
  current = false; decode.resolve({ width: 32, height: 24, close() { closed++; } });
  await assert.rejects(afterDecode, { name: 'WorldArtCancelled' }); assert.equal(closed, 1);
});

test('restore accepts only bounded local raster data and the two fit choices', () => {
  const saved = { version: 1, meadow: { src: dataUri(), fit: 'contain' }, place: null };
  assert.deepEqual(parseWorldArt(JSON.stringify(saved)), saved);
  for (const src of ['https://example.com/photo.png', 'javascript:alert(1)', 'data:image/svg+xml;base64,PHN2Zz4=', dataUri(png(), 'image/jpeg'), `data:image/png;base64,${'A'.repeat(1_500_000)}`]) {
    assert.throws(() => parseWorldArt(JSON.stringify({ ...saved, meadow: { src, fit: 'cover' } })));
  }
  for (const changed of [{ ...saved, version: 2 }, { ...saved, extra: true }, { ...saved, meadow: { ...saved.meadow, fit: 'repeat' } }, { ...saved, meadow: { ...saved.meadow, extra: true } }]) assert.throws(() => parseWorldArt(JSON.stringify(changed)));
  assert.deepEqual(parseWorldArt(null), { version: 1, meadow: null, place: null });
});

test('saved output byte and dimension limits apply independently of the input limits', () => {
  for (const bytes of [png(1601, 1), png(32, 24, { dataBytes: WORLD_ART_LIMITS.outputBytes + 100 })]) {
    assert.throws(() => parseWorldArt(JSON.stringify({ version: 1, meadow: { src: dataUri(bytes), fit: 'cover' }, place: null })));
  }
});

test('picture storage stays separate; clear, fit changes and reload retain their intended values', async () => {
  const storage = memoryStorage(); storage.values.set('petrealm.world.v3', 'untouched world');
  const changes = [];
  const controller = createWorldArtController({ storage, onChange: (state) => changes.push(state), prepare: async () => dataUri() });
  assert.equal(controller.restore().warning, null);
  assert.equal((await controller.choose('meadow', {})).status, 'saved');
  controller.setFit('meadow', 'contain');
  await controller.choose('meadow', {});
  assert.equal(controller.getState().meadow.fit, 'contain');
  await controller.choose('place', {});
  controller.clear('meadow');
  const restored = createWorldArtController({ storage });
  assert.equal(restored.restore().state.meadow, null);
  assert.equal(restored.getState().place.fit, 'cover');
  restored.clearAll();
  assert.deepEqual(restored.reload().state, { version: 1, meadow: null, place: null });
  assert.equal(storage.values.get('petrealm.world.v3'), 'untouched world');
  assert.ok(storage.writes.every(({ key }) => key === WORLD_ART_KEY));
  changes.at(-1).place.fit = 'contain';
  assert.equal(controller.getState().place.fit, 'cover');
});

test('quota errors preserve prior pictures and never touch the world save', async () => {
  const storage = memoryStorage(); storage.values.set('petrealm.world.v3', 'untouched world');
  const controller = createWorldArtController({ storage, prepare: async () => dataUri() });
  await controller.choose('meadow', {});
  const before = controller.getState(); const raw = storage.getItem(WORLD_ART_KEY);
  storage.setItem = () => { throw new Error('QuotaExceededError'); };
  await assert.rejects(controller.choose('place', {}), /previous pictures and world save have not changed/);
  assert.throws(() => controller.clear('meadow'), /previous pictures/);
  assert.throws(() => controller.setFit('meadow', 'contain'), /previous pictures/);
  assert.deepEqual(controller.getState(), before);
  assert.equal(storage.getItem(WORLD_ART_KEY), raw);
  assert.equal(storage.values.get('petrealm.world.v3'), 'untouched world');
});

test('disabled or malformed picture storage cannot crash or alter an existing world', async () => {
  const disabled = createWorldArtController({ storage: { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('SecurityError'); } }, prepare: async () => dataUri() });
  assert.match(disabled.restore().warning, /world save is safe/);
  await assert.rejects(disabled.choose('meadow', {}), /previous pictures/);
  for (const raw of ['{broken', JSON.stringify({ version: 1, meadow: { src: 'https://example.com', fit: 'cover' }, place: null })]) {
    const storage = memoryStorage(raw); storage.values.set('petrealm.world.v3', 'untouched world');
    const controller = createWorldArtController({ storage });
    assert.match(controller.restore().warning, /world save is safe/);
    assert.deepEqual(controller.getState(), { version: 1, meadow: null, place: null });
    assert.equal(storage.getItem(WORLD_ART_KEY), raw);
    assert.equal(storage.values.get('petrealm.world.v3'), 'untouched world');
  }
});

test('overlapping choices commit only the latest intent while older work drains', async () => {
  const first = deferred(); const second = deferred(); const storage = memoryStorage();
  const controller = createWorldArtController({ storage, prepare: (name) => name === 'old' ? first.promise : second.promise });
  const old = controller.choose('meadow', 'old');
  const latest = controller.choose('place', 'new');
  first.resolve(dataUri(png(32, 24))); assert.equal((await old).status, 'cancelled');
  second.resolve(dataUri(png(12, 8))); assert.equal((await latest).status, 'saved');
  assert.equal(controller.getState().meadow, null);
  assert.equal(storage.writes.length, 1);
  assert.equal(controller.getState().place.src, dataUri(png(12, 8)));
});

test('clear, fit, close, reload and dispose invalidate unfinished choices', async () => {
  for (const action of ['clear', 'clearAll', 'setFit', 'cancel', 'reload', 'dispose']) {
    const pending = deferred(); const storage = memoryStorage();
    const controller = createWorldArtController({ storage, prepare: (name) => name === 'ready' ? Promise.resolve(dataUri()) : pending.promise });
    await controller.choose('meadow', 'ready');
    const work = controller.choose('meadow', 'pending');
    if (action === 'clear') controller.clear('meadow');
    else if (action === 'setFit') controller.setFit('meadow', 'contain');
    else controller[action]();
    const afterIntent = controller.getState(); const writes = storage.writes.length;
    pending.resolve(dataUri(png(12, 8)));
    assert.equal((await work).status, 'cancelled', action);
    assert.deepEqual(controller.getState(), afterIntent, action);
    assert.equal(storage.writes.length, writes, action);
  }
});

test('late rejected work is cancelled quietly and malformed later storage preserves prior art', async () => {
  const pending = deferred(); const storage = memoryStorage();
  const controller = createWorldArtController({ storage, prepare: (name) => name === 'ready' ? Promise.resolve(dataUri()) : pending.promise });
  await controller.choose('meadow', 'ready'); const before = controller.getState();
  const work = controller.choose('place', 'bad'); controller.cancel();
  pending.reject(new Error('private decoder details'));
  assert.equal((await work).status, 'cancelled');
  storage.values.set(WORLD_ART_KEY, '{bad external tab data');
  assert.match(controller.reload().warning, /world save is safe/);
  assert.deepEqual(controller.getState(), before);
});

test('only one preparation runs and only the latest queued file survives repeated picks', async () => {
  const first = deferred(); const last = deferred();
  let running = 0; let maximum = 0;
  const prepared = [];
  const controller = createWorldArtController({ storage: memoryStorage(), prepare: async (name) => {
    prepared.push(name); running++; maximum = Math.max(maximum, running);
    try { return await (name === 0 ? first.promise : last.promise); }
    finally { running--; }
  } });
  const choices = Array.from({ length: 20 }, (_, index) => controller.choose('meadow', index));
  assert.deepEqual(prepared, [0]);
  for (let index = 1; index < 19; index++) assert.equal((await choices[index]).status, 'cancelled');
  first.resolve(dataUri()); assert.equal((await choices[0]).status, 'cancelled');
  last.resolve(dataUri(png(12, 8))); assert.equal((await choices[19]).status, 'saved');
  assert.deepEqual(prepared, [0, 19]);
  assert.equal(maximum, 1);
});

test('cancelled queued files never prepare and cross-tab writes cannot be overwritten after decode', async () => {
  const waiting = deferred(); const storage = memoryStorage(); const prepared = [];
  const controller = createWorldArtController({ storage, prepare: async (name) => { prepared.push(name); return waiting.promise; } });
  controller.restore();
  const active = controller.choose('meadow', 'active'); const queued = controller.choose('place', 'queued');
  controller.cancel();
  assert.equal((await queued).status, 'cancelled');
  waiting.resolve(dataUri()); assert.equal((await active).status, 'cancelled');
  assert.deepEqual(prepared, ['active']);
  const decoding = deferred();
  const fresh = createWorldArtController({ storage, prepare: () => decoding.promise }); fresh.restore();
  const work = fresh.choose('meadow', {});
  const otherTab = JSON.stringify({ version: 1, meadow: null, place: { src: dataUri(png(12, 8)), fit: 'contain' } });
  storage.values.set(WORLD_ART_KEY, otherTab);
  decoding.resolve(dataUri());
  assert.equal((await work).status, 'cancelled');
  assert.equal(storage.getItem(WORLD_ART_KEY), otherTab);
  assert.throws(() => fresh.clear('place'), /changed in another tab/);
  assert.throws(() => fresh.setFit('meadow', 'contain'), /changed in another tab/);
  assert.deepEqual(fresh.reload().state.place, { src: dataUri(png(12, 8)), fit: 'contain' });
  fresh.setFit('place', 'cover');
  assert.equal(fresh.getState().place.fit, 'cover');
});

test('a browser that blocks the native storage getter still opens safely', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('SecurityError'); } });
  try {
    const controller = createWorldArtController({ prepare: async () => dataUri() });
    assert.match(controller.restore().warning, /world save is safe/);
    await assert.rejects(controller.choose('meadow', {}), /previous pictures/);
    assert.deepEqual(controller.getState(), { version: 1, meadow: null, place: null });
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else delete globalThis.localStorage;
  }
});
