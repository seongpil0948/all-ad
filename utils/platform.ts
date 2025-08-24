// Centralized platform utilities
// Provides runtime list and type guard for PlatformType enum coming from Supabase types

import { PlatformType } from "@/types";
import { z } from "zod";

export const PLATFORM_TYPES: readonly PlatformType[] = [
  "facebook",
  "google",
  "kakao",
  "naver",
  "coupang",
  "amazon",
  "tiktok",
] as const;

export function isPlatformType(value: string): value is PlatformType {
  return (PLATFORM_TYPES as readonly string[]).includes(value);
}

// Ensure exhaustive list stays aligned at build time via a helper (optional future use)
export function assertPlatform(value: string): PlatformType {
  if (!isPlatformType(value)) {
    throw new Error(`Invalid platform: ${value}`);
  }
  return value;
}

// Zod schemas for validation pipelines
export const PlatformSchema = z.enum(
  PLATFORM_TYPES as [PlatformType, ...PlatformType[]],
);

// Helper subset schemas (OAuth-enabled platforms etc.) can be composed here later
