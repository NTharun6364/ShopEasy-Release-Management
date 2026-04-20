"""Base Selenium test class for ShopEasy QAAgent automation."""
from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Callable

SCREENSHOTS_DIR = Path(__file__).resolve().parents[3] / "screenshots"

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service as ChromeService
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.support.ui import WebDriverWait as Wait
    from webdriver_manager.chrome import ChromeDriverManager

    # Allow disabling Selenium via env var so the API returns fast mock results
    SELENIUM_AVAILABLE = os.getenv("SELENIUM_ENABLED", "false").lower() == "true"
except ImportError:
    SELENIUM_AVAILABLE = False


def create_driver() -> "webdriver.Chrome":
    """Create a headless Chrome WebDriver instance."""
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1280,800")
    options.add_argument("--disable-extensions")
    options.add_argument("--log-level=3")
    options.add_experimental_option("excludeSwitches", ["enable-logging"])

    # Pin ChromeDriver to the exact installed Chrome version to avoid mismatches
    chrome_version = "147.0.7727.56"
    service = ChromeService(ChromeDriverManager(driver_version=chrome_version).install())
    return webdriver.Chrome(service=service, options=options)


class BaseTest:
    """Base class shared by all ShopEasy Selenium test suites."""

    SUITE_NAME: str = "Base"

    BASE_URL: str = os.getenv("SHOPEASY_FRONTEND_URL", "http://localhost:5173")
    BACKEND_URL: str = os.getenv("SHOPEASY_BACKEND_URL", "http://localhost:5000")
    TEST_EMAIL: str = os.getenv("SHOPEASY_TEST_EMAIL", "testqa@shopeasy.com")
    TEST_PASSWORD: str = os.getenv("SHOPEASY_TEST_PASSWORD", "TestQA1234!")
    ADMIN_EMAIL: str = os.getenv("SHOPEASY_ADMIN_EMAIL", "admin_qa@shopeasy.com")
    ADMIN_PASSWORD: str = os.getenv("SHOPEASY_ADMIN_PASSWORD", "AdminQA1234!")

    def __init__(self, driver: "webdriver.Chrome") -> None:
        self.driver = driver
        self.driver.implicitly_wait(6)
        self.results: list[dict] = []
        self.logs: list[dict] = []
        self.screenshots: list[str] = []

    # ------------------------------------------------------------------ helpers

    def navigate(self, path: str = "") -> None:
        self.driver.get(f"{self.BASE_URL}{path}")

    def wait_for(self, by: str, selector: str, timeout: int = 8):
        return Wait(self.driver, timeout).until(EC.presence_of_element_located((by, selector)))

    def wait_visible(self, by: str, selector: str, timeout: int = 8):
        return Wait(self.driver, timeout).until(EC.visibility_of_element_located((by, selector)))

    def wait_url_contains(self, pattern: str, timeout: int = 8) -> None:
        Wait(self.driver, timeout).until(lambda d: pattern in d.current_url)

    def wait_url_not_contains(self, pattern: str, timeout: int = 8) -> None:
        Wait(self.driver, timeout).until(lambda d: pattern not in d.current_url)

    def find(self, by: str, selector: str):
        return self.driver.find_element(by, selector)

    def find_all(self, by: str, selector: str) -> list:
        return self.driver.find_elements(by, selector)

    def click(self, by: str, selector: str) -> None:
        element = self.wait_visible(by, selector)
        self.driver.execute_script("arguments[0].scrollIntoView({block:'center'});", element)
        element.click()

    def fill(self, by: str, selector: str, value: str) -> None:
        element = self.wait_visible(by, selector)
        element.clear()
        element.send_keys(value)

    # ------------------------------------------------------------------ auth

    def login(self, email: str | None = None, password: str | None = None) -> None:
        """Login via UI form and wait for redirect away from /login."""
        import time as _time
        self.navigate("/login")
        _time.sleep(1.5)  # wait for React to hydrate

        # React controlled inputs require simulating native input events
        # so React's onChange synthetic handler fires and updates state
        def set_react_input(css_selector: str, value: str) -> None:
            el = self.wait_visible(By.CSS_SELECTOR, css_selector)
            self.driver.execute_script("""
                var el = arguments[0], val = arguments[1];
                var nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype, 'value').set;
                nativeInputValueSetter.call(el, val);
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            """, el, value)

        set_react_input("input[type='email']", email or self.TEST_EMAIL)
        set_react_input("input[type='password']", password or self.TEST_PASSWORD)
        _time.sleep(0.3)
        self.click(By.CSS_SELECTOR, "button[type='submit']")
        self.wait_url_not_contains("/login")

    def ensure_test_user(self) -> None:
        """Register the test user if they don't already exist (via REST API)."""
        try:
            import requests

            requests.post(
                f"{self.BACKEND_URL}/api/auth/register",
                json={"name": "QA Test User", "email": self.TEST_EMAIL, "password": self.TEST_PASSWORD},
                timeout=4,
            )
        except Exception:
            pass  # user already exists or backend not reachable

    def ensure_admin_user(self) -> None:
        """Register the admin test user if they don't already exist."""
        try:
            import requests

            requests.post(
                f"{self.BACKEND_URL}/api/auth/register",
                json={
                    "name": "QA Admin User",
                    "email": self.ADMIN_EMAIL,
                    "password": self.ADMIN_PASSWORD,
                    "isAdmin": True,
                },
                timeout=4,
            )
        except Exception:
            pass

    # ------------------------------------------------------------------ runner

    def run_test(self, name: str, fn: Callable, retries: int = 1) -> None:
        """Run a single test fn with retry logic and screenshot on failure."""
        last_error: Exception | None = None

        for attempt in range(retries + 1):
            try:
                fn()
                self.results.append({"name": name, "status": "passed"})
                self.logs.append({"step": f"[{self.SUITE_NAME}] {name}", "message": f"PASS: {name}"})
                return
            except Exception as exc:  # noqa: BLE001
                last_error = exc
                if attempt < retries:
                    time.sleep(0.8)

        screenshot_path = self._capture_screenshot(name)
        self.results.append({"name": name, "status": "failed", "error": str(last_error)})
        self.logs.append(
            {
                "step": f"[{self.SUITE_NAME}] {name}",
                "message": f"FAIL: {name} — {str(last_error)[:150]}",
            }
        )
        if screenshot_path:
            self.screenshots.append(screenshot_path)

    def _capture_screenshot(self, name: str) -> str:
        try:
            SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
            filename = SCREENSHOTS_DIR / f"{self.SUITE_NAME}_{name}_{int(time.time())}.png"
            self.driver.save_screenshot(str(filename))
            return str(filename)
        except Exception:  # noqa: BLE001
            return ""

    def get_metrics(self) -> dict:
        passed = sum(1 for r in self.results if r["status"] == "passed")
        failed = len(self.results) - passed
        return {
            "totalTests": len(self.results),
            "passed": passed,
            "failed": failed,
            "results": self.results,
            "screenshots": self.screenshots,
            "logs": self.logs,
        }

    def run_all(self) -> dict:  # noqa: D102
        raise NotImplementedError
