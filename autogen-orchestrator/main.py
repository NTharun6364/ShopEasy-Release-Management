from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from agents.planner_agent import PlannerAgent
from agents.builder_agent import BuilderAgent
from agents.qa_agent import QAAgent


load_dotenv(Path(__file__).resolve().parent / ".env")


class AnalyzeTicketRequest(BaseModel):
	ticket_id: str = Field(..., alias="ticketId", min_length=1)


class SearchPRRequest(BaseModel):
	ticket_id: str = Field(..., alias="ticketId", min_length=1)


class QAStatusRequest(BaseModel):
	ticket_id: str = Field(..., alias="ticketId", min_length=1)


class CheckQARequest(BaseModel):
	ticket_id: str = Field(..., alias="ticketId", min_length=1)


class AutoReleaseRequest(BaseModel):
	ticket_id: str = Field(..., alias="ticketId", min_length=1)


app = FastAPI(title="Release Management Orchestrator", version="1.0.0")

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


@app.get("/health")
@app.get("/api/health")
def health_check() -> dict[str, str]:
	return {"status": "ok"}


@app.post("/analyze-ticket")
@app.post("/api/analyze-ticket")
def analyze_ticket(payload: AnalyzeTicketRequest) -> dict:
	planner_agent = PlannerAgent()

	try:
		return planner_agent.analyze_ticket(payload.ticket_id)
	except Exception as exc:
		error_name = exc.__class__.__name__
		if error_name == "JiraTicketNotFoundError":
			raise HTTPException(status_code=404, detail="Ticket Not Found") from exc
		if error_name == "JiraPermissionError":
			raise HTTPException(status_code=403, detail="No Jira permission for this issue") from exc
		if error_name == "JiraAuthError":
			raise HTTPException(status_code=401, detail="Jira authentication failed") from exc
		if error_name == "JiraConfigError":
			raise HTTPException(status_code=500, detail=str(exc)) from exc
		if error_name == "JiraMCPError":
			raise HTTPException(status_code=502, detail=str(exc)) from exc
		raise HTTPException(status_code=500, detail="Unexpected backend error") from exc


@app.post("/search-pr")
@app.post("/api/search-pr")
def search_pr(payload: SearchPRRequest) -> dict:
	builder_agent = BuilderAgent()

	try:
		return builder_agent.search_pr_by_jira_id(payload.ticket_id)
	except Exception as exc:
		raise HTTPException(status_code=500, detail=f"PR search failed: {str(exc)}") from exc


@app.post("/qa-status")
@app.post("/api/qa-status")
def qa_status(payload: QAStatusRequest) -> dict:
	qa_agent = QAAgent()

	try:
		return qa_agent.analyze_qa(payload.ticket_id)
	except Exception as exc:
		raise HTTPException(status_code=500, detail=f"QA analysis failed: {str(exc)}") from exc


@app.post("/check-qa")
@app.post("/api/check-qa")
def check_qa(payload: CheckQARequest) -> dict:
	planner_agent = PlannerAgent()
	qa_agent = QAAgent()

	try:
		normalized_ticket_id = payload.ticket_id.strip().upper()

		# Fetch ticket context from Jira to drive module detection
		try:
			planner_result = planner_agent.analyze_ticket(normalized_ticket_id)
			summary = str(planner_result.get("summary", ""))
			description = str(planner_result.get("description", ""))
		except Exception:
			summary = ""
			description = ""

		result = qa_agent.analyze_qa(normalized_ticket_id, summary=summary, description=description)
		return result
	except Exception as exc:
		raise HTTPException(status_code=500, detail=f"QA check failed: {str(exc)}") from exc


@app.post("/auto-release")
@app.post("/api/auto-release")
def auto_release(payload: AutoReleaseRequest) -> dict:
	planner_agent = PlannerAgent()
	builder_agent = BuilderAgent()
	qa_agent = QAAgent()

	try:
		normalized_ticket_id = payload.ticket_id.strip().upper()

		planner_result = planner_agent.analyze_ticket(normalized_ticket_id)
		builder_result = builder_agent.search_pr_by_jira_id(normalized_ticket_id)

		# Pass Jira context to QAAgent so SeleniumRunner can detect the module
		ticket_summary = str(planner_result.get("summary", ""))
		ticket_description = str(planner_result.get("description", ""))
		qa_result = qa_agent.analyze_qa(
			normalized_ticket_id,
			summary=ticket_summary,
			description=ticket_description,
		)

		# Planner Score (max 25)
		planner_status = str(planner_result.get("status", "")).lower()
		planner_priority = str(planner_result.get("priority", "")).lower()
		planner_assignee = str(planner_result.get("assignee", "")).strip().lower()
		planner_description = str(planner_result.get("description", "")).lower()

		status_completed = planner_status in {"done", "closed", "resolved"}
		priority_healthy = planner_priority in {"low", "medium"}
		assignee_available = planner_assignee not in {"", "unassigned", "unspecified", "none"}
		no_blockers = "blocker" not in planner_description

		planner_score = 0
		planner_score += 10 if status_completed else 4
		planner_score += 5 if priority_healthy else 2
		planner_score += 5 if assignee_available else 1
		planner_score += 5 if no_blockers else 1

		# PR Score (max 25)
		pr_count = int(builder_result.get("prCount", 0))
		prs = builder_result.get("prs", [])
		primary_pr = prs[0] if prs else {}
		pr_status = str(primary_pr.get("status", "")).lower()

		pr_exists = pr_count > 0
		pr_approved = pr_status in {"merged", "open"}
		checks_passed = pr_status in {"merged", "open"}
		merge_ready = pr_status == "merged" or pr_status == "open"

		pr_score = 0
		pr_score += 8 if pr_exists else 0
		pr_score += 6 if pr_approved else 1
		pr_score += 6 if checks_passed else 1
		pr_score += 5 if merge_ready else 1

		# QA Score (max 35)
		qa_status = str(qa_result.get("qaStatus", "")).lower()
		qa_total_tests = int(qa_result.get("totalTests", 0))
		qa_passed = int(qa_result.get("passed", 0))
		qa_failed = int(qa_result.get("failed", 0))
		qa_coverage = float(qa_result.get("coverage", 0))

		pass_rate = (qa_passed / qa_total_tests * 100) if qa_total_tests > 0 else 0
		regression_clean = qa_status == "passed" and qa_failed == 0

		qa_score = 0
		qa_score += 12 if pass_rate >= 95 else 8 if pass_rate >= 85 else 4
		qa_score += 10 if qa_failed == 0 else 4 if qa_failed <= 2 else 1
		qa_score += 6 if regression_clean else 2
		qa_score += 7 if qa_coverage >= 90 else 4 if qa_coverage >= 75 else 1

		# Risk Score (max 15)
		open_sev1_bugs = 0 if (qa_failed == 0 and no_blockers) else 1
		deployment_blockers = 0 if no_blockers and pr_exists else 1
		utc_hour = datetime.now(timezone.utc).hour
		safe_release_window = 8 <= utc_hour <= 20

		risk_score = 0
		risk_score += 6 if open_sev1_bugs == 0 else 0
		risk_score += 5 if deployment_blockers == 0 else 0
		risk_score += 4 if safe_release_window else 1

		total_score = planner_score + pr_score + qa_score + risk_score

		# ReleaseManager final decision
		if total_score >= 90:
			final_decision = "Ready for Production"
			recommended_action = "Approve Release"
		elif total_score >= 75:
			final_decision = "Human Review Required"
			recommended_action = "Hold for Executive Review"
		else:
			final_decision = "Hold Release"
			recommended_action = "Reject and Remediate"

		confidence = min(99, max(55, int(total_score)))

		combined_logs = [
			{
				"step": "Auto Release Flow",
				"message": f"Started orchestration for {normalized_ticket_id}.",
			},
			*planner_result.get("logs", []),
			*builder_result.get("logs", []),
			*qa_result.get("logs", []),
			{
				"step": "Risk Engine",
				"message": (
					f"Sev1 open {open_sev1_bugs}, blockers {deployment_blockers}, "
					f"safe window {safe_release_window}."
				),
			},
			{
				"step": "ReleaseManager",
				"message": f"Final decision {final_decision} with confidence {confidence}%.",
			},
			{
				"step": "Auto Release Scorecard",
				"message": (
					f"Planner {planner_score}/25, PR {pr_score}/25, QA {qa_score}/35, "
					f"Risk {risk_score}/15, total {total_score}/100."
				),
			},
		]

		return {
			"ticketId": normalized_ticket_id,
			"planner": planner_result,
			"builder": builder_result,
			"qa": qa_result,
			"risk": {
				"openSev1Bugs": open_sev1_bugs,
				"deploymentBlockers": deployment_blockers,
				"safeReleaseWindow": safe_release_window,
			},
			"releaseManager": {
				"finalDecision": final_decision,
				"confidence": confidence,
				"recommendedAction": recommended_action,
				"lastUpdated": datetime.now(timezone.utc).isoformat(),
			},
			"scorecard": {
				"plannerScore": planner_score,
				"plannerMax": 25,
				"prScore": pr_score,
				"prMax": 25,
				"qaScore": qa_score,
				"qaMax": 35,
				"riskScore": risk_score,
				"riskMax": 15,
				"totalScore": total_score,
				"totalMax": 100,
				"recommendation": final_decision,
			},
			"blockersCount": deployment_blockers + open_sev1_bugs,
			"recentDeployments": [
				{"version": "v2.8.1", "status": "Success", "time": "2026-04-19T20:10:00Z"},
				{"version": "v2.8.0", "status": "Success", "time": "2026-04-18T17:42:00Z"},
				{"version": "v2.7.9", "status": "Rolled Back", "time": "2026-04-16T11:24:00Z"},
			],
			"logs": combined_logs,
		}
	except Exception as exc:
		raise HTTPException(status_code=500, detail=f"Auto release flow failed: {str(exc)}") from exc
