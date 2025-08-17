import { test, expect } from "@playwright/test";
import fs from "fs";

type Json = Record<string, any>;

function loadDict(locale: string): Json {
  const path = `app/[lang]/dictionaries/${locale}.json`;
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function collectLeafKeys(obj: Json, prefix = ""): string[] {
  const keys: string[] = [];
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...collectLeafKeys(v, key));
    } else {
      keys.push(key);
    }
  }
  return keys;
}

function getValueByPath(obj: Json, path: string) {
  return path
    .split(".")
    .reduce((acc: any, part) => (acc ? acc[part] : undefined), obj);
}

test.describe("i18n dictionary coverage @unit", () => {
  test("ko and zh contain all en leaf keys with non-empty values", async () => {
    const en = loadDict("en");
    const ko = loadDict("ko");
    const zh = loadDict("zh");

    const enLeafKeys = collectLeafKeys(en);

    const checkLocale = (localeName: string, dict: Json) => {
      const missing: string[] = [];
      const empty: string[] = [];
      for (const key of enLeafKeys) {
        const val = getValueByPath(dict, key);
        if (val === undefined) {
          missing.push(key);
        } else if (typeof val === "string" && val.trim().length === 0) {
          empty.push(key);
        }
      }
      return { missing, empty };
    };

    const koCheck = checkLocale("ko", ko);
    const zhCheck = checkLocale("zh", zh);

    const errors: string[] = [];
    if (koCheck.missing.length) {
      errors.push(
        `ko missing keys (count=${koCheck.missing.length}):\n` +
          koCheck.missing.join("\n"),
      );
    }
    if (koCheck.empty.length) {
      errors.push(
        `ko empty keys (count=${koCheck.empty.length}):\n` +
          koCheck.empty.join("\n"),
      );
    }
    if (zhCheck.missing.length) {
      errors.push(
        `zh missing keys (count=${zhCheck.missing.length}):\n` +
          zhCheck.missing.join("\n"),
      );
    }
    if (zhCheck.empty.length) {
      errors.push(
        `zh empty keys (count=${zhCheck.empty.length}):\n` +
          zhCheck.empty.join("\n"),
      );
    }

    expect.soft(errors.join("\n\n")).toBe("");
  });
});
