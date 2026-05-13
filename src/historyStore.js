const DB_NAME = "photo-style-workbench";
const DB_VERSION = 1;
const STORE_NAME = "images";
const HISTORY_KEY = "photo-style-workbench.history.v2";
const LEGACY_HISTORY_KEY = "photo-style-workbench.history";
const MAX_HISTORY = 8;

export async function loadHistory() {
  const items = readMetadata();
  const hydrated = await Promise.all(
    items.map(async (item) => {
      const [previewBlob, resultBlob] = await Promise.all([
        getStoredBlob(item.previewKey),
        getStoredBlob(item.resultKey)
      ]);

      if (!previewBlob || !resultBlob) return null;

      return {
        ...item,
        previewUrl: URL.createObjectURL(previewBlob),
        resultUrl: URL.createObjectURL(resultBlob)
      };
    })
  );

  return hydrated.filter(Boolean);
}

export async function saveHistoryItem(item) {
  const previewKey = `${item.id}:preview`;
  const resultKey = `${item.id}:result`;
  const [previewBlob, resultBlob] = await Promise.all([
    blobFromUrl(item.previewUrl),
    blobFromUrl(item.resultUrl)
  ]);

  await Promise.all([
    putStoredBlob(previewKey, previewBlob),
    putStoredBlob(resultKey, resultBlob)
  ]);

  const metadata = {
    id: item.id,
    styleId: item.styleId,
    styleName: item.styleName,
    createdAt: item.createdAt,
    previewKey,
    resultKey
  };
  const next = [metadata, ...readMetadata()].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  localStorage.removeItem(LEGACY_HISTORY_KEY);

  await trimImageStore(next);

  return {
    ...metadata,
    previewUrl: URL.createObjectURL(previewBlob),
    resultUrl: URL.createObjectURL(resultBlob)
  };
}

export async function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(LEGACY_HISTORY_KEY);
  const db = await openDb();

  await requestToPromise(db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).clear());
  db.close();
}

function readMetadata() {
  try {
    const items = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(items) ? items.filter((item) => item.previewKey && item.resultKey) : [];
  } catch {
    return [];
  }
}

async function trimImageStore(items) {
  const keep = new Set(items.flatMap((item) => [item.previewKey, item.resultKey]));
  const db = await openDb();
  const store = db.transaction(STORE_NAME).objectStore(STORE_NAME);
  const keys = await requestToPromise(store.getAllKeys());
  db.close();

  await Promise.all(keys.filter((key) => !keep.has(key)).map((key) => deleteStoredBlob(key)));
}

async function deleteStoredBlob(key) {
  const db = await openDb();
  await requestToPromise(db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(key));
  db.close();
}

async function blobFromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("无法保存历史图片，请稍后重试。");
  return response.blob();
}

async function getStoredBlob(key) {
  if (!key) return null;
  const db = await openDb();
  const blob = await requestToPromise(db.transaction(STORE_NAME).objectStore(STORE_NAME).get(key));
  db.close();
  return blob || null;
}

async function putStoredBlob(key, blob) {
  const db = await openDb();
  await requestToPromise(db.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(blob, key));
  db.close();
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
