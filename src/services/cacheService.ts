/**
 * CacheService — localStorage + IndexedDB caching with TTL, deduplication, and background sync.
 */

// ─── TTL Defaults (in milliseconds) ───
const TTL = {
  SHORT: 5 * 60 * 1000,          // 5 min — search results
  MEDIUM: 60 * 60 * 1000,        // 1 hour — exercise details
  LONG: 24 * 60 * 60 * 1000,     // 24 hours — categories, muscles, filters
  VERY_LONG: 7 * 24 * 60 * 60 * 1000, // 7 days — static translations
};

// ─── localStorage Cache ───
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`cache:${key}`);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(`cache:${key}`);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function lsSet<T>(key: string, data: T, ttl: number): void {
  try {
    const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttl };
    localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
  } catch {
    // localStorage full — evict oldest entries
    evictOldestEntries();
    try {
      const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttl };
      localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
    } catch {
      // silently fail
    }
  }
}

function evictOldestEntries(): void {
  const cacheKeys: { key: string; expiresAt: number }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("cache:")) {
      try {
        const entry = JSON.parse(localStorage.getItem(key)!);
        cacheKeys.push({ key, expiresAt: entry.expiresAt });
      } catch {
        localStorage.removeItem(key!);
      }
    }
  }
  // Remove expired first, then oldest
  cacheKeys.sort((a, b) => a.expiresAt - b.expiresAt);
  const toRemove = Math.max(5, Math.floor(cacheKeys.length / 4));
  for (let i = 0; i < toRemove && i < cacheKeys.length; i++) {
    localStorage.removeItem(cacheKeys[i].key);
  }
}

// ─── IndexedDB Cache ───
const DB_NAME = "meushape_cache";
const DB_VERSION = 1;
const STORE_NAME = "cache_entries";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("expiresAt", "expiresAt", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => {
        const entry = req.result;
        if (!entry) return resolve(null);
        if (Date.now() > entry.expiresAt) {
          // Delete expired in background
          const delTx = db.transaction(STORE_NAME, "readwrite");
          delTx.objectStore(STORE_NAME).delete(key);
          return resolve(null);
        }
        resolve(entry.data as T);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function idbSet<T>(key: string, data: T, ttl: number): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({
      key,
      data,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
    });
  } catch {
    // silently fail
  }
}

async function idbClearExpired(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("expiresAt");
    const range = IDBKeyRange.upperBound(Date.now());
    const req = index.openCursor(range);
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  } catch {
    // silently fail
  }
}

// ─── Request Deduplication ───
const inflightRequests = new Map<string, Promise<any>>();

/**
 * Wraps an async function with deduplication.
 * If a request with the same key is already in-flight, returns the existing promise.
 */
function deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflightRequests.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => {
    inflightRequests.delete(key);
  });

  inflightRequests.set(key, promise);
  return promise;
}

// ─── Unified Cache API ───

export const cache = {
  TTL,

  /**
   * Get from localStorage (fast, sync-like).
   */
  getLocal<T>(key: string): T | null {
    return lsGet<T>(key);
  },

  /**
   * Set in localStorage with TTL.
   */
  setLocal<T>(key: string, data: T, ttl = TTL.MEDIUM): void {
    lsSet(key, data, ttl);
  },

  /**
   * Get from IndexedDB (larger storage, async).
   */
  getIDB<T>(key: string): Promise<T | null> {
    return idbGet<T>(key);
  },

  /**
   * Set in IndexedDB with TTL.
   */
  setIDB<T>(key: string, data: T, ttl = TTL.MEDIUM): Promise<void> {
    return idbSet(key, data, ttl);
  },

  /**
   * Get from localStorage first, then IndexedDB fallback.
   */
  async get<T>(key: string): Promise<T | null> {
    const local = lsGet<T>(key);
    if (local !== null) return local;
    return idbGet<T>(key);
  },

  /**
   * Set in both localStorage and IndexedDB.
   */
  async set<T>(key: string, data: T, ttl = TTL.MEDIUM): Promise<void> {
    lsSet(key, data, ttl);
    await idbSet(key, data, ttl);
  },

  /**
   * Cache-first data fetching with deduplication.
   * Checks cache → if miss, fetches with dedup → stores in cache.
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl = TTL.MEDIUM
  ): Promise<T> {
    // 1. Check localStorage
    const local = lsGet<T>(key);
    if (local !== null) return local;

    // 2. Check IndexedDB
    const idb = await idbGet<T>(key);
    if (idb !== null) {
      // Promote to localStorage for faster next access
      lsSet(key, idb, ttl);
      return idb;
    }

    // 3. Fetch with deduplication
    return deduplicate(key, async () => {
      const data = await fetcher();
      lsSet(key, data, ttl);
      await idbSet(key, data, ttl);
      return data;
    });
  },

  /**
   * Clear all expired entries from both stores.
   */
  async clearExpired(): Promise<void> {
    // localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith("cache:")) {
        try {
          const entry = JSON.parse(localStorage.getItem(key)!);
          if (Date.now() > entry.expiresAt) localStorage.removeItem(key);
        } catch {
          localStorage.removeItem(key!);
        }
      }
    }
    // IndexedDB
    await idbClearExpired();
  },

  /**
   * Deduplicate concurrent requests with same key.
   */
  deduplicate,
};

// ─── Plan Generation Rate Limiting ───
const PLAN_COOLDOWN_KEY = "plan:lastGeneratedAt";
const PLAN_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function getLastPlanGeneratedAt(): number | null {
  const val = localStorage.getItem(PLAN_COOLDOWN_KEY);
  return val ? parseInt(val, 10) : null;
}

export function setPlanGenerated(): void {
  localStorage.setItem(PLAN_COOLDOWN_KEY, String(Date.now()));
}

export function canGeneratePlan(): boolean {
  const last = getLastPlanGeneratedAt();
  if (!last) return true;
  return Date.now() - last >= PLAN_COOLDOWN_MS;
}

export function daysUntilNextPlan(): number {
  const last = getLastPlanGeneratedAt();
  if (!last) return 0;
  const elapsed = Date.now() - last;
  const remaining = PLAN_COOLDOWN_MS - elapsed;
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
}

// ─── Background Sync (1x per day) ───
const LAST_SYNC_KEY = "cache:lastBackgroundSync";

export function shouldBackgroundSync(): boolean {
  const last = localStorage.getItem(LAST_SYNC_KEY);
  if (!last) return true;
  return Date.now() - parseInt(last, 10) > 24 * 60 * 60 * 1000;
}

export function markBackgroundSynced(): void {
  localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
}

// ─── Workout Sync Flag ───
export function setHasNewWorkout(value: boolean): void {
  localStorage.setItem("sync:hasNewWorkout", value ? "1" : "0");
}

export function getHasNewWorkout(): boolean {
  return localStorage.getItem("sync:hasNewWorkout") === "1";
}

// Auto-cleanup on module load
if (typeof window !== "undefined") {
  setTimeout(() => cache.clearExpired(), 5000);
}
