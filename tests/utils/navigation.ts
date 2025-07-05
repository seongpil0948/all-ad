import type { Page } from "@playwright/test";

export const LANG = "ko"; // 테스트에서 사용할 기본 언어

/**
 * 언어가 포함된 URL로 이동합니다.
 */
export async function gotoWithLang(page: Page, path: string) {
  // path가 빈 문자열이면 루트로, 아니면 앞에 '/'를 추가
  const normalizedPath = path === "" ? "" : `/${path}`;
  const urlWithLang = `/${LANG}${normalizedPath}`;
  await page.goto(urlWithLang, { waitUntil: "networkidle" });
  return urlWithLang;
}

/**
 * 언어가 포함된 URL 패턴을 생성합니다.
 */
export function urlWithLangPattern(path: string) {
  // path가 빈 문자열이면 루트로, 아니면 앞에 '/'를 추가
  const normalizedPath = path === "" ? "" : `/${path}`;
  return new RegExp(`\\/(en|ko)${normalizedPath.replace(/\//g, "\\/")}`);
}

/**
 * 현재 페이지가 예상된 path에 있는지 확인합니다.
 */
export async function expectUrl(page: Page, path: string) {
  const pattern = urlWithLangPattern(path);
  await page.waitForURL(pattern, { timeout: 15000 });
  return pattern;
}
