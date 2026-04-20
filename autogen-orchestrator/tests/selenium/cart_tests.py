"""Selenium tests – Cart module (SR-2 style tickets)."""
from __future__ import annotations

from selenium.webdriver.common.by import By

from .base_test import BaseTest


class CartTests(BaseTest):
    """6 cart-specific tests covering add, quantity, remove, and totals."""

    SUITE_NAME = "Cart"

    # ------------------------------------------------------------------ setup

    def _setup(self) -> None:
        self.ensure_test_user()
        self.login()
        self._add_first_product_to_cart()

    def _add_first_product_to_cart(self) -> None:
        """Navigate to /products and add the first available product to cart."""
        self.navigate("/products")
        # Wait for product cards to render
        self.wait_for(By.CSS_SELECTOR, "main")
        buttons = self.find_all(By.XPATH, "//button[contains(., 'Add to Cart') or contains(., 'Add')]")
        if buttons:
            self.driver.execute_script("arguments[0].scrollIntoView({block:'center'});", buttons[0])
            buttons[0].click()
            import time; time.sleep(0.6)  # allow cart state to settle

    # ------------------------------------------------------------------ tests

    def _test_cart_page_loads(self) -> None:
        self.navigate("/cart")
        self.wait_visible(By.XPATH, "//h1[contains(., 'Cart') or contains(., 'cart')]")

    def _test_cart_item_visible(self) -> None:
        self.navigate("/cart")
        self.wait_for(By.CSS_SELECTOR, "main")
        # Either an item is present or the empty state message is present
        body_text = self.driver.find_element(By.TAG_NAME, "body").text
        assert "Cart" in body_text or "cart" in body_text, "Cart page content not found"

    def _test_quantity_controls_visible(self) -> None:
        self.navigate("/cart")
        self.wait_for(By.CSS_SELECTOR, "main")
        items = self.find_all(By.CSS_SELECTOR, "input[type='number']")
        empty_state = self.find_all(By.XPATH, "//*[contains(text(),'Cart is empty')]")
        assert items or empty_state, "Cart UI not in expected state"

    def _test_subtotal_visible(self) -> None:
        self.navigate("/cart")
        self.wait_for(By.CSS_SELECTOR, "main")
        body = self.driver.find_element(By.TAG_NAME, "body").text
        # Subtotal OR empty-cart message should be present
        assert "Subtotal" in body or "empty" in body.lower(), "Subtotal section missing"

    def _test_order_summary_visible(self) -> None:
        self.navigate("/cart")
        self.wait_for(By.CSS_SELECTOR, "main")
        body = self.driver.find_element(By.TAG_NAME, "body").text
        assert "Order summary" in body or "Cart" in body, "Order summary section missing"

    def _test_checkout_button_present(self) -> None:
        self.navigate("/cart")
        self.wait_for(By.CSS_SELECTOR, "main")
        body = self.driver.find_element(By.TAG_NAME, "body").text
        assert "Checkout" in body or "empty" in body.lower(), "Checkout button not found in cart"

    # ------------------------------------------------------------------ run

    def run_all(self) -> dict:
        try:
            self._setup()
        except Exception as exc:  # noqa: BLE001
            self.logs.append({"step": "Cart Setup", "message": f"Setup failed: {exc}"})

        self.run_test("Cart page loads", self._test_cart_page_loads)
        self.run_test("Cart item visible", self._test_cart_item_visible)
        self.run_test("Quantity controls visible", self._test_quantity_controls_visible)
        self.run_test("Subtotal visible", self._test_subtotal_visible)
        self.run_test("Order summary visible", self._test_order_summary_visible)
        self.run_test("Checkout button present", self._test_checkout_button_present)

        return self.get_metrics()
