import fs from 'fs';
import path from 'path';
import { Category, MenuItem, CafeInfo } from '@/types/menu';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_MENU_ITEMS,
  DEFAULT_CAFE_INFO,
} from '@/lib/default-data';
import { Redis } from '@upstash/redis';

export interface StoredMenuData {
  categories: Category[];
  items: MenuItem[];
  cafeInfo: CafeInfo;
  updatedAt?: string;
  source?: 'redis' | 'tmp' | 'file' | 'memory' | 'default';
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'menu-data.json');
const TMP_FILE = path.join('/tmp', 'dall-menu-data.json');
const REDIS_KEY = 'dall_cafe_menu_data_v1';
const MEMORY_CACHE_TTL_MS = 1000; // 1 second read cache TTL for near-instant consistency

// Global declaration for singleton connection reuse and in-memory cache across serverless warm invocations
declare global {
  var __dall_redis_client__: Redis | undefined;
  var __dall_menu_cache__: { data: StoredMenuData; timestamp: number } | undefined;
}

import { isFoodCategory } from '@/lib/category-helpers';
export { isFoodCategory };

/**
 * Returns a pooled singleton instance of Upstash Redis with keep-alive
 */
function getRedisClient(): Redis | null {
  if (globalThis.__dall_redis_client__) {
    return globalThis.__dall_redis_client__;
  }

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    try {
      const client = new Redis({
        url,
        token,
        retry: {
          retries: 2,
          backoff: (retryCount) => Math.min(Math.exp(retryCount) * 40, 300),
        },
      });
      globalThis.__dall_redis_client__ = client;
      return client;
    } catch (e) {
      console.warn('Failed to initialize Upstash Redis client:', e);
    }
  }
  return null;
}

/**
 * Synchronous local reader fallback
 */
export function getStoredMenuDataSync(): StoredMenuData {
  // 1. Check in-memory cache
  if (
    globalThis.__dall_menu_cache__ &&
    Array.isArray(globalThis.__dall_menu_cache__.data.categories) &&
    Array.isArray(globalThis.__dall_menu_cache__.data.items)
  ) {
    return globalThis.__dall_menu_cache__.data;
  }

  // 2. Check /tmp on serverless environments
  try {
    if (fs.existsSync(TMP_FILE)) {
      const rawTmp = fs.readFileSync(TMP_FILE, 'utf-8');
      const parsedTmp = JSON.parse(rawTmp);
      if (Array.isArray(parsedTmp.categories) && Array.isArray(parsedTmp.items)) {
        const result: StoredMenuData = {
          categories: parsedTmp.categories,
          items: parsedTmp.items,
          cafeInfo: parsedTmp.cafeInfo || DEFAULT_CAFE_INFO,
          updatedAt: parsedTmp.updatedAt,
          source: 'tmp',
        };
        globalThis.__dall_menu_cache__ = { data: result, timestamp: Date.now() };
        return result;
      }
    }
  } catch {
    // Ignore tmp read errors
  }

  // 3. Check project data/menu-data.json
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.categories) && Array.isArray(parsed.items)) {
        const result: StoredMenuData = {
          categories: parsed.categories,
          items: parsed.items,
          cafeInfo: parsed.cafeInfo || DEFAULT_CAFE_INFO,
          updatedAt: parsed.updatedAt,
          source: 'file',
        };
        globalThis.__dall_menu_cache__ = { data: result, timestamp: Date.now() };
        return result;
      }
    }
  } catch (err) {
    console.error('Error reading stored menu data:', err);
  }

  // 4. Default fallback
  const defaultData: StoredMenuData = {
    categories: DEFAULT_CATEGORIES,
    items: DEFAULT_MENU_ITEMS,
    cafeInfo: DEFAULT_CAFE_INFO,
    updatedAt: new Date().toISOString(),
    source: 'default',
  };

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
  } catch {
    // Read-only filesystem on Vercel: safely ignore
  }

  globalThis.__dall_menu_cache__ = { data: defaultData, timestamp: Date.now() };
  return defaultData;
}

/**
 * High-performance reader:
 * L1: In-memory RAM cache (< 0.1ms, 1s TTL)
 * L2: Upstash Redis with connection pooling (~15-80ms)
 * L3: Local /tmp or disk fallback
 */
export async function getStoredMenuData(forceRemote = false): Promise<StoredMenuData> {
  const now = Date.now();

  // Tier 1: In-Memory cache (Instant 0ms response, short 1s TTL for real-time consistency)
  if (!forceRemote && globalThis.__dall_menu_cache__) {
    const age = now - globalThis.__dall_menu_cache__.timestamp;
    if (age < MEMORY_CACHE_TTL_MS) {
      return {
        ...globalThis.__dall_menu_cache__.data,
        source: 'memory',
      };
    }
  }

  // Tier 2: Upstash Redis
  const redis = getRedisClient();
  if (redis) {
    try {
      const remoteData = await redis.get<StoredMenuData>(REDIS_KEY);
      if (
        remoteData &&
        typeof remoteData === 'object' &&
        Array.isArray(remoteData.categories) &&
        Array.isArray(remoteData.items)
      ) {
        // Strip flavorProfile from any food/bakery/breakfast items
        const sanitizedItems = remoteData.items.map((it) => {
          if (isFoodCategory(it.categoryId, remoteData.categories) && it.flavorProfile) {
            const { flavorProfile, ...rest } = it;
            return rest as MenuItem;
          }
          return it;
        });

        const result: StoredMenuData = {
          ...remoteData,
          items: sanitizedItems,
          source: 'redis',
        };
        globalThis.__dall_menu_cache__ = {
          data: result,
          timestamp: now,
        };
        return result;
      }

      // If database is empty, seed it once
      const initialSeed = getStoredMenuDataSync();
      redis.set(REDIS_KEY, initialSeed).catch((e) => console.warn('Redis initial seed error:', e));
      globalThis.__dall_menu_cache__ = {
        data: initialSeed,
        timestamp: now,
      };
      return initialSeed;
    } catch (err) {
      console.warn('Upstash Redis read error, falling back to local tiers:', err);
    }
  }

  // Tier 3: Local storage fallback
  const fallback = getStoredMenuDataSync();
  globalThis.__dall_menu_cache__ = {
    data: fallback,
    timestamp: now,
  };
  return fallback;
}

/**
 * Reliable & Fast writer:
 * 1. Synchronously updates L1 in-memory cache (0ms)
 * 2. Asynchronously updates L2 /tmp (non-blocking)
 * 3. Guaranteed persistence to L3 Upstash Redis (properly awaited to avoid serverless freeze)
 */
export async function saveStoredMenuData(data: Partial<StoredMenuData>): Promise<StoredMenuData> {
  let categories = data.categories;
  let items = data.items;
  let cafeInfo = data.cafeInfo;

  // If any field is missing, read from current menu data
  if (!categories || !items || !cafeInfo) {
    const current = globalThis.__dall_menu_cache__?.data || (await getStoredMenuData(true));
    categories = categories || current.categories;
    items = items || current.items;
    cafeInfo = cafeInfo || current.cafeInfo;
  }

  // Sanitize: Cake, Bakery & Breakfast items must not have flavorProfile (flavor profile is for drinks only)
  const cleanedItems = items.map((item) => {
    if (isFoodCategory(item.categoryId, categories)) {
      if (item.flavorProfile) {
        const { flavorProfile, ...rest } = item;
        return rest as MenuItem;
      }
    }
    return item;
  });

  const updated: StoredMenuData = {
    categories,
    items: cleanedItems,
    cafeInfo,
    updatedAt: new Date().toISOString(),
    source: 'redis',
  };

  // 1. Instantly update L1 in-memory cache (0ms)
  globalThis.__dall_menu_cache__ = {
    data: updated,
    timestamp: Date.now(),
  };

  // 2. Non-blocking L2 disk backup
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (isServerless) {
    fs.promises.writeFile(TMP_FILE, JSON.stringify(updated), 'utf-8').catch(() => {});
  } else {
    (async () => {
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        await fs.promises.writeFile(DATA_FILE, JSON.stringify(updated, null, 2), 'utf-8');
      } catch {
        // Ignore local write errors
      }
    })();
  }

  // 3. Persist to L3 Upstash Redis - Awaited with a safe 6s timeout so serverless runtime doesn't terminate before write
  const redis = getRedisClient();
  if (redis) {
    try {
      await Promise.race([
        redis.set(REDIS_KEY, updated),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Upstash Redis write timed out after 6000ms')), 6000)
        ),
      ]);
    } catch (err) {
      console.error('Upstash Redis write error:', err);
    }
  }

  return updated;
}

/**
 * Invalidate memory cache helper
 */
export function invalidateMenuCache(): void {
  globalThis.__dall_menu_cache__ = undefined;
}
