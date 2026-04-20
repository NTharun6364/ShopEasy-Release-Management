from __future__ import annotations

import importlib.util
from pathlib import Path

from services.qa_service import QAService


class QAAgent:
	"""Universal QAAgent: routes all QA work through the MCP QA Server.

	Architecture
	------------
	  QAAgent
	    └─ MCP QA Server (mcp-servers/qa-server/server.py)
	         └─ SeleniumRunner (services/selenium_runner.py)
	              └─ Selenium test suites (tests/selenium/*.py)

	Falls back to the static QAService dataset only when the MCP Server
	cannot be loaded (e.g. missing dependencies).
	"""

	name = "QAAgent"

	def __init__(self) -> None:
		self._qa_service = QAService()
		server_path = (
			Path(__file__).resolve().parents[2]
			/ "mcp-servers"
			/ "qa-server"
			/ "server.py"
		)
		spec = importlib.util.spec_from_file_location("qa_mcp_server", server_path)
		if spec is None or spec.loader is None:
			raise RuntimeError(f"Unable to load QA MCP Server from {server_path}")

		module = importlib.util.module_from_spec(spec)
		spec.loader.exec_module(module)
		self._server = module.create_server()

	# ------------------------------------------------------------------ public

	def analyze_qa(self, ticket_id: str, *, summary: str = "", description: str = "") -> dict:
		"""Run QA analysis via MCP QA Server.

		When summary/description are available, passes them to MCP Server so
		SeleniumRunner can detect the right module automatically.
		Falls back to static dataset only when the MCP Server raises.
		"""
		normalized_ticket_id = ticket_id.strip().upper()

		try:
			# ── 1. Trigger test suite via MCP ────────────────────────────
			mcp_result = self._server.run_tool(
				"run_test_suite",
				ticket_id=normalized_ticket_id,
				summary=summary,
				description=description,
			)

			# If Selenium is disabled/unavailable, fall back to static dataset
			if mcp_result.get("qaStatus") in {"Unavailable", "App Offline"}:
				raise RuntimeError(mcp_result.get("decision", "Selenium unavailable"))

			# ── 2. Fetch coverage and failure details via separate MCP tools
			coverage_data = self._server.run_tool("get_coverage", ticket_id=normalized_ticket_id)
			failure_data = self._server.run_tool("get_failure_logs", ticket_id=normalized_ticket_id)

			# ── 3. Build enriched execution trace ────────────────────────
			logs = [
				{
					"step": "QAAgent -> MCP QA Server",
					"message": f"Invoked run_test_suite for {normalized_ticket_id} via MCP.",
				},
				{
					"step": "MCP QA Server -> SeleniumRunner",
					"message": (
						f"Detected module '{mcp_result.get('module', 'Unknown')}', "
						f"loaded suite '{mcp_result.get('suiteName', 'N/A')}'."
					),
				},
				{
					"step": "MCP QA Server -> get_coverage",
					"message": (
						f"Coverage {coverage_data.get('coverage', 0)}%, "
						f"passed {coverage_data.get('passed', 0)}/{coverage_data.get('totalTests', 0)}."
					),
				},
				{
					"step": "MCP QA Server -> get_failure_logs",
					"message": (
						f"Has failures: {failure_data.get('hasFailures', False)}, "
						f"failure log entries: {len(failure_data.get('failureLogs', []))}."
					),
				},
				*mcp_result.get("logs", []),
			]

			return {
				"ticketId": normalized_ticket_id,
				"module": mcp_result.get("module", "Unknown"),
				"suiteName": mcp_result.get("suiteName", ""),
				"framework": mcp_result.get("framework", "Selenium"),
				"qaStatus": mcp_result.get("qaStatus", "Unknown"),
				"totalTests": mcp_result.get("totalTests", 0),
				"passed": mcp_result.get("passed", 0),
				"failed": mcp_result.get("failed", 0),
				"coverage": mcp_result.get("coverage", 0.0),
				"executionTime": mcp_result.get("executionTime", "0s"),
				"decision": mcp_result.get("decision", ""),
				"screenshots": failure_data.get("screenshots", []),
				"failureLogs": failure_data.get("failureLogs", []),
				"mcpServer": mcp_result.get("mcpServer", "QAMCPServer"),
				"cachedAt": mcp_result.get("cachedAt", ""),
				"logs": logs,
				"agent": self.name,
			}

		except Exception as exc:  # noqa: BLE001 — graceful fallback
			return self._static_fallback(normalized_ticket_id, exc)

	# ------------------------------------------------------------------ fallback

	def _static_fallback(self, ticket_id: str, reason: Exception) -> dict:
		"""Return static QA data with a clearly labelled fallback note."""
		qa = self._qa_service.get_qa_result(ticket_id)
		decision = self._decide(
			qa_status=qa["qaStatus"],
			failed=qa["failed"],
			coverage=float(qa["coverage"]),
		)

		logs = [
			{
				"step": "QAAgent -> MCP QA Server (FAILED)",
				"message": f"MCP QA Server unavailable: {str(reason)[:200]}. Using static fallback.",
			},
			{
				"step": "QAAgent -> QA Service (static fallback)",
				"message": f"Fetched static QA metrics for {ticket_id}.",
			},
			{
				"step": "QA Metrics Evaluated",
				"message": (
					f"Status {qa['qaStatus']}, total {qa['totalTests']}, "
					f"passed {qa['passed']}, failed {qa['failed']}, coverage {qa['coverage']}%."
				),
			},
			{
				"step": "QAAgent Decision",
				"message": f"Decision computed as {decision}.",
			},
		]

		return {
			"ticketId": ticket_id,
			"module": "Unknown",
			"suiteName": "",
			"framework": "Static (fallback)",
			"qaStatus": qa["qaStatus"],
			"totalTests": qa["totalTests"],
			"passed": qa["passed"],
			"failed": qa["failed"],
			"coverage": qa["coverage"],
			"executionTime": "N/A",
			"decision": decision,
			"screenshots": [],
			"failureLogs": [],
			"mcpServer": "N/A",
			"cachedAt": "",
			"logs": logs,
			"agent": self.name,
		}

	# ------------------------------------------------------------------ helpers

	@staticmethod
	def _decide(*, qa_status: str, failed: int, coverage: float) -> str:
		if qa_status.lower() == "passed" and failed == 0 and coverage >= 90:
			return "QA Passed - Ready for Release"
		if qa_status.lower() == "failed" or failed > 0:
			return "QA Failed - Fix Required"
		return "QA In Progress - Awaiting Completion"
