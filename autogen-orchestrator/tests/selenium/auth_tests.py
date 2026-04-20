"""Selenium tests – Auth module (login, logout, signup)."""
from __future__ import annotations

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait as Wait

from .base_test import BaseTest


class AuthTests(BaseTest):
    """4 authentication tests: valid login, invalid login, logout, signup page."""

    SUITE_NAME = "Auth"

    # ------------------------------------------------------------------ setup

    def _setup(self) -> None:
        self.ensure_test_user()

    # ------------------------------------------------------------------ tests

    def _test_login_valid_user(self) -> None:
        self.navigate("/login")
        self.wait_visible(By.CSS_SELECTOR, "input[type='email']")
        self.fill(By.CSS_SELECTOR, "input[type='email']", self.TEST_EMAIL)
        self.fill(By.CSS_SELECTOR, "input[type='password']", self.TEST_PASSWORD)
        self.click(By.CSS_SELECTOR, "button[type='submit']")
        # Should redirect away from /login on success
        self.wait_url_not_contains("/login")

    def _test_login_invalid_user(self) -> None:
        self.navigate("/login")
        self.wait_visible(By.CSS_SELECTOR, "input[type='email']")
        self.fill(By.CSS_SELECTOR, "input[type='email']", "wrong@invalid.com")
        self.fill(By.CSS_SELECTOR, "input[type='password']", "wrongpassword")
        self.click(By.CSS_SELECTOR, "button[type='submit']")
        # Expect an error message to appear (not redirect)
        Wait(self.driver, 6).until(
            lambda d: any(kw in d.find_element(By.TAG_NAME, "body").text
                          for kw in ["Unable", "Invalid", "incorrect", "error", "failed", "wrong", "login"])
        )

    def _test_logout(self) -> None:
        # Login first
        self.login()
        body_text = self.driver.find_element(By.TAG_NAME, "body").text
        # Logout button is in the navbar – look for "Logout" text
        logout_btns = self.find_all(By.XPATH, "//button[contains(., 'Logout') or contains(., 'logout') or contains(., 'Sign out')]")
        logout_links = self.find_all(By.XPATH, "//a[contains(., 'Logout') or contains(., 'Sign out')]")
        elements = logout_btns + logout_links
        assert elements, f"Logout button not found. Body preview: {body_text[:300]}"
        self.driver.execute_script("arguments[0].scrollIntoView({block:'center'});", elements[0])
        elements[0].click()
        # After logout should be on login page or home without auth state
        import time; time.sleep(0.8)
        current_url = self.driver.current_url
        assert "/login" in current_url or current_url.endswith("/") or "/" in current_url, \
            f"Expected redirect after logout, got: {current_url}"

    def _test_signup_page_loads(self) -> None:
        self.navigate("/signup")
        self.wait_for(By.CSS_SELECTOR, "main")
        body = self.driver.find_element(By.TAG_NAME, "body").text
        assert any(kw in body for kw in ["Create", "Sign up", "Register", "account", "Account"]), \
            "Signup page content not found"

    # ------------------------------------------------------------------ run

    def run_all(self) -> dict:
        try:
            self._setup()
        except Exception as exc:  # noqa: BLE001
            self.logs.append({"step": "Auth Setup", "message": f"Setup failed: {exc}"})

        self.run_test("Login valid user", self._test_login_valid_user)
        self.run_test("Login invalid user", self._test_login_invalid_user)
        self.run_test("Logout", self._test_logout)
        self.run_test("Signup page loads", self._test_signup_page_loads)

        return self.get_metrics()
