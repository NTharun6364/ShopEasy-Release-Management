"""SeleniumRunner – universal test dispatcher for ShopEasy QA automation.

Maps a Jira ticket (summary + description) to the appropriate Selenium test
suite, executes it with a headless Chrome driver, and returns structured QA
metrics ready for the release decision engine.
"""
from __future__ import annotations

import os
import re
import time
from typing import Any

# Module keyword map – order matters: more specific entries come first.
MODULE_KEYWORDS: dict[str, list[str]] = {
    "cart": [
        "cart", "quantity", "add to cart", "remove item", "subtotal",
        "grand total", "cart total", "item total", "basket",
    ],
    "checkout": [
        "checkout", "payment", "address", "order form", "shipping",
        "place order", "billing", "delivery address",
    ],
    "auth": [
        "login", "logout", "auth", "password", "forgot password",
        "signup", "sign up", "register", "registration", "session",
        "credential", "sign in",
    ],
    "product": [
        "product", "search", "catalog", "listing", "product detail",
        "item detail", "sku", "product page", "product list",
    ],
    "admin": [
        "admin", "order status", "manage order", "staff", "admin panel",
        "admin dashboard", "order management", "product management",
    ],
    "ui": [
        "layout", "ui bug", "responsive", "alignment", "overlap",
        "whitespace", "display", "css", "design", "mobile", "desktop",
        "visual", "rendering",
    ],
}

# Maps detected module key → test class path
MODULE_SUITE_MAP: dict[str, str] = {
    "cart": "tests.selenium.cart_tests.CartTests",
    "checkout": "tests.selenium.checkout_tests.CheckoutTests",
    "auth": "tests.selenium.auth_tests.AuthTests",
    "product": "tests.selenium.product_tests.ProductTests",
    "admin": "tests.selenium.admin_tests.AdminTests",
    "ui": "tests.selenium.ui_tests.UITests",
}

# Estimated base coverages per module (reflects test depth)
MODULE_COVERAGE_BASE: dict[str, float] = {
    "cart": 94.0,
    "checkout": 88.0,
    "auth": 92.0,
    "product": 85.0,
    "admin": 80.0,
    "ui": 78.0,
}


class SeleniumRunner:
    """Universal Selenium test runner for ShopEasy release QA."""

    # ------------------------------------------------------------------ public

    def run(self, ticket_id: str, summary: str, description: str) -> dict[str, Any]:
        """
        Detect module, execute test suite, return structured QA metrics.

        Returns a dict compatible with the release scorecard QA section.
        """
        from tests.selenium.base_test import SELENIUM_AVAILABLE

        module = self._detect_module(summary, description)
        suite_label = MODULE_SUITE_MAP.get(module, MODULE_SUITE_MAP["product"])

        if not SELENIUM_AVAILABLE:
            return self._build_unavailable_result(ticket_id, module, suite_label)

        if not self._is_app_reachable():
            return self._build_app_unreachable_result(ticket_id, module, suite_label)

        return self._execute_suite(ticket_id, module, suite_label)

    # ------------------------------------------------------------------ detection

    @staticmethod
    def _detect_module(summary: str, description: str) -> str:
        """Return the best-matching module key for the given ticket text."""
        combined = f"{summary} {description}".lower()

        for module, keywords in MODULE_KEYWORDS.items():
            if any(re.search(r"\b" + re.escape(kw) + r"\b", combined) for kw in keywords):
                return module

        return "product"  # sensible default

    # ------------------------------------------------------------------ execution

    def _execute_suite(self, ticket_id: str, module: str, suite_label: str) -> dict[str, Any]:
        """Instantiate driver, run the suite, return metrics."""
        from tests.selenium.base_test import create_driver

        driver = None
        start = time.time()

        try:
            driver = create_driver()
            test_class = self._load_class(suite_label)
            suite = test_class(driver)

            raw = suite.run_all()

            elapsed = round(time.time() - start, 1)
            return self._build_result(ticket_id, module, suite_label, raw, elapsed)

        except Exception as exc:  # noqa: BLE001
            elapsed = round(time.time() - start, 1)
            return self._build_error_result(ticket_id, module, suite_label, exc, elapsed)

        finally:
            if driver:
                try:
                    driver.quit()
                except Exception:  # noqa: BLE001
                    pass

    # ------------------------------------------------------------------ helpers

    @staticmethod
    def _load_class(dotted_path: str):
        """Import and return a class from a dotted module path."""
        module_path, class_name = dotted_path.rsplit(".", 1)
        import importlib

        module = importlib.import_module(module_path)
        return getattr(module, class_name)

    @staticmethod
    def _is_app_reachable() -> bool:
        """Quick HEAD request to check if the ShopEasy frontend is up."""
        try:
            import requests

            url = os.getenv("SHOPEASY_FRONTEND_URL", "http://localhost:5173")
            resp = requests.get(url, timeout=3)
            return resp.status_code < 500
        except Exception:  # noqa: BLE001
            return False

    @staticmethod
    def _compute_coverage(passed: int, total: int, module: str) -> float:
        """Estimate coverage from pass rate and module base coverage."""
        if total == 0:
            return 0.0
        pass_rate = passed / total
        base = MODULE_COVERAGE_BASE.get(module, 80.0)
        return round(min(99.9, base * pass_rate + (1 - pass_rate) * max(0, base - 20)), 1)

    @staticmethod
    def _make_decision(qa_status: str, failed: int, coverage: float) -> str:
        if qa_status == "Passed" and failed == 0 and coverage >= 88.0:
            return "QA Passed - Ready for Release"
        if qa_status == "Failed" or failed > 0:
            return "QA Failed - Fix Required"
        return "QA In Progress - Awaiting Completion"

    def _build_result(
        self,
        ticket_id: str,
        module: str,
        suite_label: str,
        raw: dict,
        elapsed: float,
    ) -> dict[str, Any]:
        total = raw["totalTests"]
        passed = raw["passed"]
        failed = raw["failed"]
        coverage = self._compute_coverage(passed, total, module)
        qa_status = "Passed" if failed == 0 and total > 0 else ("Failed" if failed > 0 else "In Progress")
        decision = self._make_decision(qa_status, failed, coverage)

        suite_name = suite_label.rsplit(".", 1)[-1]
        logs = [
            {"step": "SeleniumRunner -> Module Detector", "message": f"Ticket {ticket_id}: detected module '{module}'."},
            {"step": f"SeleniumRunner -> {suite_name}", "message": f"Loaded suite {suite_name}, running {total} tests."},
            *raw.get("logs", []),
            {"step": "SeleniumRunner -> Metrics", "message": (
                f"Passed {passed}/{total}, failed {failed}, coverage {coverage}%, time {elapsed}s."
            )},
            {"step": "SeleniumRunner -> Decision", "message": f"Final QA decision: {decision}"},
        ]

        return {
            "ticketId": ticket_id,
            "module": module.capitalize(),
            "suiteName": suite_name,
            "framework": "Selenium",
            "qaStatus": qa_status,
            "totalTests": total,
            "passed": passed,
            "failed": failed,
            "coverage": coverage,
            "executionTime": f"{elapsed}s",
            "decision": decision,
            "screenshots": raw.get("screenshots", []),
            "logs": logs,
            "agent": "QAAgent",
        }

    @staticmethod
    def _build_unavailable_result(ticket_id: str, module: str, suite_label: str) -> dict[str, Any]:
        suite_name = suite_label.rsplit(".", 1)[-1]
        return {
            "ticketId": ticket_id,
            "module": module.capitalize(),
            "suiteName": suite_name,
            "framework": "Selenium",
            "qaStatus": "Unavailable",
            "totalTests": 0,
            "passed": 0,
            "failed": 0,
            "coverage": 0.0,
            "executionTime": "0s",
            "decision": "QA Unavailable - Install selenium and webdriver-manager to enable",
            "screenshots": [],
            "logs": [
                {
                    "step": "SeleniumRunner -> Dependency Check",
                    "message": "selenium or webdriver-manager not installed. Run: pip install selenium webdriver-manager",
                }
            ],
            "agent": "QAAgent",
        }

    @staticmethod
    def _build_app_unreachable_result(ticket_id: str, module: str, suite_label: str) -> dict[str, Any]:
        frontend_url = os.getenv("SHOPEASY_FRONTEND_URL", "http://localhost:5173")
        suite_name = suite_label.rsplit(".", 1)[-1]
        return {
            "ticketId": ticket_id,
            "module": module.capitalize(),
            "suiteName": suite_name,
            "framework": "Selenium",
            "qaStatus": "App Offline",
            "totalTests": 0,
            "passed": 0,
            "failed": 0,
            "coverage": 0.0,
            "executionTime": "0s",
            "decision": f"QA Skipped - ShopEasy app not reachable at {frontend_url}",
            "screenshots": [],
            "logs": [
                {
                    "step": "SeleniumRunner -> App Health",
                    "message": f"ShopEasy frontend not reachable at {frontend_url}. Start the app to run Selenium tests.",
                }
            ],
            "agent": "QAAgent",
        }

    @staticmethod
    def _build_error_result(
        ticket_id: str, module: str, suite_label: str, exc: Exception, elapsed: float
    ) -> dict[str, Any]:
        suite_name = suite_label.rsplit(".", 1)[-1]
        return {
            "ticketId": ticket_id,
            "module": module.capitalize(),
            "suiteName": suite_name,
            "framework": "Selenium",
            "qaStatus": "Error",
            "totalTests": 0,
            "passed": 0,
            "failed": 0,
            "coverage": 0.0,
            "executionTime": f"{elapsed}s",
            "decision": f"QA Error - {str(exc)[:120]}",
            "screenshots": [],
            "logs": [
                {
                    "step": "SeleniumRunner -> Error",
                    "message": f"Suite execution failed: {str(exc)[:200]}",
                }
            ],
            "agent": "QAAgent",
        }
