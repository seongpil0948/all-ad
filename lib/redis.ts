import { createClient } from "redis";

import log from "@/utils/logger";
import { RedisClient } from "@/types/redis";

let redisClient: RedisClient | null = null;

export async function getRedisClient(): Promise<RedisClient> {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error("REDIS_URL is not defined in environment variables");
    }

    redisClient = createClient({ url: redisUrl });

    redisClient.on("error", (err) => {
      log.error("Redis Client Error:", err);
    });

    redisClient.on("connect", () => {
      log.info("Redis Client Connected");
    });

    await redisClient.connect();
  }

  return redisClient;
}

export async function setToken<T = unknown>(
  key: string,
  value: T,
  expirySeconds?: number,
): Promise<void> {
  const client = await getRedisClient();
  const stringValue = typeof value === "string" ? value : JSON.stringify(value);

  if (expirySeconds) {
    await client.setEx(key, expirySeconds, stringValue);
  } else {
    await client.set(key, stringValue);
  }
}

export async function getToken<T = unknown>(key: string): Promise<T | null> {
  const client = await getRedisClient();
  const value = await client.get(key);

  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

export async function deleteToken(key: string): Promise<void> {
  const client = await getRedisClient();

  await client.del(key);
}
