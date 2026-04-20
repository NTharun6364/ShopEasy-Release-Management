import os
from typing import Optional
import requests


class GitHubSearchResult:
    def __init__(
        self,
        pr_number: int,
        pr_title: str,
        status: str,
        branch: str,
        repo_name: str,
        url: str,
    ):
        self.pr_number = pr_number
        self.pr_title = pr_title
        self.status = status
        self.branch = branch
        self.repo_name = repo_name
        self.url = url

    def to_dict(self) -> dict:
        return {
            "prNumber": self.pr_number,
            "prTitle": self.pr_title,
            "status": self.status,
            "branch": self.branch,
            "repoName": self.repo_name,
            "url": self.url,
        }


class GitHubService:
    def __init__(self):
        self.token = os.getenv("GITHUB_TOKEN")
        self.base_url = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "Authorization": f"token {self.token}" if self.token else "",
        }

    def search_prs_by_jira_id(self, jira_id: str) -> list[GitHubSearchResult]:
        """Search GitHub PRs by Jira ticket ID in PR title.
        
        Args:
            jira_id: Jira ticket ID (e.g., 'SR-2')
            
        Returns:
            List of PR search results
        """
        if not self.token:
            raise ValueError("GITHUB_TOKEN environment variable not set")

        # Search PRs with Jira ID in title across all repos
        search_query = f"{jira_id} in:title type:pr"
        search_url = f"{self.base_url}/search/issues"
        
        try:
            response = requests.get(
                search_url,
                headers=self.headers,
                params={"q": search_query, "per_page": 10},
                timeout=10,
            )
            response.raise_for_status()
            
            results = []
            for item in response.json().get("items", []):
                # Extract repository name from full name
                repo_full_name = item.get("repository_url", "").split("/repos/")[-1]
                
                # Determine status from PR state
                state = item.get("state", "unknown")
                if state == "open":
                    status = "Open"
                elif state == "closed":
                    # Check if merged (merged_at field only present for merged PRs)
                    if item.get("pull_request", {}).get("merged_at"):
                        status = "Merged"
                    else:
                        status = "Closed"
                else:
                    status = state.capitalize()

                # Extract branch from pull_request head.ref if available
                branch = item.get("pull_request", {}).get("head", {}).get("ref", "unknown")

                result = GitHubSearchResult(
                    pr_number=item.get("number", 0),
                    pr_title=item.get("title", ""),
                    status=status,
                    branch=branch,
                    repo_name=repo_full_name,
                    url=item.get("html_url", ""),
                )
                results.append(result)

            return results

        except requests.exceptions.RequestException as exc:
            raise RuntimeError(f"GitHub API error: {str(exc)}") from exc

    def get_pr_details(self, owner: str, repo: str, pr_number: int) -> dict:
        """Get detailed PR information.
        
        Args:
            owner: Repository owner
            repo: Repository name
            pr_number: PR number
            
        Returns:
            PR details dictionary
        """
        if not self.token:
            raise ValueError("GITHUB_TOKEN environment variable not set")

        url = f"{self.base_url}/repos/{owner}/{repo}/pulls/{pr_number}"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            return {
                "number": data.get("number"),
                "title": data.get("title"),
                "state": data.get("state"),
                "branch": data.get("head", {}).get("ref"),
                "url": data.get("html_url"),
                "description": data.get("body", ""),
                "created_at": data.get("created_at"),
                "updated_at": data.get("updated_at"),
                "merged_at": data.get("merged_at"),
            }

        except requests.exceptions.RequestException as exc:
            raise RuntimeError(f"GitHub API error: {str(exc)}") from exc
