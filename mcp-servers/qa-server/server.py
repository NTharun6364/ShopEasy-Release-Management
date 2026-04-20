"""MCP QA Server for ShopEasy Release Management System.

Exposes four MCP-style tools over the Selenium test infrastructure:

  run_test_suite(ticketId)   – detect module, execute Selenium suite, cache result
  get_test_result(ticketId)  – return last cached test outcome for a ticket
  get_coverage(ticketId)     – return coverage percentage for a ticket
  get_failure_logs(ticketId) – return failure logs + screenshot paths for a ticket

The server is loaded dynamically by QAAgent (same pattern as Jira/Git MCP servers).
Results are cached in-process so repeated tool calls within one orchestration
cycle don't rerun the full browser suite unnecessarily.
"""
from __future__ import annotations

import importlib.util
import os
import sys
import time
from pathlib import Path
from typing import Any


# ---------------------------------------------------------------------------
# Custom exceptions
# ---------------------------------------------------------------------------

class QAMCPError(Exception):
    """Base exception for QA MCP failures."""


class QAMCPToolError(QAMCPError):
    """Raised when an unknown tool is requested."""


class QAMCPRunError(QAMCPError):
    """Raised when a Selenium suite execution fails unexpectedly."""


# ---------------------------------------------------------------------------
# Server
# ---------------------------------------------------------------------------

class QAMCPServer:
    """MCP-style QA server backed by the SeleniumRunner + Jira context."""

    TOOLS: list[str] = [
        "run_test_suite",
        "get_test_result",
        "get_coverage",
        "get_failure_logs",
    ]

    def __init__(self) -> None:
        # Add autogen-orchestrator directory to path so internal imports resolve
        self._orchestrator_root = Path(__file__).resolve().parents[2] / "autogen-orchestrator"
        if str(self._orchestrator_root) not in sys.path:
            sys.path.insert(0, str(self._orchestrator_root))

        # Lazy-load SeleniumRunner to avoid heavy import cost at module scope
        self._runner_module: Any | None = None
        self._runner: Any | None = None

        # Result cache: ticketId (normalised upper) -> full result dict
        self._cache: dict[str, dict[str, Any]] = {}

    # ------------------------------------------------------------------ tools

    def run_test_suite(self, ticket_id: str, *, summary: str = "", description: str = "") -> dict[str, Any]:
        """
        Detect the ShopEasy module for *ticket_id* and run the matching Selenium suite.

        Parameters
        ----------
        ticket_id   : Jira ticket key, e.g. "SR-2"
        summary     : Jira ticket summary (used by SeleniumRunner for module detection)
        description : Jira ticket description (used by SeleniumRunner for module detection)

        Returns the full QA result dict and stores it in the internal cache.
        """
        normalised = ticket_id.strip().upper()

        runner = self._get_runner()
        try:
            result = runner.run(normalised, summary, description)
        except Exception as exc:
            raise QAMCPRunError(f"SeleniumRunner failed for {normalised}: {exc}") from exc

        # Enrich with MCP provenance metadata
        result["mcpServer"] = "QAMCPServer"
        result["cachedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        self._cache[normalised] = result
        return result

    def get_test_result(self, ticket_id: str) -> dict[str, Any]:
        """
        Return the most recently cached test result for *ticket_id*.

        Triggers ``run_test_suite`` automatically if no cached result exists.
        """
        normalised = ticket_id.strip().upper()
        if normalised not in self._cache:
            return self.run_test_suite(normalised)
        return self._cache[normalised]

    def get_coverage(self, ticket_id: str) -> dict[str, Any]:
        """Return coverage data for *ticket_id* (triggers suite run if uncached)."""
        result = self.get_test_result(ticket_id)
        return {
            "ticketId": result.get("ticketId", ticket_id.upper()),
            "module": result.get("module", "Unknown"),
            "coverage": result.get("coverage", 0.0),
            "totalTests": result.get("totalTests", 0),
            "passed": result.get("passed", 0),
            "failed": result.get("failed", 0),
            "qaStatus": result.get("qaStatus", "Unknown"),
            "executionTime": result.get("executionTime", "0s"),
        }

    def get_failure_logs(self, ticket_id: str) -> dict[str, Any]:
        """Return failure-specific logs and screenshot paths for *ticket_id*."""
        result = self.get_test_result(ticket_id)

        all_logs: list[dict] = result.get("logs", [])
        failure_logs = [
            entry for entry in all_logs
            if "FAIL" in entry.get("message", "").upper()
            or "error" in entry.get("message", "").lower()
            or "fail" in entry.get("message", "").lower()
        ]

        screenshots: list[str] = result.get("screenshots", [])

        return {
            "ticketId": result.get("ticketId", ticket_id.upper()),
            "module": result.get("module", "Unknown"),
            "failed": result.get("failed", 0),
            "failureLogs": failure_logs,
            "screenshots": screenshots,
            "decision": result.get("decision", ""),
            "hasFailures": result.get("failed", 0) > 0 or bool(failure_logs),
        }

    # ------------------------------------------------------------------ dispatch

    def run_tool(self, tool_name: str, **kwargs: Any) -> Any:
        """Dispatch a named MCP tool call with keyword arguments."""
        tools = {
            "run_test_suite": self.run_test_suite,
            "get_test_result": self.get_test_result,
            "get_coverage": self.get_coverage,
            "get_failure_logs": self.get_failure_logs,
        }

        tool = tools.get(tool_name)
        if tool is None:
            raise QAMCPToolError(
                f"Unsupported QA MCP tool: '{tool_name}'. "
                f"Available tools: {', '.join(self.TOOLS)}"
            )

        return tool(**kwargs)

    # ------------------------------------------------------------------ internals

    def _get_runner(self) -> Any:
        """Lazily import and instantiate SeleniumRunner from the orchestrator."""
        if self._runner is not None:
            return self._runner

        try:
            from services.selenium_runner import SeleniumRunner  # type: ignore[import]
            self._runner = SeleniumRunner()
            return self._runner
        except ImportError as exc:
            raise QAMCPError(
                "Could not import SeleniumRunner. Ensure the autogen-orchestrator "
                "directory is present and selenium/webdriver-manager are installed."
            ) from exc

    def invalidate_cache(self, ticket_id: str | None = None) -> None:
        """Clear the result cache (specific ticket or all)."""
        if ticket_id:
            self._cache.pop(ticket_id.strip().upper(), None)
        else:
            self._cache.clear()


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

def create_server() -> QAMCPServer:
    """Return a ready-to-use QAMCPServer instance."""
    return QAMCPServer()
