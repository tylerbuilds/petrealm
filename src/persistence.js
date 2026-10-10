// All read-modify-write operations share this same-origin mutex across tabs.
// Web Locks are native on current Linux/macOS browsers in secure contexts.
// An IndexedDB read/write transaction supplies the older-browser fallback.
const LOCK_NAME = 'petrealm:world-save-v1';
let databasePromise;
const saveUnavailable = () => new Error('Your browser couldn’t save right now. Your saved world hasn’t changed.');

function openMutexDatabase() {
  if (!globalThis.indexedDB) throw new Error('This browser can’t save your world safely. Use a newer browser, or download your save file.');
  if (!databasePromise) {
    const pending = new Promise((resolve, reject) => {
      let request;
      try { request = indexedDB.open('petrealm-save-mutex', 1); }
      catch { reject(saveUnavailable()); return; }
      let settled = false;
      const failed = (error) => { if (!settled) { settled = true; reject(error); } };
      request.onupgradeneeded = () => request.result.createObjectStore('gate');
      request.onsuccess = () => {
        const database = request.result;
        // A blocked request can still succeed after its caller has been told
        // to retry. Do not leave an abandoned connection blocking other tabs.
        if (settled) { database.close(); return; }
        settled = true;
        const forget = () => { if (databasePromise === pending) databasePromise = undefined; };
        database.onversionchange = () => { database.close(); forget(); };
        database.onclose = forget;
        resolve(database);
      };
      request.onerror = () => failed(saveUnavailable());
      request.onblocked = () => failed(new Error('Another Petrealm tab is blocking the save. Close older tabs and try again.'));
    });
    databasePromise = pending;
    pending.catch(() => { if (databasePromise === pending) databasePromise = undefined; });
  }
  return databasePromise;
}

export async function withSaveLock(operation) {
  if (globalThis.navigator?.locks?.request) {
    return navigator.locks.request(LOCK_NAME, { mode: 'exclusive' }, operation);
  }
  const opening = openMutexDatabase();
  const observedConnection = databasePromise;
  const database = await opening;
  return new Promise((resolve, reject) => {
    let transaction;
    let request;
    try {
      transaction = database.transaction('gate', 'readwrite');
      request = transaction.objectStore('gate').get('sequence');
    } catch {
      // A connection can close between opening it and starting a transaction.
      // No world operation has run yet, so fail safely and allow a fresh open.
      database.close();
      if (databasePromise === observedConnection) databasePromise = undefined;
      reject(saveUnavailable());
      return;
    }
    let result;
    let operationError;
    request.onsuccess = () => {
      try {
        result = operation();
        if (result && typeof result.then === 'function') throw new Error('The save couldn’t finish. Try again.');
        // The read/write transaction holds the object-store mutex even when
        // no IndexedDB record is written. Avoid a quota-sensitive bookkeeping
        // write after the operation has already committed local storage.
      } catch (error) { operationError = error; transaction.abort(); }
    };
    transaction.oncomplete = () => resolve(result);
    transaction.onabort = () => reject(operationError || new Error('The save didn’t finish. Your saved world hasn’t changed.'));
    transaction.onerror = () => { /* onabort reports the failure once. */ };
  });
}
