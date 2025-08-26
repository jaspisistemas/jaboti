// IndexedDB-based persistence for CodeChat page configuration
// Stores per-user/per-company configurations so the user does not need to retype each time

export type CodeChatConfig = {
  baseUrl: string;
  instanceName: string;
  bearerToken: string;
  apikey?: string;
  defaultNumber?: string;
  groupJid?: string;
};

const DB_NAME = 'jaboti-codechat';
const DB_VERSION = 1;
const STORE = 'configs';

type StoredConfig = { key: string; cfg: CodeChatConfig };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveCodeChatConfig(key: string, cfg: CodeChatConfig): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    store.put({ key, cfg } as StoredConfig);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function loadCodeChatConfig(key: string): Promise<CodeChatConfig | null> {
  const db = await openDb();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.get(key);
    req.onsuccess = () => resolve((req.result as StoredConfig | undefined)?.cfg ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function listCodeChatKeys(): Promise<string[]> {
  const db = await openDb();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.getAllKeys();
    req.onsuccess = () => resolve((req.result as string[]) || []);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteCodeChatConfig(key: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    store.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
