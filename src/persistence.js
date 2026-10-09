// All read-modify-write operations share this same-origin mutex across tabs.
// Web Locks are native on current Linux/macOS browsers in secure contexts.
// An IndexedDB read/write transaction supplies the older-browser fallback.
const LOCK_NAME = 'petrealm:world-save-v1';
let databasePromise;

function openMutexDatabase() {
  if (!globalThis.indexedDB) throw new Error('This browser cannot safely coordinate saved worlds. Use a current browser or export your world.');
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('petrealm-save-mutex', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('gate');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Browser save coordination is unavailable. Your saved world has not been changed.'));
      request.onblocked = () => reject(new Error('Another tab is blocking save coordination. Close older Petrealm tabs and try again.'));
    });
    databasePromise.catch(() => { databasePromise = undefined; });
  }
  return databasePromise;
}

export async function withSaveLock(operation) {
  if (globalThis.navigator?.locks?.request) {
    return navigator.locks.request(LOCK_NAME, { mode: 'exclusive' }, operation);
  }
  const database = await openMutexDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('gate', 'readwrite');
    const store = transaction.objectStore('gate');
    const request = store.get('sequence');
    let result;
    let operationError;
    request.onsuccess = () => {
      try {
        result = operation();
        if (result && typeof result.then === 'function') throw new Error('Save operations must finish inside the browser transaction.');
        // The read/write transaction holds the object-store mutex even when
        // no IndexedDB record is written. Avoid a quota-sensitive bookkeeping
        // write after the operation has already committed local storage.
      } catch (error) { operationError = error; transaction.abort(); }
    };
    transaction.oncomplete = () => resolve(result);
    transaction.onabort = () => reject(operationError || new Error('Save coordination failed. Your current world has not been changed.'));
    transaction.onerror = () => { /* onabort reports the failure once. */ };
  });
}
