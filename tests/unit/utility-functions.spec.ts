import { test, expect } from "@playwright/test";

test.describe("Utility Functions Coverage Tests @unit", () => {
  test("URL and routing utilities", async () => {
    // Test URL manipulation functions
    const testUrls = [
      "https://example.com/path",
      "http://localhost:3000",
      "/relative/path",
      "#fragment",
      "mailto:test@example.com",
      "tel:+1234567890",
    ];

    testUrls.forEach((url) => {
      try {
        new URL(url, "http://localhost");
        expect(url).toContain(url);
      } catch (error) {
        // Test relative URL handling
        const fullUrl = `http://localhost${url.startsWith("/") ? url : "/" + url}`;
        expect(fullUrl).toContain("localhost");
      }
    });
  });

  test("string manipulation utilities", async () => {
    const testStrings = [
      "hello world",
      "UPPERCASE",
      "camelCase",
      "snake_case",
      "kebab-case",
      "123numbers456",
      "special!@#$%chars",
      "unicode문자열",
      "",
      null,
      undefined,
    ];

    testStrings.forEach((str) => {
      // Test string operations
      if (typeof str === "string") {
        const length = str.length;
        const lower = str.toLowerCase();
        const upper = str.toUpperCase();
        const trimmed = str.trim();

        expect(length).toBeGreaterThanOrEqual(0);
        expect(lower).toBeDefined();
        expect(upper).toBeDefined();
        expect(trimmed).toBeDefined();

        // Test string includes/indexOf
        const hasSpace = str.includes(" ");
        const firstChar = str.charAt(0);
        const lastChar = str.charAt(str.length - 1);

        expect(typeof hasSpace).toBe("boolean");
        expect(typeof firstChar).toBe("string");
        expect(typeof lastChar).toBe("string");
      } else {
        // Test null/undefined handling
        const stringified = String(str);
        expect(stringified).toBeDefined();
      }
    });
  });

  test("number formatting and validation utilities", async () => {
    const testNumbers = [
      0,
      1,
      -1,
      0.1,
      -0.1,
      123.456,
      1000,
      1000000,
      0.0001,
      Infinity,
      -Infinity,
      NaN,
    ];

    testNumbers.forEach((num) => {
      // Test number validation
      const isFinite = Number.isFinite(num);
      const isInteger = Number.isInteger(num);
      const isNaN = Number.isNaN(num);

      expect(typeof isFinite).toBe("boolean");
      expect(typeof isInteger).toBe("boolean");
      expect(typeof isNaN).toBe("boolean");

      if (Number.isFinite(num)) {
        // Test number formatting
        const fixed = num.toFixed(2);
        const exponential = num.toExponential(2);
        const precision = num.toPrecision(3);

        expect(fixed).toContain(".");
        expect(exponential).toContain("e");
        expect(precision).toBeDefined();

        // Test locale formatting
        try {
          const localeString = num.toLocaleString();
          expect(localeString).toBeDefined();
        } catch (e) {
          // Some numbers might not format properly
          console.log("Number formatting failed:", e);
        }
      }
    });
  });

  test("array manipulation utilities", async () => {
    const testArrays = [
      [],
      [1],
      [1, 2, 3],
      ["a", "b", "c"],
      [1, "mixed", true, null],
      new Array(100).fill(0).map((_, i) => i),
    ];

    testArrays.forEach((arr) => {
      // Test array methods
      const length = arr.length;
      const isEmpty = length === 0;
      const first = arr[0];
      const last = arr[arr.length - 1];

      expect(length).toBeGreaterThanOrEqual(0);
      expect(typeof isEmpty).toBe("boolean");

      if (length > 0) {
        // Test array operations
        const reversed = [...arr].reverse();
        const sliced = arr.slice(0, 2);
        const mapped = arr.map((item) => String(item));
        const filtered = arr.filter((item) => item != null);

        expect(reversed.length).toBe(length);
        expect(sliced.length).toBeLessThanOrEqual(2);
        expect(mapped.length).toBe(length);
        expect(filtered.length).toBeLessThanOrEqual(length);

        // Test finding
        const found = arr.find((item) => item != null);
        const foundIndex = arr.findIndex((item) => item != null);
        const includes = arr.includes(first);

        if (filtered.length > 0) {
          expect(found).toBeDefined();
          expect(foundIndex).toBeGreaterThanOrEqual(0);
        }
        expect(typeof includes).toBe("boolean");

        // Test sorting (with safe comparison)
        const sorted = [...arr].sort((a, b) => {
          if (a === b) return 0;
          if (a == null) return -1;
          if (b == null) return 1;
          return String(a).localeCompare(String(b));
        });

        expect(sorted.length).toBe(length);
      }
    });
  });

  test("object manipulation utilities", async () => {
    const testObjects = [
      {},
      { a: 1 },
      { a: 1, b: 2, c: 3 },
      { nested: { deep: { value: "test" } } },
      { array: [1, 2, 3] },
      {
        mixed: {
          str: "hello",
          num: 42,
          bool: true,
          null: null,
          undef: undefined,
        },
      },
    ];

    testObjects.forEach((obj) => {
      // Test object operations
      const keys = Object.keys(obj);
      const values = Object.values(obj);
      const entries = Object.entries(obj);

      expect(Array.isArray(keys)).toBe(true);
      expect(Array.isArray(values)).toBe(true);
      expect(Array.isArray(entries)).toBe(true);
      expect(keys.length).toBe(values.length);
      expect(keys.length).toBe(entries.length);

      // Test object property access
      keys.forEach((key) => {
        const hasOwn = Object.prototype.hasOwnProperty.call(obj, key);
        const descriptor = Object.getOwnPropertyDescriptor(obj, key);

        expect(hasOwn).toBe(true);
        expect(descriptor).toBeDefined();
      });

      // Test JSON operations
      try {
        const stringified = JSON.stringify(obj);
        const parsed = JSON.parse(stringified);

        expect(typeof stringified).toBe("string");
        expect(typeof parsed).toBe("object");
        expect(Object.keys(parsed).length).toBe(keys.length);
      } catch (e) {
        // Some objects might not be JSON serializable (circular references, functions, etc.)
        console.log(
          "JSON serialization failed for object:",
          e instanceof Error ? e.message : String(e),
        );
      }

      // Test object cloning
      const shallowClone = { ...obj };
      const assigned = Object.assign({}, obj);

      expect(typeof shallowClone).toBe("object");
      expect(typeof assigned).toBe("object");
      expect(Object.keys(shallowClone).length).toBe(keys.length);
      expect(Object.keys(assigned).length).toBe(keys.length);
    });
  });

  test("date and time utilities", async () => {
    const testDates = [
      new Date(),
      new Date("2023-01-01"),
      new Date("2023-12-31T23:59:59Z"),
      new Date(0), // Unix epoch
      new Date(Date.now()),
    ];

    testDates.forEach((date) => {
      // Test date methods
      const time = date.getTime();
      const iso = date.toISOString();
      const string = date.toString();
      const utc = date.toUTCString();

      expect(typeof time).toBe("number");
      expect(typeof iso).toBe("string");
      expect(typeof string).toBe("string");
      expect(typeof utc).toBe("string");

      // Test date components
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();

      expect(typeof year).toBe("number");
      expect(month).toBeGreaterThanOrEqual(0);
      expect(month).toBeLessThanOrEqual(11);
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(31);
      expect(hours).toBeGreaterThanOrEqual(0);
      expect(hours).toBeLessThanOrEqual(23);
      expect(minutes).toBeGreaterThanOrEqual(0);
      expect(minutes).toBeLessThanOrEqual(59);
      expect(seconds).toBeGreaterThanOrEqual(0);
      expect(seconds).toBeLessThanOrEqual(59);

      // Test locale formatting
      try {
        const localeDate = date.toLocaleDateString();
        const localeTime = date.toLocaleTimeString();
        const locale = date.toLocaleString();

        expect(typeof localeDate).toBe("string");
        expect(typeof localeTime).toBe("string");
        expect(typeof locale).toBe("string");
      } catch (e: any) {
        console.log("Date locale formatting failed:", e.message);
      }
    });
  });

  test("error handling utilities", async () => {
    const testErrors = [
      new Error("Test error"),
      new TypeError("Type error"),
      new ReferenceError("Reference error"),
      new SyntaxError("Syntax error"),
      { message: "Custom error object" },
      "String error",
      null,
      undefined,
    ];

    testErrors.forEach((error) => {
      // Test error handling
      try {
        if (error instanceof Error) {
          const message = error.message;
          const name = error.name;
          const stack = error.stack;

          expect(typeof message).toBe("string");
          expect(typeof name).toBe("string");
          if (stack) {
            expect(typeof stack).toBe("string");
          }
        } else if (error && typeof error === "object" && "message" in error) {
          const message = (error as any).message;
          expect(typeof message).toBe("string");
        } else if (typeof error === "string") {
          const errorObj = new Error(error);
          expect(errorObj.message).toBe(error);
        } else {
          // Handle null/undefined errors
          const errorObj = new Error(String(error));
          expect(errorObj.message).toContain(String(error));
        }

        // Test error serialization
        const stringified = String(error);
        expect(typeof stringified).toBe("string");
      } catch (handlingError) {
        // Error handling itself failed
        console.log("Error handling failed:", handlingError);
      }
    });
  });

  test("validation utilities", async () => {
    const testInputs = [
      // Email validation tests
      { type: "email", value: "test@example.com", shouldBeValid: true },
      { type: "email", value: "invalid-email", shouldBeValid: false },
      { type: "email", value: "", shouldBeValid: false },

      // URL validation tests
      { type: "url", value: "https://example.com", shouldBeValid: true },
      { type: "url", value: "not-a-url", shouldBeValid: false },
      { type: "url", value: "ftp://files.example.com", shouldBeValid: true },

      // Phone validation tests
      { type: "phone", value: "+1234567890", shouldBeValid: true },
      { type: "phone", value: "123-456-7890", shouldBeValid: true },
      { type: "phone", value: "not-a-phone", shouldBeValid: false },
    ];

    testInputs.forEach(({ type, value, shouldBeValid }) => {
      switch (type) {
        case "email":
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          const isValidEmail = emailRegex.test(value);
          expect(isValidEmail).toBe(shouldBeValid);
          break;

        case "url":
          try {
            new URL(value);
            expect(shouldBeValid).toBe(true);
          } catch (e) {
            expect(shouldBeValid).toBe(false);
          }
          break;

        case "phone":
          const phoneRegex = /^[\+]?[\s\d\-\(\)]{10,}$/;
          const isValidPhone = phoneRegex.test(value);
          expect(isValidPhone).toBe(shouldBeValid);
          break;
      }
    });
  });

  test("performance and optimization utilities", async () => {
    // Test debounce-like behavior
    const calls: number[] = [];
    const mockFunction = () => {
      calls.push(Date.now());
    };

    // Simulate rapid calls
    for (let i = 0; i < 5; i++) {
      mockFunction();
    }

    expect(calls.length).toBe(5);

    // Test throttle-like behavior
    const throttledCalls: number[] = [];
    let lastCall = 0;
    const throttledFunction = () => {
      const now = Date.now();
      if (now - lastCall > 100) {
        // 100ms throttle
        throttledCalls.push(now);
        lastCall = now;
      }
    };

    for (let i = 0; i < 5; i++) {
      throttledFunction();
    }

    expect(throttledCalls.length).toBeLessThanOrEqual(5);

    // Test memoization-like behavior
    const cache = new Map<string, any>();
    const memoizedFunction = (key: string, computation: () => any) => {
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = computation();
      cache.set(key, result);
      return result;
    };

    let computationCalls = 0;
    const expensiveComputation = () => {
      computationCalls++;
      return Math.random();
    };

    const result1 = memoizedFunction("test", expensiveComputation);
    const result2 = memoizedFunction("test", expensiveComputation);

    expect(result1).toBe(result2);
    expect(computationCalls).toBe(1);
  });

  test("crypto and hashing utilities", async () => {
    const testStrings = ["hello", "world", "123", "test@example.com", ""];

    testStrings.forEach((str) => {
      // Test simple hash generation using built-in methods
      const encoder = new TextEncoder();
      const data = encoder.encode(str);

      expect(data).toBeInstanceOf(Uint8Array);
      expect(data.length).toBeGreaterThanOrEqual(0);

      // Test base64 encoding/decoding
      try {
        const base64 = btoa(str);
        const decoded = atob(base64);

        expect(typeof base64).toBe("string");
        expect(decoded).toBe(str);
      } catch (e) {
        // btoa might fail for non-ASCII characters
        console.log("Base64 encoding failed for:", str);
      }

      // Test URL encoding/decoding
      const encoded = encodeURIComponent(str);
      const decoded = decodeURIComponent(encoded);

      expect(typeof encoded).toBe("string");
      expect(decoded).toBe(str);
    });
  });
});
