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
