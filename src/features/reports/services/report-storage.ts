import type { StoredReportFile } from "../types/report.types";

/**
 * Bản mock lưu tệp báo cáo trong IndexedDB của trình duyệt
 * (tệp Excel thường vượt giới hạn ~5MB của localStorage).
 */
const DB_NAME = "cipm_reports";
const STORE = "files";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export const reportStorage = {
  async list(): Promise<StoredReportFile[]> {
    const all = await run<StoredReportFile[]>("readonly", (s) => s.getAll());
    return all.sort((a, b) => b.uploadedAt - a.uploadedAt);
  },
  async get(id: string): Promise<StoredReportFile | undefined> {
    return run<StoredReportFile | undefined>("readonly", (s) => s.get(id));
  },
  async save(file: StoredReportFile): Promise<void> {
    await run("readwrite", (s) => s.put(file));
  },
  async remove(id: string): Promise<void> {
    await run("readwrite", (s) => s.delete(id));
  },
};
