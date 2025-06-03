import { createClient } from "redis";

import { Logger } from "@/utils/logger";

export type RedisClient = ReturnType<typeof createClient>;

let redisClient: RedisClient | null = null;

export async function getRedisClient(): Promise<RedisClient> {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error("REDIS_URL is not defined in environment variables");
    }

    redisClient = createClient({ url: redisUrl });

    redisClient.on("error", (err) => {
      Logger.error("Redis Client Error:", err);
    });

    redisClient.on("connect", () => {
      Logger.info("Redis Client Connected");
    });

    await redisClient.connect();
  }

  return redisClient;
}

export async function setToken(
  key: string,
  value: any,
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

export async function getToken(key: string): Promise<any> {
  const client = await getRedisClient();
  const value = await client.get(key);

  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export async function deleteToken(key: string): Promise<void> {
  const client = await getRedisClient();

  await client.del(key);
}
