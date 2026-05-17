"""
FastAPI main application for PR Party.
Provides SSE streaming endpoint for real-time PR analysis.
"""
import asyncio
import json
from datetime import datetime
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse

from app.config import settings
from app.logging_config import configure_logging, get_logger
from app.models import AnalyzeRequest, EncounterResult, SSEEvent
from app.clients.github_client import get_github_client
from app.services.fixture_loader import get_fixture_loader
from app.services.orchestrator import get_orchestrator

# Configure logging
configure_logging()
logger = get_logger(__name__)

# Create FastAPI app
app = FastAPI(
    title="PR Party API",
    description="Multi-agent PR review system with IBM Bob and watsonx.ai",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    logger.info("application_startup", version="1.0.0")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("application_shutdown")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "PR Party API",
        "status": "operational",
        "version": "1.0.0"
    }


@app.get("/debug/last-response")
async def debug_last_response():
    """Return the last raw model response from the searcher pass."""
    from app.clients.bob_client import _last_searcher_response, _last_searcher_error
    return {
        "response_length": len(_last_searcher_response),
        "parse_error": _last_searcher_error or None,
        "raw_response": _last_searcher_response,
    }


@app.get("/fixtures")
async def list_fixtures():
    """List available PR fixtures for testing."""
    loader = get_fixture_loader()
    fixtures = loader.list_fixtures()
    return {
        "fixtures": fixtures,
        "description": "Use these fixture names in the 'use_fixture' parameter"
    }


async def analyze_pr_stream(request: AnalyzeRequest) -> AsyncGenerator[str, None]:
    """
    Stream PR analysis results as Server-Sent Events.
    
    Event types:
    - finding: Individual finding discovered
    - dialogue: Character dialogue
    - complete: Analysis complete with full result
    - error: Error occurred
    """
    try:
        logger.info(
            "analysis_stream_start",
            pr_number=request.pr_number,
            use_fixture=request.use_fixture
        )
        
        # Load PR data (from fixture or GitHub)
        if request.use_fixture:
            # Load from fixture
            loader = get_fixture_loader()
            fixture_data = loader.load_fixture(request.use_fixture)
            
            pr_number = fixture_data["pr_number"]
            pr_title = fixture_data["pr_title"]
            pr_author = fixture_data["pr_author"]
            diff = fixture_data["diff"]
            package_json = fixture_data["package_json"]
            context_files = fixture_data["context_files"]
        else:
            # Load from GitHub API
            github = get_github_client()
            
            try:
                # Parse GitHub URL if provided
                if request.github_url:
                    owner, repo, pr_num = github.parse_pr_url(request.github_url)
                    request.repo_owner = owner
                    request.repo_name = repo
                    request.pr_number = pr_num
                
                # Validate required fields
                if not request.repo_owner or not request.repo_name or not request.pr_number:
                    raise HTTPException(
                        status_code=400,
                        detail="Either 'github_url' or 'repo_owner', 'repo_name', and 'pr_number' must be provided"
                    )
                
                # Fetch PR data from GitHub
                github_data = await github.fetch_pr(
                    owner=request.repo_owner,
                    repo=request.repo_name,
                    pr_number=request.pr_number
                )
                
                pr_number = github_data["pr_number"]
                pr_title = github_data["pr_title"]
                pr_author = github_data["pr_author"]
                diff = github_data["diff"]
                package_json = github_data["package_json"]
                context_files = github_data["context_files"]
                
            except ValueError as e:
                # Invalid URL format
                logger.error("invalid_github_url", error=str(e))
                raise HTTPException(
                    status_code=400,
                    detail=str(e)
                )
            except Exception as e:
                # GitHub API error
                logger.error("github_fetch_error", error=str(e))
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to fetch PR from GitHub: {str(e)}"
                )
        
        # Run analysis
        orchestrator = get_orchestrator()
        result = await orchestrator.analyze_pr(
            pr_number=pr_number,
            pr_title=pr_title,
            pr_author=pr_author,
            diff=diff,
            package_json=package_json,
            context_files=context_files
        )
        
        # Stream findings one by one
        for finding in result.findings:
            event = SSEEvent(
                event="finding",
                data=finding.model_dump()
            )
            yield f"event: finding\ndata: {json.dumps(event.data)}\n\n"
            await asyncio.sleep(0.5)  # Delay for animation
        
        # Stream dialogues
        for dialogue in result.dialogues:
            event = SSEEvent(
                event="dialogue",
                data=dialogue.model_dump()
            )
            yield f"event: dialogue\ndata: {json.dumps(event.data)}\n\n"
            await asyncio.sleep(0.5)
        
        # Stream complete result
        event = SSEEvent(
            event="complete",
            data=result.model_dump()
        )
        yield f"event: complete\ndata: {json.dumps(event.data)}\n\n"
        
        logger.info(
            "analysis_stream_complete",
            pr_number=pr_number,
            verdict=result.verdict,
            findings_count=len(result.findings)
        )
        
    except Exception as e:
        logger.error(
            "analysis_stream_error",
            error=str(e),
            error_type=type(e).__name__
        )
        
        error_event = SSEEvent(
            event="error",
            data={
                "error": str(e),
                "error_type": type(e).__name__
            }
        )
        yield f"event: error\ndata: {json.dumps(error_event.data)}\n\n"


@app.post("/analyze")
async def analyze_pr(request: AnalyzeRequest):
    """
    Analyze a PR and stream results via Server-Sent Events.

    Use 'use_fixture' parameter for offline testing with fixtures (pr1, pr2, pr3).
    """
    return EventSourceResponse(analyze_pr_stream(request))


async def _load_pr_payload(request: AnalyzeRequest) -> dict:
    """
    Resolve a request to PR metadata + content. Shared by streaming and sync
    endpoints. Raises HTTPException on bad input.
    """
    if request.use_fixture:
        loader = get_fixture_loader()
        fixture_data = loader.load_fixture(request.use_fixture)
        return {
            "pr_number": fixture_data["pr_number"],
            "pr_title": fixture_data["pr_title"],
            "pr_author": fixture_data["pr_author"],
            "diff": fixture_data["diff"],
            "package_json": fixture_data["package_json"],
            "context_files": fixture_data["context_files"],
            "pregenerated": fixture_data.get("expected_findings_validated"),
            "expected_raw": fixture_data.get("expected_findings_raw", {}).get("findings", []),
            "expected_validated": (
                fixture_data.get("expected_findings_validated", {}).get("findings", [])
                if fixture_data.get("expected_findings_validated")
                else []
            ),
        }

    github = get_github_client()
    try:
        if request.github_url:
            owner, repo, pr_num = github.parse_pr_url(request.github_url)
            request.repo_owner = owner
            request.repo_name = repo
            request.pr_number = pr_num

        if not request.repo_owner or not request.repo_name or not request.pr_number:
            raise HTTPException(
                status_code=400,
                detail="Either 'github_url' or 'repo_owner', 'repo_name', and 'pr_number' must be provided",
            )

        github_data = await github.fetch_pr(
            owner=request.repo_owner,
            repo=request.repo_name,
            pr_number=request.pr_number,
        )
        return {
            "pr_number": github_data["pr_number"],
            "pr_title": github_data["pr_title"],
            "pr_author": github_data["pr_author"],
            "diff": github_data["diff"],
            "package_json": github_data["package_json"],
            "context_files": github_data["context_files"],
            "pregenerated": None,
            "expected_raw": [],
            "expected_validated": [],
        }
    except ValueError as e:
        logger.error("invalid_github_url", error=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error("github_fetch_error", error=str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch PR from GitHub: {str(e)}",
        )


def _heartbeat_event() -> str:
    """Comment line keeps proxies/CDNs from closing idle SSE connections."""
    return ": keep-alive\n\n"


async def _stream_pregenerated_fixture(payload: dict) -> AsyncGenerator[str, None]:
    """
    Stream a fixture's pre-generated findings as if they were coming from
    the real pipeline. Groups findings by character and emits one
    character_complete event per character, with realistic spacing so the
    UI animation has room to breathe.
    """
    from app.models import FindingValidated, Finding
    from app.services.classifier import get_classifier
    from app.services.voice_rewriter import get_voice_rewriter
    from app.services.orchestrator import (
        CHARACTER_PIPELINE,
        PRAnalysisOrchestrator,
    )

    pr_number = payload["pr_number"]
    pr_title = payload["pr_title"]
    pr_author = payload["pr_author"]
    expected_raw = payload["expected_raw"]
    expected_validated = payload["expected_validated"]

    all_character_ids = [c[3] for c in CHARACTER_PIPELINE]

    started = {
        "event": "started",
        "data": {
            "pr_number": pr_number,
            "pr_title": pr_title,
            "pr_author": pr_author,
            "characters": all_character_ids,
        },
    }
    yield f"event: started\ndata: {json.dumps(started['data'])}\n\n"

    for char_id in all_character_ids:
        yield (
            "event: character_started\n"
            f"data: {json.dumps({'character_id': char_id})}\n\n"
        )

    # Rebuild FindingValidated objects from fixture data, then run the
    # classifier + voice rewriter so the dialogue is shaped the same as
    # the live pipeline.
    findings_validated: list[FindingValidated] = []
    for i, validated_data in enumerate(expected_validated):
        raw = expected_raw[i] if i < len(expected_raw) else {}
        severity = raw.get("severity", "low")
        damage_map = {"critical": 90, "high": 60, "medium": 30, "low": 10}
        damage_type_map = {
            "critical": "crit_hit",
            "high": "hit",
            "medium": "graze",
            "low": "whisper",
        }
        try:
            findings_validated.append(
                FindingValidated(
                    id=raw.get("id", f"F{i:03d}"),
                    title=raw.get("title", ""),
                    description=raw.get("explanation", raw.get("description", "")),
                    severity=severity,
                    damage=damage_map.get(severity, 10),
                    damage_type=damage_type_map.get(severity, "whisper"),
                    file_path=raw.get("file", raw.get("file_path", "unknown")),
                    line_start=raw.get("line_start", 1),
                    line_end=raw.get("line_end", 1),
                    code_snippet=raw.get("code_snippet", ""),
                    category=raw.get("category", "general"),
                    validation_notes=(validated_data or {}).get("validation_notes", ""),
                )
            )
        except Exception as exc:
            logger.warning("fixture_finding_skip", error=str(exc))

    classifier = get_classifier()
    classified = classifier.classify_findings(findings_validated)

    voice = get_voice_rewriter()
    all_findings: list[Finding] = []
    # Stream one character at a time with a short pause — the UI shows the
    # "robot working" animation in between.
    for char_id in all_character_ids:
        char_findings_validated = classified.get(char_id, [])
        try:
            if char_findings_validated:
                dialogues = await asyncio.gather(
                    *(voice.rewrite_finding(char_id, fv) for fv in char_findings_validated),  # type: ignore[arg-type]
                    return_exceptions=True,
                )
            else:
                dialogues = []

            voiced: list[Finding] = []
            for fv, dialogue in zip(char_findings_validated, dialogues):
                voiced.append(
                    Finding(
                        id=fv.id,
                        title=fv.title,
                        description=fv.description,
                        severity=fv.severity,
                        damage=fv.damage,
                        damage_type=fv.damage_type,
                        file_path=fv.file_path,
                        line_start=fv.line_start,
                        line_end=fv.line_end,
                        code_snippet=fv.code_snippet,
                        character_id=char_id,  # type: ignore[arg-type]
                        character_dialogue=(
                            dialogue
                            if isinstance(dialogue, str) and dialogue.strip()
                            else fv.description
                        ),
                    )
                )

            all_findings.extend(voiced)
            yield (
                "event: character_complete\n"
                f"data: {json.dumps({'character_id': char_id, 'findings': [f.model_dump() for f in voiced]})}\n\n"
            )
            # Small artificial pacing so the islands feel alive in the demo
            await asyncio.sleep(0.6)
        except Exception as exc:
            yield (
                "event: character_error\n"
                f"data: {json.dumps({'character_id': char_id, 'error': str(exc)})}\n\n"
            )

    # Final verdict
    orchestrator = PRAnalysisOrchestrator()
    total_damage = sum(f.damage for f in all_findings)
    remaining_hp = max(0, 100 - total_damage)
    verdict = orchestrator._calculate_verdict(total_damage)

    result = EncounterResult(
        pr_number=pr_number,
        pr_title=pr_title,
        pr_author=pr_author,
        verdict=verdict,
        total_damage=total_damage,
        remaining_hp=remaining_hp,
        findings=all_findings,
        dialogues=orchestrator._generate_dialogues(all_findings),
        analysis_timestamp=datetime.utcnow().isoformat(),
    )

    yield f"event: complete\ndata: {json.dumps(result.model_dump())}\n\n"


async def analyze_pr_stream_v2(request: AnalyzeRequest) -> AsyncGenerator[str, None]:
    """
    Per-character streaming pipeline. Emits one event per character as
    each independent agent finishes, plus a final `complete` event with
    the full EncounterResult.
    """
    try:
        # First yield a heartbeat so the connection is established and the
        # browser's TTFB clock doesn't tick into the network's idle timeout
        # before the (potentially slow) GitHub fetch returns.
        yield _heartbeat_event()

        payload = await _load_pr_payload(request)

        # Pregenerated fixture path — fast deterministic demo
        if payload["pregenerated"]:
            async for event in _stream_pregenerated_fixture(payload):
                yield event
            return

        # Live path — real Granite pipeline, streaming per character
        orchestrator = get_orchestrator()
        async for raw_event in orchestrator.analyze_pr_streaming(
            pr_number=payload["pr_number"],
            pr_title=payload["pr_title"],
            pr_author=payload["pr_author"],
            diff=payload["diff"],
            package_json=payload["package_json"],
            context_files=payload["context_files"],
        ):
            name = raw_event["event"]
            data = raw_event["data"]
            yield f"event: {name}\ndata: {json.dumps(data)}\n\n"
    except HTTPException as exc:
        yield (
            "event: error\n"
            f"data: {json.dumps({'message': exc.detail, 'status_code': exc.status_code})}\n\n"
        )
    except Exception as exc:
        logger.error(
            "stream_analysis_unhandled_error",
            error=str(exc),
            error_type=type(exc).__name__,
        )
        yield (
            "event: error\n"
            f"data: {json.dumps({'message': str(exc), 'error_type': type(exc).__name__})}\n\n"
        )


@app.post("/analyze/stream")
async def analyze_pr_stream_endpoint(request: AnalyzeRequest):
    """
    Per-character streaming endpoint. Each of the six character agents runs
    independently and emits its findings as soon as its own pipeline finishes
    (search + voice rewrite). The frontend uses these events to populate
    each island's panel progressively instead of waiting for the whole
    council to finish.
    """
    return StreamingResponse(
        analyze_pr_stream_v2(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable proxy buffering (nginx)
            "Connection": "keep-alive",
        },
    )


@app.post("/analyze/sync")
async def analyze_pr_sync(request: AnalyzeRequest) -> EncounterResult:
    """
    Analyze a PR and return complete result (non-streaming).
    Useful for testing and debugging.
    
    When using fixtures, loads pre-generated findings for fast demo.
    """
    try:
        logger.info(
            "analysis_sync_start",
            pr_number=request.pr_number,
            use_fixture=request.use_fixture
        )
        
        # Load PR data
        if request.use_fixture:
            loader = get_fixture_loader()
            fixture_data = loader.load_fixture(request.use_fixture)
            
            pr_number = fixture_data["pr_number"]
            pr_title = fixture_data["pr_title"]
            pr_author = fixture_data["pr_author"]
            
            # For fixtures, use pre-generated findings (fast demo mode)
            if fixture_data.get("expected_findings_validated"):
                logger.info("using_pregenerated_findings", fixture=request.use_fixture)
                
                from app.models import FindingValidated
                from app.services.classifier import get_classifier
                from app.services.voice_rewriter import get_voice_rewriter
                
                # Load expected findings
                expected_raw = fixture_data["expected_findings_raw"]["findings"]
                expected_validated_data = fixture_data["expected_findings_validated"]["findings"]
                
                # Convert to FindingValidated objects
                # Map fixture JSON fields to model fields
                findings_validated = []
                for i, validated_data in enumerate(expected_validated_data):
                    raw_finding = expected_raw[i]
                    
                    # Map severity to damage
                    severity = raw_finding["severity"]
                    if severity == "critical":
                        damage = 90
                        damage_type = "crit_hit"
                    elif severity == "high":
                        damage = 60
                        damage_type = "hit"
                    elif severity == "medium":
                        damage = 30
                        damage_type = "graze"
                    else:  # low
                        damage = 10
                        damage_type = "whisper"
                    
                    finding = FindingValidated(
                        id=raw_finding["id"],
                        title=raw_finding["title"],
                        description=raw_finding["explanation"],  # explanation → description
                        severity=severity,
                        damage=damage,
                        damage_type=damage_type,
                        file_path=raw_finding["file"],  # file → file_path
                        line_start=raw_finding["line_start"],
                        line_end=raw_finding["line_end"],
                        code_snippet=raw_finding["code_snippet"],
                        category=raw_finding.get("category", "general"),
                        validation_notes=validated_data["validation_notes"]
                    )
                    findings_validated.append(finding)
                
                # Classify and voice rewrite
                classifier = get_classifier()
                classified_findings = classifier.classify_findings(findings_validated)
                
                voice_rewriter = get_voice_rewriter()
                voiced_findings = await voice_rewriter.rewrite_findings(classified_findings)
                
                # Calculate damage and verdict
                total_damage = sum(f.damage for f in voiced_findings)
                remaining_hp = max(0, 100 - total_damage)
                
                if total_damage >= 80:
                    verdict = "blocked"
                elif total_damage >= 50:
                    verdict = "changes_required"
                else:
                    verdict = "approved"
                
                # Generate dialogues
                from app.services.orchestrator import PRAnalysisOrchestrator
                orchestrator = PRAnalysisOrchestrator()
                dialogues = orchestrator._generate_dialogues(voiced_findings)
                
                result = EncounterResult(
                    pr_number=pr_number,
                    pr_title=pr_title,
                    pr_author=pr_author,
                    verdict=verdict,
                    total_damage=total_damage,
                    remaining_hp=remaining_hp,
                    findings=voiced_findings,
                    dialogues=dialogues,
                    analysis_timestamp=datetime.utcnow().isoformat()
                )
                
                logger.info(
                    "analysis_sync_complete",
                    pr_number=pr_number,
                    verdict=verdict,
                    findings_count=len(voiced_findings)
                )
                
                return result
            diff = fixture_data["diff"]
            package_json = fixture_data["package_json"]
            context_files = fixture_data["context_files"]
        else:
            # Load from GitHub API
            github = get_github_client()
            
            try:
                # Parse GitHub URL if provided
                if request.github_url:
                    owner, repo, pr_num = github.parse_pr_url(request.github_url)
                    request.repo_owner = owner
                    request.repo_name = repo
                    request.pr_number = pr_num
                
                # Validate required fields
                if not request.repo_owner or not request.repo_name or not request.pr_number:
                    raise HTTPException(
                        status_code=400,
                        detail="Either 'github_url' or 'repo_owner', 'repo_name', and 'pr_number' must be provided"
                    )
                
                # Fetch PR data from GitHub
                github_data = await github.fetch_pr(
                    owner=request.repo_owner,
                    repo=request.repo_name,
                    pr_number=request.pr_number
                )
                
                pr_number = github_data["pr_number"]
                pr_title = github_data["pr_title"]
                pr_author = github_data["pr_author"]
                diff = github_data["diff"]
                package_json = github_data["package_json"]
                context_files = github_data["context_files"]
                
            except ValueError as e:
                # Invalid URL format
                logger.error("invalid_github_url", error=str(e))
                raise HTTPException(
                    status_code=400,
                    detail=str(e)
                )
            except Exception as e:
                # GitHub API error
                logger.error("github_fetch_error", error=str(e))
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to fetch PR from GitHub: {str(e)}"
                )
        
        # Run analysis
        orchestrator = get_orchestrator()
        result = await orchestrator.analyze_pr(
            pr_number=pr_number,
            pr_title=pr_title,
            pr_author=pr_author,
            diff=diff,
            package_json=package_json,
            context_files=context_files
        )
        
        logger.info(
            "analysis_sync_complete",
            pr_number=pr_number,
            verdict=result.verdict
        )
        
        return result
        
    except Exception as e:
        logger.error(
            "analysis_sync_error",
            error=str(e),
            error_type=type(e).__name__
        )
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# Made with Bob
