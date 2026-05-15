"""
FastAPI main application for PR Party.
Provides SSE streaming endpoint for real-time PR analysis.
"""
import asyncio
import json
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse

from app.config import settings
from app.logging_config import configure_logging, get_logger
from app.models import AnalyzeRequest, EncounterResult, SSEEvent
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
            # TODO: Load from GitHub API
            raise HTTPException(
                status_code=501,
                detail="GitHub API integration not yet implemented. Use 'use_fixture' parameter."
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
            diff = fixture_data["diff"]
            package_json = fixture_data["package_json"]
            context_files = fixture_data["context_files"]
        else:
            raise HTTPException(
                status_code=501,
                detail="GitHub API integration not yet implemented. Use 'use_fixture' parameter."
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
