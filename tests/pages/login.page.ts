import { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly signupLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.signupLink = page.getByRole("link", { name: "회원가입" });
    this.forgotPasswordLink = page.getByRole("link", {
      name: "비밀번호를 잊으셨나요?",
    });
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectError(message: string) {
    await this.errorMessage.waitFor({ state: "visible" });
    const text = await this.errorMessage.textContent();
    return text?.includes(message);
  }

  async isLoggedIn() {
    // Check if redirected to dashboard
    await this.page.waitForURL(/\/dashboard/, { timeout: 10000 });
    return this.page.url().includes("/dashboard");
  }
}
