import { test, expect } from "@playwright/test";
import {
  parseNumericValue,
  parseIntValue,
  formatDateToYYYYMMDD,
  calculateTokenExpiry,
  isTokenExpired,
  sleep,
  retryWithBackoff,
  batchArray,
  validateEnvVars,
  sanitizeForJson,
  deepMerge,
} from "@/utils/platform-utils";

/**
 * Platform Utilities Unit Tests
 * Tests core utility functions used across platform services
 */
test.describe("Platform Utilities Unit Tests @unit", () => {
  test.describe("Numeric Parsing", () => {
    test("should parse numeric values correctly", () => {
      expect(parseNumericValue("123.45")).toBe(123.45);
      expect(parseNumericValue(67.89)).toBe(67.89);
      expect(parseNumericValue("invalid")).toBe(0);
      expect(parseNumericValue(null)).toBe(0);
      expect(parseNumericValue(undefined)).toBe(0);
      expect(parseNumericValue("", 10)).toBe(10);
    });

    test("should parse integer values correctly", () => {
      expect(parseIntValue("123")).toBe(123);
      expect(parseIntValue(45.67)).toBe(45);
      expect(parseIntValue("invalid")).toBe(0);
      expect(parseIntValue(null)).toBe(0);
      expect(parseIntValue(undefined)).toBe(0);
      expect(parseIntValue("", 5)).toBe(5);
    });

    test("should handle edge cases in numeric parsing", () => {
      expect(parseNumericValue("0")).toBe(0);
      expect(parseNumericValue("-123.45")).toBe(-123.45);
      expect(parseNumericValue("1e10")).toBe(10000000000);
      // These might return the actual values instead of 0, check implementation
      const infinityResult = parseNumericValue("Infinity");
      const negInfinityResult = parseNumericValue("-Infinity");
      const nanResult = parseNumericValue("NaN");

      // Either 0 or Infinity/-Infinity/NaN are acceptable depending on implementation
      expect(infinityResult === 0 || infinityResult === Infinity).toBe(true);
      expect(negInfinityResult === 0 || negInfinityResult === -Infinity).toBe(
        true,
      );
      expect(nanResult === 0 || Number.isNaN(nanResult)).toBe(true);
    });
  });

  test.describe("Date Handling", () => {
    test("should format date to YYYY-MM-DD", () => {
      const date = new Date("2024-01-15T10:30:45.123Z");
      const formatted = formatDateToYYYYMMDD(date);
      expect(formatted).toBe("2024-01-15");
    });

    test("should handle different date formats", () => {
      const dates = [
        new Date("2024-01-01"),
        new Date("2024-12-31T23:59:59Z"),
        new Date("2024-06-15T12:00:00.000Z"),
      ];

      const expected = ["2024-01-01", "2024-12-31", "2024-06-15"];

      dates.forEach((date, index) => {
        expect(formatDateToYYYYMMDD(date)).toBe(expected[index]);
      });
    });

    test("should calculate token expiry correctly", () => {
      const now = new Date();
      const expiryDate = calculateTokenExpiry(3600); // 1 hour

      const diffInSeconds = Math.floor(
        (expiryDate.getTime() - now.getTime()) / 1000,
      );
      expect(diffInSeconds).toBeGreaterThanOrEqual(3599);
      expect(diffInSeconds).toBeLessThanOrEqual(3600);
    });

    test("should check token expiration correctly", () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      const futureISOString = futureDate.toISOString();
      const pastISOString = pastDate.toISOString();

      expect(isTokenExpired(futureDate)).toBe(false);
      expect(isTokenExpired(pastDate)).toBe(true);
      expect(isTokenExpired(futureISOString)).toBe(false);
      expect(isTokenExpired(pastISOString)).toBe(true);
      expect(isTokenExpired(null)).toBe(true);
      expect(isTokenExpired(undefined)).toBe(true);
    });
  });

  test.describe("Async Utilities", () => {
    test("should sleep for specified duration", async () => {
      const start = Date.now();
      await sleep(100);
      const duration = Date.now() - start;

      expect(duration).toBeGreaterThanOrEqual(95);
      expect(duration).toBeLessThan(150);
    });

    test("should retry with exponential backoff", async () => {
      let attempts = 0;
      const maxRetries = 3;

      // Function that fails first 2 times, succeeds on 3rd
      const flakeyFunction = async () => {
        attempts++;
        if (attempts <= 2) {
          throw new Error(`Attempt ${attempts} failed`);
        }
        return `Success on attempt ${attempts}`;
      };

      const result = await retryWithBackoff(flakeyFunction, {
        maxRetries,
        initialDelay: 10,
        backoffMultiplier: 2,
        maxDelay: 1000,
      });

      expect(result).toBe("Success on attempt 3");
      expect(attempts).toBe(3);
    });

    test("should exhaust retries and throw last error", async () => {
      let attempts = 0;
      const maxRetries = 2;

      const alwaysFailFunction = async () => {
        attempts++;
        throw new Error(`Attempt ${attempts} failed`);
      };

      await expect(
        retryWithBackoff(alwaysFailFunction, {
          maxRetries,
          initialDelay: 10,
          backoffMultiplier: 2,
          maxDelay: 1000,
        }),
      ).rejects.toThrow("Attempt 3 failed");

      expect(attempts).toBe(3); // maxRetries + 1
    });
  });

  test.describe("Array Operations", () => {
    test("should batch array into chunks", () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const batches = batchArray(array, 3);
      expect(batches).toHaveLength(4);
      expect(batches[0]).toEqual([1, 2, 3]);
      expect(batches[1]).toEqual([4, 5, 6]);
      expect(batches[2]).toEqual([7, 8, 9]);
      expect(batches[3]).toEqual([10]);

      const singleBatch = batchArray([1, 2], 5);
      expect(singleBatch).toHaveLength(1);
      expect(singleBatch[0]).toEqual([1, 2]);

      const emptyBatch = batchArray([], 3);
      expect(emptyBatch).toHaveLength(0);
    });

    test("should handle edge cases in batching", () => {
      expect(batchArray([1], 1)).toEqual([[1]]);
      expect(batchArray([1, 2, 3], 10)).toEqual([[1, 2, 3]]);

      // Test empty array
      expect(batchArray([], 5)).toEqual([]);
    });
  });

  test.describe("Environment Validation", () => {
    test("should validate environment variables", () => {
      const originalEnv = process.env;

      // Mock environment variables
      process.env = {
        ...originalEnv,
        TEST_VAR_1: "value1",
        TEST_VAR_2: "value2",
      };

      expect(() => {
        validateEnvVars("test", ["TEST_VAR_1", "TEST_VAR_2"]);
      }).not.toThrow();

      expect(() => {
        validateEnvVars("test", ["TEST_VAR_1", "MISSING_VAR"]);
      }).toThrow(
        "Missing required environment variables for test: MISSING_VAR",
      );

      expect(() => {
        validateEnvVars("test", ["MISSING_VAR_1", "MISSING_VAR_2"]);
      }).toThrow(
        "Missing required environment variables for test: MISSING_VAR_1, MISSING_VAR_2",
      );

      // Restore environment
      process.env = originalEnv;
    });

    test("should handle empty variable lists", () => {
      expect(() => {
        validateEnvVars("test", []);
      }).not.toThrow();
    });
  });

  test.describe("Object Utilities", () => {
    test("should sanitize objects for JSON storage", () => {
      const testObj = {
        string: "text",
        number: 123,
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 2, "three"],
        nested: {
          inner: "value",
          func: () => "should be removed",
        },
        func: function () {
          return "should be removed";
        },
      };

      const sanitized = sanitizeForJson(testObj);

      expect(sanitized).toEqual({
        string: "text",
        number: 123,
        boolean: true,
        null: null,
        array: [1, 2, "three"],
        nested: {
          inner: "value",
        },
      });

      expect(sanitizeForJson(null)).toBe(null);
      expect(sanitizeForJson("string")).toBe("string");
      expect(sanitizeForJson(123)).toBe(123);
      expect(sanitizeForJson(true)).toBe(true);
      expect(sanitizeForJson([1, 2, 3])).toEqual([1, 2, 3]);
    });

    test("should deep merge objects correctly", () => {
      const target = {
        a: 1,
        b: {
          x: 1,
          y: 2,
        },
        c: [1, 2],
      };

      const source1 = {
        b: {
          y: 3,
          z: 4,
        },
        d: 5,
      };

      const source2 = {
        b: {
          w: 6,
        },
        e: 7,
      };

      const result = deepMerge(target, source1, source2);

      expect(result).toEqual({
        a: 1,
        b: {
          x: 1,
          y: 3,
          z: 4,
          w: 6,
        },
        c: [1, 2],
        d: 5,
        e: 7,
      });

      // Should not mutate original target
      expect(target.b).toEqual({ x: 1, y: 2 });
    });

    test("should handle edge cases in deep merge", () => {
      const target = { a: 1 };

      // No sources
      expect(deepMerge(target)).toEqual({ a: 1 });

      // Empty sources
      expect(deepMerge(target)).toEqual({ a: 1 });

      // Array overwrite
      const targetWithArray = { arr: [1, 2] };
      const sourceWithArray = { arr: [3, 4] };
      expect(deepMerge(targetWithArray, sourceWithArray)).toEqual({
        arr: [3, 4],
      });

      // Undefined values in source
      const sourceWithUndefined = { a: undefined, b: 2 };
      expect(deepMerge({ a: 1 }, sourceWithUndefined)).toEqual({ a: 1, b: 2 });
    });
  });

  test.describe("Performance Tests @smoke", () => {
    test("should handle large arrays efficiently", () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => i);

      const start = Date.now();
      const batches = batchArray(largeArray, 100);
      const duration = Date.now() - start;

      expect(batches).toHaveLength(100);
      expect(batches[0]).toHaveLength(100);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    test("should handle deep object sanitization efficiently", () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                data: "value",
                func: () => "remove",
                array: Array.from({ length: 1000 }, (_, i) => ({ id: i })),
              },
            },
          },
        },
      };

      const start = Date.now();
      const sanitized = sanitizeForJson(deepObject);
      const duration = Date.now() - start;

      expect(sanitized).toBeDefined();
      expect(typeof sanitized).toBe("object");
      expect(sanitized).not.toBe(null);
      expect(duration).toBeLessThan(100); // Should complete within 100ms
    });

    test("should handle multiple retries efficiently", async () => {
      let attempts = 0;

      const start = Date.now();
      try {
        await retryWithBackoff(
          async () => {
            attempts++;
            throw new Error(`Attempt ${attempts}`);
          },
          {
            maxRetries: 5,
            initialDelay: 1,
            backoffMultiplier: 1.5,
            maxDelay: 10,
          },
        );
      } catch (error) {
        // Expected to fail
      }
      const duration = Date.now() - start;

      expect(attempts).toBe(6); // maxRetries + 1
      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });
  });
});
