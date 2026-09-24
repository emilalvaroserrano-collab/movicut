import type { Cut } from "@/lib/analyze";
import type { Cue } from "@/lib/subtitles";

const LS_KEY = "movicut-project-v3";
const LEGACY_KEYS = ["movicut-project-v2", "hookcut-project-v1"];
export const CURRENT_SELECTION_VERSION = 3;
const DB_NAME = "movicut";
const STORE = "handles";

export type ProjectSnapshot = {
  name: string;
  size: number;
  cuts: Cut[];
  cues: Cue[];
  srtName?: string;
  selectionVersion?: number;
};

export function loadProject(): ProjectSnapshot | null {
  try {
    const raw =
      localStorage.getItem(LS_KEY) ??
      LEGACY_KEYS.map((key) => localStorage.getItem(key)).find((value) => value != null);
    if (!raw) return null;
    const data = JSON.parse(raw) as ProjectSnapshot;
    if (!data || typeof data.name !== "string" || !Array.isArray(data.cuts)) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveProject(project: ProjectSnapshot): void {
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ ...project, selectionVersion: CURRENT_SELECTION_VERSION }),
    );
  } catch {
    /* the movie still plays; only the reminder is skipped */
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Could not open device storage"));
  });
}

export async function saveMovieHandle(handle: FileSystemFileHandle): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(handle, "movie");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Could not remember the movie"));
  });
  db.close();
}

export async function loadMovieHandle(): Promise<FileSystemFileHandle | null> {
  const db = await openDb();
  const handle = await new Promise<FileSystemFileHandle | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get("movie");
    req.onsuccess = () => resolve((req.result as FileSystemFileHandle | undefined) ?? null);
    req.onerror = () => reject(req.error ?? new Error("Could not read the remembered movie"));
  });
  db.close();
  return handle;
}

export async function hasMovieHandle(): Promise<boolean> {
  try {
    return (await loadMovieHandle()) != null;
  } catch {
    return false;
  }
}
