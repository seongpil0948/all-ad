// Server-side fetch helpers to align with Next.js caching guidance
// - cachedGet: opt-in to Data Cache with optional revalidation and tags
// - noStoreFetch: ensure per-request dynamic fetches

type CachedOptions = {
  revalidate?: number;
  tags?: string[];
  init?: RequestInit;
};

export async function cachedGet<T = unknown>(
  url: string,
  options: CachedOptions = {},
): Promise<T> {
  const { revalidate, tags, init } = options;
  const res = await fetch(url, {
    ...(init || {}),
    method: "GET",
    cache: "force-cache",
    next: {
      ...(revalidate ? { revalidate } : {}),
      ...(tags ? { tags } : {}),
    },
  } as RequestInit & { next?: { revalidate?: number; tags?: string[] } });

  if (!res.ok) {
    throw new Error(`cachedGet failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function noStoreFetch<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...(init || {}),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`noStoreFetch failed: ${res.status} ${res.statusText}`);
  }
  try {
    return (await res.json()) as T;
  } catch {
    // Non-JSON response
    return undefined as unknown as T;
  }
}
