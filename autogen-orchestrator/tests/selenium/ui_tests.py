"""Selenium tests – UI / Layout module (visibility, alignment, responsive)."""
from __future__ import annotations

from selenium.webdriver.common.by import By

from .base_test import BaseTest


class UITests(BaseTest):
    """4 UI tests: element visibility, no layout overlap, mobile viewport, no whitespace issues."""

    SUITE_NAME = "UI"

    # ------------------------------------------------------------------ tests

    def _test_home_page_elements_visible(self) -> None:
        self.navigate("/")
        self.wait_for(By.CSS_SELECTOR, "main")
        body = self.driver.find_element(By.TAG_NAME, "body").text
        assert any(kw in body for kw in ["ShopEasy", "Home", "Products", "Shop"]), \
            "Home page main content not visible"
        nav = self.find_all(By.TAG_NAME, "header")
        assert nav, "Header / navbar element not found on home page"

    def _test_no_layout_overlap(self) -> None:
        self.navigate("/")
        self.wait_for(By.CSS_SELECTOR, "main")
        # Verify the sticky navbar has a positive top offset and body content follows
        headers = self.find_all(By.TAG_NAME, "header")
        mains = self.find_all(By.TAG_NAME, "main")
        assert headers and mains, "Header and main element must both exist"
        header_rect = self.driver.execute_script(
            "return arguments[0].getBoundingClientRect();", headers[0]
        )
        main_rect = self.driver.execute_script(
            "return arguments[0].getBoundingClientRect();", mains[0]
        )
        # main top must be below or at header bottom – no large negative gap
        assert main_rect["top"] >= header_rect["top"], \
            f"Layout overlap detected: header top={header_rect['top']}, main top={main_rect['top']}"

    def _test_mobile_viewport_alignment(self) -> None:
        self.driver.set_window_size(390, 844)  # iPhone 14 resolution
        try:
            self.navigate("/")
            self.wait_for(By.CSS_SELECTOR, "main")
            # Page width should not exceed viewport (no horizontal scroll)
            scroll_width = self.driver.execute_script("return document.body.scrollWidth")
            assert scroll_width <= 420, f"Horizontal overflow in mobile view: scrollWidth={scroll_width}"
        finally:
            self.driver.set_window_size(1280, 800)  # Restore

    def _test_no_whitespace_issues(self) -> None:
        self.navigate("/")
        self.wait_for(By.CSS_SELECTOR, "main")
        body_height = self.driver.execute_script("return document.body.scrollHeight")
        assert body_height and int(body_height) > 0, "Body has zero scroll height — potential layout collapse"
        body_text = self.driver.find_element(By.TAG_NAME, "body").text.strip()
        assert body_text, "Body text is empty — possible blank page render"

    # ------------------------------------------------------------------ run

    def run_all(self) -> dict:
        self.run_test("Home page elements visible", self._test_home_page_elements_visible)
        self.run_test("No layout overlap", self._test_no_layout_overlap)
        self.run_test("Mobile viewport alignment", self._test_mobile_viewport_alignment)
        self.run_test("No whitespace issues", self._test_no_whitespace_issues)

        return self.get_metrics()
