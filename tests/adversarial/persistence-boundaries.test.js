import test from 'node:test';
import assert from 'node:assert/strict';

let moduleNumber = 0;
async function freshMutex() { return import(`../../src/persistence.js?adversarial=${++moduleNumber}`); }
function replaceGlobal(name, value) {
  const prior = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, value });
  return () => { if (prior) Object.defineProperty(globalThis, name, prior); else delete globalThis[name]; };
}
function database({ transactionError = null } = {}) {
  let closed = 0;
  let active = 0;
  let maximum = 0;
  let queue = Promise.resolve();
  const db = {
    get closed() { return closed; },
    get maximum() { return maximum; },
    close() { closed++; },
    transaction(name, mode) {
      assert.equal(name, 'gate'); assert.equal(mode, 'readwrite');
      if (transactionError) throw transactionError;
      let request;
      const tx = { objectStore() { return { get(key) { assert.equal(key, 'sequence'); request = {}; return request; } }; },
        abort() { tx.aborted = true; }, aborted: false };
      queue = queue.then(() => new Promise((resolve) => {
        active++; maximum = Math.max(maximum, active);
        request.onsuccess();
        queueMicrotask(() => { active--; if (tx.aborted) tx.onabort(); else tx.oncomplete(); resolve(); });
      }));
      return tx;
    },
  };
  return db;
}
function factory(make) {
  let opened = 0;
  const api = { get opened() { return opened; }, open(name, version) {
    assert.equal(name, 'petrealm-save-mutex'); assert.equal(version, 1);
    const request = {};
    const count = ++opened;
    queueMicrotask(() => { request.result = make(count, request); if (request.result) request.onsuccess(); });
    return request;
  } };
  return api;
}
async function withEnvironment(indexedDB, action, navigator = {}) {
  const restoreNavigator = replaceGlobal('navigator', navigator);
  const restoreIndexedDB = replaceGlobal('indexedDB', indexedDB);
  try { return await action(await freshMutex()); }
  finally { restoreIndexedDB(); restoreNavigator(); }
}

test('regression: a blocked opening that later succeeds closes its abandoned database', async () => {
  const db = database();
  const idb = factory((_count, request) => {
    request.onblocked();
    queueMicrotask(() => { request.result = db; request.onsuccess(); });
    return null;
  });
  await withEnvironment(idb, async ({ withSaveLock }) => {
    await assert.rejects(withSaveLock(() => 'must not run'), /blocking the save/);
    await Promise.resolve();
    assert.equal(db.closed, 1);
  });
});

test('regression: a database version change releases the stale connection and reopens the mutex', async () => {
  const first = database(); const second = database();
  const idb = factory((count) => count === 1 ? first : second);
  await withEnvironment(idb, async ({ withSaveLock }) => {
    assert.equal(await withSaveLock(() => 7), 7);
    assert.equal(typeof first.onversionchange, 'function');
    first.onversionchange();
    assert.equal(first.closed, 1);
    assert.equal(await withSaveLock(() => 8), 8);
    assert.equal(idb.opened, 2);
  });
});

test('regression: an unusable cached transaction fails safely and the next attempt can reopen', async () => {
  const first = database({ transactionError: Object.assign(new Error('private native database detail'), { name: 'InvalidStateError' }) });
  const second = database();
  const idb = factory((count) => count === 1 ? first : second);
  await withEnvironment(idb, async ({ withSaveLock }) => {
    let ran = 0;
    await assert.rejects(withSaveLock(() => { ran++; }), /saved world hasn.t changed/);
    assert.equal(ran, 0);
    assert.equal(await withSaveLock(() => { ran++; return 'recovered'; }), 'recovered');
    assert.equal(ran, 1); assert.equal(idb.opened, 2);
  });
});

test('fallback transactions serialize 200 overlapping synchronous operations without losing updates', async () => {
  const db = database(); const idb = factory(() => db);
  await withEnvironment(idb, async ({ withSaveLock }) => {
    let balance = 0;
    const writes = Array.from({ length: 200 }, (_, index) => withSaveLock(() => {
      const previous = balance; balance = previous + 1; return index;
    }));
    assert.deepEqual(await Promise.all(writes), Array.from({ length: 200 }, (_, index) => index));
    assert.equal(balance, 200); assert.equal(db.maximum, 1); assert.equal(idb.opened, 1);
  });
});

test('operation errors abort once while unavailable storage never executes a writer', async () => {
  const db = database(); const idb = factory(() => db);
  await withEnvironment(idb, async ({ withSaveLock }) => {
    const expected = new Error('A fictional domain validation failure');
    await assert.rejects(withSaveLock(() => { throw expected; }), (error) => error === expected);
    assert.equal(await withSaveLock(() => 'still usable'), 'still usable');
  });
  await withEnvironment(undefined, async ({ withSaveLock }) => {
    let ran = false;
    await assert.rejects(withSaveLock(() => { ran = true; }), /can.t save your world safely/);
    assert.equal(ran, false);
  });
});

test('native Web Locks keep the fixed same-origin mutex and preserve asynchronous result/errors', async () => {
  const calls = [];
  const navigator = { locks: { async request(name, options, operation) { calls.push({ name, options }); return operation(); } } };
  await withEnvironment(undefined, async ({ withSaveLock }) => {
    assert.equal(await withSaveLock(async () => { await Promise.resolve(); return 'finished'; }), 'finished');
    const expected = new Error('fictional validation');
    await assert.rejects(withSaveLock(() => { throw expected; }), (error) => error === expected);
    assert.ok(calls.every((call) => call.name === 'petrealm:world-save-v1' && call.options.mode === 'exclusive'));
  }, navigator);
});

test('a stale transaction failure cannot forget a newer connection opened during a version change', async () => {
  const first = database(); const second = database();
  const idb = factory((count) => count === 1 ? first : second);
  await withEnvironment(idb, async ({ withSaveLock }) => {
    let replacement;
    first.transaction = () => {
      first.onversionchange();
      replacement = withSaveLock(() => 'new connection');
      throw Object.assign(new Error('old connection is closed'), { name: 'InvalidStateError' });
    };
    await assert.rejects(withSaveLock(() => 'must not run'), /saved world hasn.t changed/);
    assert.equal(await replacement, 'new connection');
    assert.equal(await withSaveLock(() => 'same new connection'), 'same new connection');
    assert.equal(idb.opened, 2);
  });
});

test('regression: a synchronous denied IndexedDB open gives a safe message and later retries', async () => {
  const db = database(); const safeFactory = factory(() => db);
  let denied = true;
  const idb = { open(...args) {
    if (denied) { denied = false; throw Object.assign(new Error('fictional private denied storage detail'), { name: 'SecurityError' }); }
    return safeFactory.open(...args);
  } };
  await withEnvironment(idb, async ({ withSaveLock }) => {
    let writes = 0;
    await assert.rejects(withSaveLock(() => { writes++; }), /saved world hasn.t changed/);
    assert.equal(writes, 0);
    assert.equal(await withSaveLock(() => { writes++; return 'ready'; }), 'ready');
    assert.equal(writes, 1);
  });
});
