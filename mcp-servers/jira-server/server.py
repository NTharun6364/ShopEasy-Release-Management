from __future__ import annotations

import os
from typing import Any

import requests


class JiraMCPError(Exception):
	"""Base exception for Jira MCP failures."""


class JiraConfigError(JiraMCPError):
	"""Raised when required Jira environment variables are missing."""


class JiraAuthError(JiraMCPError):
	"""Raised when Jira Cloud rejects the configured credentials."""


class JiraTicketNotFoundError(JiraMCPError):
	"""Raised when the requested Jira issue does not exist."""


class JiraPermissionError(JiraMCPError):
	"""Raised when Jira returns a masked 404 for insufficient permissions."""


class JiraMCPServer:
	"""Thin MCP-style server facade over the Atlassian Jira Cloud REST API."""

	def __init__(self) -> None:
		self._base_url = os.getenv("JIRA_BASE_URL", "").rstrip("/")
		self._email = os.getenv("JIRA_EMAIL", "")
		self._api_token = os.getenv("JIRA_API_TOKEN", "")
		self._validate_configuration()

		self._session = requests.Session()
		self._session.auth = (self._email, self._api_token)
		self._session.headers.update(
			{
				"Accept": "application/json",
				"Content-Type": "application/json",
			}
		)
		self._issue_cache: dict[str, dict[str, Any]] = {}

	def get_ticket(self, ticket_id: str) -> dict[str, Any]:
		issue = self._fetch_issue(ticket_id)
		fields = issue["fields"]
		return {
			"ticketId": issue["key"],
			"summary": fields.get("summary") or "",
			"status": self._extract_name(fields.get("status")),
			"priority": self._extract_name(fields.get("priority")),
			"assignee": self._extract_assignee(fields.get("assignee")),
			"description": self._extract_description(fields.get("description")),
			"issueType": self._extract_name(fields.get("issuetype")),
		}

	def get_status(self, ticket_id: str) -> str:
		return self.get_ticket(ticket_id)["status"]

	def get_priority(self, ticket_id: str) -> str:
		return self.get_ticket(ticket_id)["priority"]

	def get_assignee(self, ticket_id: str) -> str:
		return self.get_ticket(ticket_id)["assignee"]

	def get_description(self, ticket_id: str) -> str:
		return self.get_ticket(ticket_id)["description"]

	def get_issue_type(self, ticket_id: str) -> str:
		return self.get_ticket(ticket_id)["issueType"]

	def run_tool(self, tool_name: str, *, ticket_id: str) -> Any:
		tools = {
			"get_ticket": self.get_ticket,
			"get_status": self.get_status,
			"get_priority": self.get_priority,
			"get_assignee": self.get_assignee,
			"get_description": self.get_description,
			"get_issue_type": self.get_issue_type,
		}
		try:
			tool = tools[tool_name]
		except KeyError as exc:
			raise JiraMCPError(f"Unsupported Jira MCP tool: {tool_name}") from exc
		return tool(ticket_id)

	def _validate_configuration(self) -> None:
		missing = [
			name
			for name, value in {
				"JIRA_BASE_URL": self._base_url,
				"JIRA_EMAIL": self._email,
				"JIRA_API_TOKEN": self._api_token,
			}.items()
			if not value
		]
		if missing:
			raise JiraConfigError(f"Missing Jira configuration: {', '.join(missing)}")

	def _fetch_issue(self, ticket_id: str) -> dict[str, Any]:
		normalized_ticket_id = ticket_id.strip().upper()
		if normalized_ticket_id in self._issue_cache:
			return self._issue_cache[normalized_ticket_id]

		response = self._session.get(
			f"{self._base_url}/rest/api/3/issue/{normalized_ticket_id}",
			params={"fields": "summary,status,priority,assignee,description,issuetype"},
			timeout=20,
		)

		if response.status_code == 401 or response.status_code == 403:
			raise JiraAuthError("Jira authentication failed. Check JIRA_EMAIL and JIRA_API_TOKEN.")
		if response.status_code == 404:
			message = self._extract_jira_error_message(response)
			if "do not have permission" in message.lower():
				raise JiraPermissionError("Jira permission denied for this issue")
			raise JiraTicketNotFoundError("Ticket Not Found")

		try:
			response.raise_for_status()
		except requests.HTTPError as exc:
			raise JiraMCPError(f"Jira API request failed with status {response.status_code}.") from exc

		issue = response.json()
		self._issue_cache[normalized_ticket_id] = issue
		return issue

	@staticmethod
	def _extract_jira_error_message(response: requests.Response) -> str:
		try:
			payload = response.json()
		except ValueError:
			return response.text or ""

		error_messages = payload.get("errorMessages") or []
		if error_messages:
			return str(error_messages[0])
		return response.text or ""

	@staticmethod
	def _extract_name(value: dict[str, Any] | None) -> str:
		if not value:
			return "Unspecified"
		return value.get("name") or "Unspecified"

	@staticmethod
	def _extract_assignee(assignee: dict[str, Any] | None) -> str:
		if not assignee:
			return "Unassigned"
		return assignee.get("displayName") or assignee.get("accountId") or "Unassigned"

	def _extract_description(self, description: dict[str, Any] | str | None) -> str:
		if description is None:
			return ""
		if isinstance(description, str):
			return description

		parts: list[str] = []
		self._walk_adf_text(description, parts)
		return "\n".join(part for part in parts if part).strip()

	def _walk_adf_text(self, node: Any, parts: list[str]) -> None:
		if isinstance(node, dict):
			if node.get("type") == "text" and node.get("text"):
				parts.append(str(node["text"]))
			for child in node.get("content", []):
				self._walk_adf_text(child, parts)
			if node.get("type") in {"paragraph", "heading", "bulletList", "orderedList", "listItem"}:
				parts.append("")
			return

		if isinstance(node, list):
			for child in node:
				self._walk_adf_text(child, parts)


def create_server() -> JiraMCPServer:
	return JiraMCPServer()
