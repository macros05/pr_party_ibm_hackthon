/**
 * API client for PR Party backend (FastAPI).
 * Supports both sync (/analyze/sync) and streaming (/analyze) endpoints.
 */

import type { CharacterId } from "@/types/encounter";
import { adaptEncounterResult, type BackendEncounterResult } from "./adapter";

/**
 * Get API base URL from environment or default to localhost.
 */
function getApiUrl(): string {
  if (typeof window === "undefined") {
    // Server-side: use internal URL if available
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  }
  // Client-side: use public URL
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

/**
 * Request payload for /analyze endpoints.
 */
interface AnalyzeRequest {
  pr_number?: number;
  repo_owner?: string;
  repo_name?: string;
  github_url?: string;
  use_fixture?: string; // "pr1", "pr2", "pr3"
}

/**
 * Fetch encounter result synchronously (POST /analyze/sync).
 * Returns adapted data ready for frontend consumption.
 *
 * @param fixtureOrUrl - Either a fixture name ("pr1", "pr2", "pr3") or a GitHub PR URL
 */
export async function fetchEncounter(
  fixtureOrUrl: string
): Promise<ReturnType<typeof adaptEncounterResult>> {
  const apiUrl = getApiUrl();
  const url = `${apiUrl}/analyze/sync`;

  // Determine if input is a GitHub URL or fixture name
  const isGitHubUrl = fixtureOrUrl.includes("github.com");
  
  const payload: AnalyzeRequest = isGitHubUrl
    ? {
        github_url: fixtureOrUrl,
      }
    : {
        pr_number: 1, // dummy values when using fixture
        repo_owner: "dummy",
        repo_name: "dummy",
        use_fixture: fixtureOrUrl,
      };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Backend error (${response.status}): ${errorText || response.statusText}`
    );
  }

  const backendResult: BackendEncounterResult = await response.json();
  return adaptEncounterResult(backendResult);
}

/**
 * SSE event types from backend.
 */
type SSEEventType = "finding" | "dialogue" | "complete" | "error";

interface SSEFindingEvent {
  event: "finding";
  data: {
    character_id: CharacterId;
    finding: BackendEncounterResult["findings"][0];
  };
}

interface SSECompleteEvent {
  event: "complete";
  data: BackendEncounterResult;
}

interface SSEErrorEvent {
  event: "error";
  data: {
    message: string;
  };
}

type SSEEvent = SSEFindingEvent | SSECompleteEvent | SSEErrorEvent;

/**
 * Stream encounter via SSE (POST /analyze).
 * Calls callbacks as events arrive.
 */
export function streamEncounter(
  fixture: string,
  callbacks: {
    onFinding?: (characterId: CharacterId, finding: any) => void;
    onComplete?: (result: BackendEncounterResult) => void;
    onError?: (error: string) => void;
  }
): () => void {
  const apiUrl = getApiUrl();
  const url = `${apiUrl}/analyze`;

  const payload: AnalyzeRequest = {
    pr_number: 1,
    repo_owner: "dummy",
    repo_name: "dummy",
    use_fixture: fixture,
  };

  // EventSource doesn't support POST, so we need to use fetch with streaming
  const abortController = new AbortController();

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(payload),
    signal: abortController.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Backend error (${response.status}): ${errorText || response.statusText}`
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is not readable");
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim() || line.startsWith(":")) continue; // Skip empty lines and comments

          if (line.startsWith("data: ")) {
            const data = line.slice(6); // Remove "data: " prefix
            try {
              const event: SSEEvent = JSON.parse(data);

              switch (event.event) {
                case "finding":
                  callbacks.onFinding?.(
                    event.data.character_id,
                    event.data.finding
                  );
                  break;
                case "complete":
                  callbacks.onComplete?.(event.data);
                  break;
                case "error":
                  callbacks.onError?.(event.data.message);
                  break;
              }
            } catch (err) {
              console.error("Failed to parse SSE event:", err, data);
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        callbacks.onError?.(err.message);
      }
    });

  // Return cleanup function
  return () => {
    abortController.abort();
  };
}

/**
 * Fetch available fixtures from backend.
 */
export async function fetchFixtures(): Promise<string[]> {
  const apiUrl = getApiUrl();
  const url = `${apiUrl}/fixtures`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch fixtures: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check if backend is available.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const apiUrl = getApiUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(`${apiUrl}/`, {
      method: "GET",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error("Backend health check failed:", error);
    return false;
  }
}

// Made with Bob
