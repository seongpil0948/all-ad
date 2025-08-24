import { test, expect } from "@playwright/test";
import { PLATFORM_TYPES, PlatformSchema } from "@/utils/platform";
import { Constants } from "@/types/supabase.types";

test.describe("Platform constants & schema", () => {
  test("PLATFORM_TYPES matches Supabase enum", () => {
    const supabaseEnum = Constants.public.Enums
      .platform_type as readonly string[];
    // Order-insensitive comparison
    const a = [...PLATFORM_TYPES].sort();
    const b = [...supabaseEnum].sort();
    expect(a).toEqual(b);
  });

  test("PlatformSchema parses each platform", () => {
    for (const p of PLATFORM_TYPES) {
      expect(() => PlatformSchema.parse(p)).not.toThrow();
    }
  });

  test("PlatformSchema rejects invalid platform", () => {
    expect(() => PlatformSchema.parse("not-a-platform")).toThrow();
  });
});
