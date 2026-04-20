from __future__ import annotations

import os
from typing import Any

import requests


class GitMCPError(Exception):
	"""Base exception for Git MCP failures."""


class GitConfigError(GitMCPError):
	"""Raised when required GitHub environment variables are missing."""


class GitAuthError(GitMCPError):
	"""Raised when GitHub API authentication fails."""


class GitMCPServer:
	"""Thin MCP-style server facade over GitHub pull request APIs."""

	def __init__(self) -> None:
		self._token = os.getenv("GITHUB_TOKEN", "").strip()
		self._owner = os.getenv("GITHUB_OWNER", "").strip()
		self._repo = os.getenv("GITHUB_REPO", "").strip()
		self._validate_configuration()

		self._session = requests.Session()
		self._session.headers.update(
			{
				"Accept": "application/vnd.github+json",
				"Authorization": f"Bearer {self._token}",
				"X-GitHub-Api-Version": "2022-11-28",
			}
		)

	def search_pull_requests(self, ticket_id: str) -> list[dict[str, Any]]:
		normalized_ticket_id = ticket_id.strip().upper()
		pulls_url = f"https://api.github.com/repos/{self._owner}/{self._repo}/pulls"

		try:
			response = self._session.get(
				pulls_url,
				params={"state": "all", "per_page": 100},
				timeout=20,
			)
		except requests.RequestException as exc:
			raise GitMCPError(f"GitHub API request failed: {exc}") from exc

		if response.status_code in {401, 403}:
			raise GitAuthError("GitHub authentication failed. Check GITHUB_TOKEN")

		try:
			response.raise_for_status()
		except requests.HTTPError as exc:
			raise GitMCPError(f"GitHub API request failed with status {response.status_code}") from exc

		results: list[dict[str, Any]] = []
		for pr in response.json():
			title = pr.get("title") or ""
			if normalized_ticket_id not in title.upper():
				continue

			state = pr.get("state", "")
			if state == "open":
				status = "Open"
			elif pr.get("merged_at"):
				status = "Merged"
			else:
				status = "Closed"

			results.append(
				{
					"prNumber": pr.get("number", 0),
					"prTitle": title,
					"status": status,
					"branch": (pr.get("head") or {}).get("ref", "unknown"),
					"repoName": f"{self._owner}/{self._repo}",
					"url": pr.get("html_url", ""),
				}
			)

		return results

	def run_tool(self, tool_name: str, **kwargs: Any) -> Any:
		tools = {
			"search_pull_requests": self.search_pull_requests,
		}

		tool = tools.get(tool_name)
		if tool is None:
			raise GitMCPError(f"Unsupported Git MCP tool: {tool_name}")

		return tool(**kwargs)

	def _validate_configuration(self) -> None:
		missing = []
		if not self._token:
			missing.append("GITHUB_TOKEN")
		if not self._owner:
			missing.append("GITHUB_OWNER")
		if not self._repo:
			missing.append("GITHUB_REPO")

		if missing:
			raise GitConfigError(f"Missing GitHub configuration: {', '.join(missing)}")


def create_server() -> GitMCPServer:
	return GitMCPServer()
