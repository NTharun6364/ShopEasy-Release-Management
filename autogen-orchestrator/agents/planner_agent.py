from __future__ import annotations

import importlib.util
from pathlib import Path
from typing import Any


class PlannerAgent:
	"""PlannerAgent routes Jira analysis strictly through the Jira MCP server."""

	name = "PlannerAgent"

	def __init__(self) -> None:
		server_path = (
			Path(__file__).resolve().parents[2] / "mcp-servers" / "jira-server" / "server.py"
		)
		spec = importlib.util.spec_from_file_location("jira_mcp_server", server_path)
		if spec is None or spec.loader is None:
			raise RuntimeError(f"Unable to load Jira MCP Server from {server_path}")

		module = importlib.util.module_from_spec(spec)
		spec.loader.exec_module(module)
		self._server = module.create_server()

	def analyze_ticket(self, ticket_id: str) -> dict[str, Any]:
		normalized_ticket_id = ticket_id.strip().upper()
		ticket = self._server.run_tool("get_ticket", ticket_id=normalized_ticket_id)
		status = self._server.run_tool("get_status", ticket_id=normalized_ticket_id)
		priority = self._server.run_tool("get_priority", ticket_id=normalized_ticket_id)
		assignee = self._server.run_tool("get_assignee", ticket_id=normalized_ticket_id)
		description = self._server.run_tool("get_description", ticket_id=normalized_ticket_id)
		issue_type = self._server.run_tool("get_issue_type", ticket_id=normalized_ticket_id)

		decision = self._decide(status=status, priority=priority, issue_type=issue_type)
		logs = [
			{
				"step": "PlannerAgent -> MCP Jira Server -> Jira API",
				"message": f"Fetched {normalized_ticket_id} from Jira Cloud.",
			},
			{
				"step": "MCP Jira Server -> Jira API -> Data Returned",
				"message": f"Status {status}, priority {priority}, assignee {assignee}, issue type {issue_type}.",
			},
			{
				"step": "PlannerAgent Decision",
				"message": f"Decision computed as {decision}.",
			},
		]

		return {
			"ticketId": ticket["ticketId"],
			"summary": ticket["summary"],
			"status": status,
			"priority": priority,
			"assignee": assignee,
			"description": description,
			"issueType": issue_type,
			"agent": self.name,
			"decision": decision,
			"logs": logs,
		}

	@staticmethod
	def _decide(*, status: str, priority: str, issue_type: str) -> str:
		if status.lower() in {"done", "closed", "resolved"}:
			return "Ready for Release Review"
		if status.lower() in {"in progress", "selected for development", "to do", "open"}:
			return "Development Pending"
		if priority.lower() in {"highest", "high"} and issue_type.lower() == "bug":
			return "Development Pending"
		return "Needs Planning Review"
