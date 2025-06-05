import { PAGE_PATH } from "@/config/site";
import { test } from "../tester";

test("Page Navigate Test", async ({ page }) => {
  await page.goto(PAGE_PATH.landing);
  await page.getByRole("button", { name: "당월 프로모션 안내" }).click();

  await page.getByRole("heading", { name: "멤버십 프로모션" }).isVisible();
  await page.getByTestId("back-button").click();
  await page.getByRole("button", { name: "멤버십 프로모션 관리" }).click();
  await page
    .locator("div")
    .filter({ hasText: /^당월 멤버십전체$/ })
    .getByRole("button")
    .click();
  await page.getByRole("button", { name: "고마움" }).click();
  await page.getByRole("button", { name: "(5분마다 자동 갱신)" }).click();
  await page.getByText("멤버십 등급/혜택 보기(클릭)").click();
  await page
    .locator("div")
    .filter({ hasText: "멤버십 등급 혜택 보기" })
    .nth(3)
    .click();
  const page1Promise = page.waitForEvent("popup");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "이미지 다운받기" }).click();
  await page1Promise;
  await downloadPromise;
  await page.getByRole("button", { name: "확인" }).click();
  await page.getByTestId("back-button").click();
  await page.getByRole("button", { name: "멤버십 프로모션 관리" }).click();
  await page
    .getByRole("textbox", { name: "약국명 또는 약사명을 입력하세요" })
    .click();
  await page.getByTestId("back-button").click();
  await page.getByRole("button", { name: "직거래 프로모션 관리" }).click();
  await page.getByTestId("horizon-list-chip").click();
  await page
    .getByRole("alert")
    .filter({ hasText: "프로모션 정보 확인하기(클릭)" })
    .click();
  // await page.waitForURL(PAGE_PATH.promotionMonthInfo); // TODO: Add this path if needed
});
