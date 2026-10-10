// Private backdrop pictures stay in this browser, separate from the world save.
// The controller never uploads files or accepts links. Each selected raster is
// checked before decoding, resized and re-encoded before it can be retained.
export const WORLD_ART_KEY = 'petrealm.world-art.v1';
export const WORLD_ART_LIMITS = Object.freeze({
  inputBytes: 8 * 1024 * 1024,
  sourcePixels: 25_000_000,
  sourceDimension: 6000,
  outputDimension: 1600,
  outputBytes: 512 * 1024,
  retainedBytes: 1024 * 1024,
});
const SLOTS = ['meadow', 'place'];
const TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const PNG_DEPTHS = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] };
const MAX_STORED_CHARS = 2 * (Math.ceil(WORLD_ART_LIMITS.outputBytes / 3) * 4 + 80) + 100;
const emptyState = () => ({ version: 1, meadow: null, place: null });
const copyState = (state) => ({ version: 1, meadow: state.meadow ? { ...state.meadow } : null, place: state.place ? { ...state.place } : null });
const unreadable = () => new Error('Choose a PNG, JPEG or WebP picture. This file could not be read.');
const cancelled = () => Object.assign(new Error('Picture choice cancelled.'), { name: 'WorldArtCancelled' });
const u16 = (bytes, at) => bytes[at] * 256 + bytes[at + 1];
const u32 = (bytes, at) => bytes[at] * 0x1000000 + bytes[at + 1] * 0x10000 + bytes[at + 2] * 256 + bytes[at + 3];
const le32 = (bytes, at) => bytes[at] + bytes[at + 1] * 256 + bytes[at + 2] * 0x10000 + bytes[at + 3] * 0x1000000;
const textAt = (bytes, at, length) => String.fromCharCode(...bytes.subarray(at, at + length));

function checkDimensions(width, height, output = false) {
  const edge = output ? WORLD_ART_LIMITS.outputDimension : WORLD_ART_LIMITS.sourceDimension;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) throw unreadable();
  if (width > edge || height > edge || width * height > WORLD_ART_LIMITS.sourcePixels) {
    throw new Error(output ? 'This picture could not be made small enough. Try a smaller picture.' : 'Choose a picture no larger than 6000 pixels on either side and 25 million pixels altogether.');
  }
  return { width, height };
}

function pngDimensions(bytes) {
  if (bytes.length < 45 || !PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)) throw unreadable();
  if (u32(bytes, 8) !== 13 || textAt(bytes, 12, 4) !== 'IHDR') throw unreadable();
  // PNG's mandatory methods and sample-depth combinations are fixed by IHDR.
  // Reject impossible headers before handing the file to an image decoder.
  if (!PNG_DEPTHS[bytes[25]]?.includes(bytes[24]) || bytes[26] !== 0 || bytes[27] !== 0 || bytes[28] > 1) throw unreadable();
  const dimensions = checkDimensions(u32(bytes, 16), u32(bytes, 20));
  let at = 8;
  let chunks = 0;
  let hasData = false;
  while (at + 12 <= bytes.length && ++chunks <= 4096) {
    const size = u32(bytes, at);
    const type = textAt(bytes, at + 4, 4);
    if (size > bytes.length - at - 12) throw unreadable();
    if (type === 'acTL' || type === 'fcTL' || type === 'fdAT') throw new Error('Choose a still picture rather than an animated one.');
    if (type === 'IHDR' && at !== 8) throw unreadable();
    if (type === 'IDAT') hasData = true;
    if (type === 'IEND') {
      if (size !== 0 || at + 12 !== bytes.length || !hasData) throw unreadable();
      return dimensions;
    }
    at += size + 12;
  }
  throw unreadable();
}

function jpegDimensions(bytes) {
  if (bytes.length < 16 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) throw unreadable();
  let at = 2;
  let dimensions;
  let segments = 0;
  const headerBytes = 256 * 1024;
  const frameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (at < bytes.length && at < headerBytes && ++segments <= 2048) {
    if (bytes[at++] !== 0xff) throw unreadable();
    while (at < headerBytes && bytes[at] === 0xff) at++;
    if (at >= headerBytes) throw unreadable();
    const marker = bytes[at++];
    if (marker === undefined || marker === 0 || marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) throw unreadable();
    if (at + 2 > bytes.length || at + 2 > headerBytes) throw unreadable();
    const size = u16(bytes, at);
    if (size < 2 || at + size > bytes.length || at + size > headerBytes) throw unreadable();
    if (frameMarkers.has(marker)) {
      if (dimensions || size < 11 || bytes[at + 2] !== 8) throw unreadable();
      const channels = bytes[at + 7];
      if (![1, 3, 4].includes(channels) || size !== 8 + channels * 3) throw unreadable();
      dimensions = checkDimensions(u16(bytes, at + 5), u16(bytes, at + 3));
    }
    if (marker === 0xda) {
      if (!dimensions || size < 6) throw unreadable();
      return dimensions;
    }
    at += size;
  }
  throw unreadable();
}

function webpDimensions(bytes) {
  if (bytes.length < 20 || textAt(bytes, 0, 4) !== 'RIFF' || textAt(bytes, 8, 4) !== 'WEBP' || le32(bytes, 4) + 8 !== bytes.length) throw unreadable();
  let at = 12;
  let chunks = 0;
  let extended;
  let dimensions;
  while (at + 8 <= bytes.length && ++chunks <= 4096) {
    const type = textAt(bytes, at, 4);
    const size = le32(bytes, at + 4);
    const start = at + 8;
    if (size > bytes.length - start) throw unreadable();
    if (type === 'ANIM' || type === 'ANMF') throw new Error('Choose a still picture rather than an animated one.');
    if (type === 'VP8X') {
      if (extended || at !== 12 || size !== 10) throw unreadable();
      if (bytes[start] & 2) throw new Error('Choose a still picture rather than an animated one.');
      extended = checkDimensions(1 + bytes[start + 4] + bytes[start + 5] * 256 + bytes[start + 6] * 65536, 1 + bytes[start + 7] + bytes[start + 8] * 256 + bytes[start + 9] * 65536);
    } else if (type === 'VP8L') {
      if (dimensions || size < 5 || bytes[start] !== 0x2f || bytes[start + 4] >> 5 !== 0) throw unreadable();
      dimensions = checkDimensions(1 + bytes[start + 1] + ((bytes[start + 2] & 0x3f) << 8), 1 + (bytes[start + 2] >> 6) + (bytes[start + 3] << 2) + ((bytes[start + 4] & 0x0f) << 10));
    } else if (type === 'VP8 ') {
      if (dimensions || size < 10 || (bytes[start] & 1) || textAt(bytes, start + 3, 3) !== '\x9d\x01\x2a') throw unreadable();
      dimensions = checkDimensions((bytes[start + 6] + bytes[start + 7] * 256) & 0x3fff, (bytes[start + 8] + bytes[start + 9] * 256) & 0x3fff);
    }
    at = start + size + (size & 1);
  }
  if (at !== bytes.length || !dimensions || (extended && (extended.width !== dimensions.width || extended.height !== dimensions.height))) throw unreadable();
  return dimensions;
}

/** Inspect bounded raster bytes before any browser image decoder is called. */
export function inspectRaster(value, mime) {
  const bytes = value instanceof Uint8Array ? value : value instanceof ArrayBuffer ? new Uint8Array(value) : null;
  if (!bytes || !TYPES.has(mime) || bytes.length === 0 || bytes.length > WORLD_ART_LIMITS.inputBytes) throw unreadable();
  const dimensions = mime === 'image/png' ? pngDimensions(bytes) : mime === 'image/jpeg' ? jpegDimensions(bytes) : webpDimensions(bytes);
  return { type: mime, ...dimensions };
}

function readDataUri(src) {
  if (typeof src !== 'string' || src.length > Math.ceil(WORLD_ART_LIMITS.outputBytes / 3) * 4 + 40) throw unreadable();
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(src);
  if (!match || match[2].length % 4 !== 0) throw unreadable();
  let decoded;
  try { decoded = atob(match[2]); } catch { throw unreadable(); }
  if (!decoded.length || decoded.length > WORLD_ART_LIMITS.outputBytes || btoa(decoded) !== match[2]) throw unreadable();
  const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0));
  const raster = inspectRaster(bytes, match[1]);
  checkDimensions(raster.width, raster.height, true);
  return { src, bytes: decoded.length, ...raster };
}

/** Validate only private raster pictures and the two supported fit choices. */
export function parseWorldArt(raw) {
  if (raw === null || raw === undefined || raw === '') return emptyState();
  if (typeof raw !== 'string' || raw.length > MAX_STORED_CHARS) throw new Error('Your saved pictures could not be read. Your world save is safe.');
  let value;
  try { value = JSON.parse(raw); } catch { throw new Error('Your saved pictures could not be read. Your world save is safe.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1 || Object.keys(value).some((key) => !['version', ...SLOTS].includes(key)) || !SLOTS.every((slot) => Object.hasOwn(value, slot))) throw unreadable();
  const state = emptyState();
  let total = 0;
  for (const slot of SLOTS) {
    const entry = value[slot];
    if (entry === null) continue;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) || Object.keys(entry).length !== 2 || !Object.hasOwn(entry, 'src') || !['cover', 'contain'].includes(entry.fit)) throw unreadable();
    const picture = readDataUri(entry.src);
    total += picture.bytes;
    state[slot] = { src: picture.src, fit: entry.fit };
  }
  if (total > WORLD_ART_LIMITS.retainedBytes) throw unreadable();
  return state;
}

async function decodeRaster(file) {
  if (typeof globalThis.createImageBitmap === 'function') return globalThis.createImageBitmap(file, { imageOrientation: 'from-image' });
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const picture = new Image();
      picture.onload = () => resolve({ width: picture.naturalWidth, height: picture.naturalHeight, drawable: picture });
      picture.onerror = () => reject(unreadable());
      picture.src = url;
    });
  } finally { URL.revokeObjectURL(url); }
}

function encodeRaster(picture, { width, height, quality }) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  try {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser could not resize the picture. Try a newer browser.');
    context.drawImage(picture.drawable || picture, 0, 0, width, height);
    return canvas.toDataURL('image/webp', quality);
  }
  finally { canvas.width = 0; canvas.height = 0; }
}

/** Decode/encode can be injected for tests; browser callers use the defaults. */
export async function prepareWorldArtFile(file, { decode = decodeRaster, encode = encodeRaster, isCurrent = () => true } = {}) {
  let picture;
  try {
    if (!file || !TYPES.has(file.type) || !Number.isInteger(file.size) || file.size < 1 || typeof file.arrayBuffer !== 'function') throw unreadable();
    if (file.size > WORLD_ART_LIMITS.inputBytes) throw new Error('Choose a picture up to 8 MiB.');
    if (!isCurrent()) throw cancelled();
    let buffer;
    try { buffer = await file.arrayBuffer(); }
    catch {
      if (!isCurrent()) throw cancelled();
      throw unreadable();
    }
    if (!isCurrent()) throw cancelled();
    if (!(buffer instanceof ArrayBuffer) || buffer.byteLength !== file.size) throw unreadable();
    const source = inspectRaster(buffer, file.type);
    picture = await decode(file, source);
    if (!isCurrent()) throw cancelled();
    const dimensions = checkDimensions(picture?.width, picture?.height);
    if (!((dimensions.width === source.width && dimensions.height === source.height) || (dimensions.width === source.height && dimensions.height === source.width))) throw unreadable();
    for (const edge of [1600, 1200, 900, 675]) {
      const scale = Math.min(1, edge / Math.max(dimensions.width, dimensions.height));
      const width = Math.max(1, Math.round(dimensions.width * scale));
      const height = Math.max(1, Math.round(dimensions.height * scale));
      for (const quality of [0.86, 0.68]) {
        if (!isCurrent()) throw cancelled();
        const result = await encode(picture, { width, height, quality });
        if (!isCurrent()) throw cancelled();
        if (typeof result !== 'string') throw unreadable();
        if (result.length > Math.ceil(WORLD_ART_LIMITS.outputBytes / 3) * 4 + 40) continue;
        const encoded = /^data:image\/(?:png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(result)?.[1];
        if (encoded && encoded.length / 4 * 3 - (encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0) > WORLD_ART_LIMITS.outputBytes) continue;
        const output = readDataUri(result);
        if (output.width !== width || output.height !== height) throw unreadable();
        return output.src;
      }
    }
    throw new Error('This picture could not be made small enough. Try a smaller picture.');
  } catch (error) {
    if (error?.name === 'WorldArtCancelled') throw error;
    if (error instanceof Error && /^(Choose |This |Your )/.test(error.message)) throw error;
    throw unreadable();
  } finally { picture?.close?.(); }
}

function defaultStorage() {
  try { return globalThis.localStorage; } catch { return null; }
}

/**
 * getState() returns a copy; onChange(state) runs only after a successful write.
 * choose(slot,file) resolves {status:'saved'|'cancelled',state}; errors are plain
 * user-facing messages. clear/clearAll/setFit are synchronous atomic writes.
 * At most one preparation runs; only the latest queued file is retained.
 * cancel() invalidates pending work when a panel closes or the view changes.
 * reload() cancels pending work, reads this key and returns {state,warning}; call
 * it for storage events. restore() is its initial-load alias. dispose() cancels.
 */
export function createWorldArtController({ storage = defaultStorage(), onChange = () => {}, prepare = prepareWorldArtFile } = {}) {
  let state = emptyState();
  let revision = 0;
  let disposed = false;
  let observedRaw;
  let active = false;
  let queued = null;
  const validSlot = (slot) => {
    if (!SLOTS.includes(slot)) throw new Error('Choose the meadow or a place for your picture.');
    if (disposed) throw new Error('Open the picture settings again to make a change.');
  };
  function emit() { onChange(copyState(state)); }
  function readRaw() {
    try {
      if (!storage || typeof storage.getItem !== 'function') throw new Error('No storage');
      return storage.getItem(WORLD_ART_KEY);
    } catch { throw new Error('Your browser could not save this picture. Your previous pictures and world save have not changed.'); }
  }
  function unchanged() {
    const raw = readRaw();
    if (observedRaw === undefined) {
      const restored = parseWorldArt(raw);
      observedRaw = raw;
      state = restored;
    } else if (raw !== observedRaw) {
      invalidate();
      throw new Error('Your pictures changed in another tab. Reopen these settings before making a change.');
    }
  }
  function write(next) {
    const validated = parseWorldArt(JSON.stringify(next));
    unchanged();
    const raw = JSON.stringify(validated);
    try {
      if (!storage || typeof storage.setItem !== 'function') throw new Error('No storage');
      storage.setItem(WORLD_ART_KEY, raw);
    } catch { throw new Error('Your browser could not save this picture. Your previous pictures and world save have not changed.'); }
    observedRaw = raw;
    state = validated;
    emit();
    return copyState(state);
  }
  function invalidate() {
    revision++;
    if (queued) {
      queued.resolve({ status: 'cancelled', state: copyState(state) });
      queued = null;
    }
  }
  function reload() {
    invalidate();
    if (disposed) return { state: copyState(state), warning: null };
    try {
      const raw = readRaw();
      // Remember malformed incoming storage too, so a deliberate new choice can
      // repair it without treating an old bad record as a concurrent edit.
      observedRaw = raw;
      state = parseWorldArt(raw);
      emit();
      return { state: copyState(state), warning: null };
    } catch {
      return { state: copyState(state), warning: 'Your saved pictures could not be read. Your world save is safe.' };
    }
  }
  function startNext() {
    if (active || !queued) return;
    const job = queued;
    queued = null;
    active = true;
    const isCurrent = () => !disposed && job.intent === revision;
    (async () => {
      try {
        if (!isCurrent()) return job.resolve({ status: 'cancelled', state: copyState(state) });
        unchanged();
        const src = await prepare(job.file, { isCurrent });
        if (!isCurrent()) return job.resolve({ status: 'cancelled', state: copyState(state) });
        const next = copyState(state);
        next[job.slot] = { src, fit: next[job.slot]?.fit || 'cover' };
        job.resolve({ status: 'saved', state: write(next) });
      } catch (error) {
        if (!isCurrent() || error?.name === 'WorldArtCancelled') job.resolve({ status: 'cancelled', state: copyState(state) });
        else job.reject(error);
      } finally {
        active = false;
        startNext();
      }
    })();
  }
  return {
    getState: () => copyState(state),
    restore: reload,
    reload,
    choose(slot, file) {
      validSlot(slot);
      invalidate();
      return new Promise((resolve, reject) => {
        queued = { slot, file, intent: revision, resolve, reject };
        startNext();
      });
    },
    clear(slot) {
      validSlot(slot);
      invalidate();
      unchanged();
      const next = copyState(state);
      next[slot] = null;
      return write(next);
    },
    clearAll() {
      if (disposed) throw new Error('Open the picture settings again to make a change.');
      invalidate();
      unchanged();
      return write(emptyState());
    },
    setFit(slot, fit) {
      validSlot(slot);
      if (!['cover', 'contain'].includes(fit)) throw new Error('Choose how the picture should fit.');
      invalidate();
      unchanged();
      if (!state[slot]) return copyState(state);
      const next = copyState(state);
      next[slot].fit = fit;
      return write(next);
    },
    cancel: invalidate,
    dispose() { disposed = true; invalidate(); },
  };
}
