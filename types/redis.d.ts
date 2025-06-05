// Redis 관련 타입 정의

import { createClient } from "redis";

export type RedisClient = ReturnType<typeof createClient>;
