"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface FixtureOption {
  id: string;
  name: string;
  description: string;
  severity: "critical" | "warning" | "success";
}

const FIXTURES: FixtureOption[] = [
  {
    id: "pr1",
    name: "PR #123: Security Critical",
    description: "Avatar upload with RCE vulnerability (BLOCKED)",
    severity: "critical",
  },
  {
    id: "pr2",
    name: "PR #456: Mixed Issues",
    description: "User search with N+1 queries (CHANGES REQUIRED)",
    severity: "warning",
  },
  {
    id: "pr3",
    name: "PR #789: Clean Code",
    description: "Secure password reset (APPROVED)",
    severity: "success",
  },
];

const SEVERITY_STYLES = {
  critical: "border-red-500 bg-red-950/30 hover:bg-red-950/50",
  warning: "border-yellow-500 bg-yellow-950/30 hover:bg-yellow-950/50",
  success: "border-green-500 bg-green-950/30 hover:bg-green-950/50",
};

const SEVERITY_BADGE = {
  critical: "bg-red-500 text-white",
  warning: "bg-yellow-500 text-black",
  success: "bg-green-500 text-white",
};

export function FixtureSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentFixture = searchParams.get("fixture") || "pr1";
  const [githubUrl, setGithubUrl] = React.useState("");
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSelect = (fixtureId: string) => {
    router.push(`/?fixture=${fixtureId}`);
  };

  const handleGitHubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!githubUrl.trim()) {
      setError("Please enter a GitHub PR URL");
      return;
    }

    // Validate URL format
    const urlPattern = /github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/;
    if (!urlPattern.test(githubUrl)) {
      setError("Invalid GitHub PR URL. Expected format: https://github.com/owner/repo/pull/123");
      return;
    }

    setIsAnalyzing(true);
    
    // Navigate to analysis page with GitHub URL
    const encodedUrl = encodeURIComponent(githubUrl);
    router.push(`/island/aegis?github_url=${encodedUrl}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            PR Party
          </h1>
          <p className="text-xl text-slate-300 mb-2">
            Multi-Agent PR Review System
          </p>
          <p className="text-sm text-slate-400">
            Select a PR fixture to analyze
          </p>
        </div>

        {/* Fixture Cards */}
        <div className="grid gap-6 mb-8">
          {FIXTURES.map((fixture) => {
            const isSelected = currentFixture === fixture.id;
            return (
              <button
                key={fixture.id}
                onClick={() => handleSelect(fixture.id)}
                className={`
                  relative w-full text-left p-6 rounded-lg border-2 transition-all
                  ${SEVERITY_STYLES[fixture.severity]}
                  ${isSelected ? "ring-4 ring-blue-500/50 scale-[1.02]" : ""}
                `}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                  </div>
                )}

                {/* Content */}
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {fixture.name}
                    </h3>
                    <p className="text-slate-300 text-sm">
                      {fixture.description}
                    </p>
                  </div>
                  <div
                    className={`
                      px-3 py-1 rounded-full text-xs font-bold uppercase
                      ${SEVERITY_BADGE[fixture.severity]}
                    `}
                  >
                    {fixture.severity}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="relative my-12">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-slate-950 text-slate-400">OR</span>
          </div>
        </div>

        {/* GitHub PR URL Input */}
        <div className="mb-8">
          <div className="bg-slate-900/50 border-2 border-slate-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Analyze GitHub PR
            </h3>
            <form onSubmit={handleGitHubSubmit} className="space-y-4">
              <div>
                <label htmlFor="github-url" className="block text-sm text-slate-300 mb-2">
                  GitHub PR URL
                </label>
                <input
                  id="github-url"
                  type="text"
                  placeholder="https://github.com/owner/repo/pull/123"
                  value={githubUrl}
                  onChange={(e) => {
                    setGithubUrl(e.target.value);
                    setError(null);
                  }}
                  disabled={isAnalyzing}
                  className="
                    w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg
                    text-white placeholder-slate-500
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all
                  "
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-950/50 border border-red-500 rounded-lg">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isAnalyzing || !githubUrl.trim()}
                className="
                  w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold
                  rounded-lg transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600
                  shadow-lg shadow-blue-500/30
                "
              >
                {isAnalyzing ? "Analyzing..." : "Analyze PR →"}
              </button>
            </form>
            
            <p className="mt-4 text-xs text-slate-400">
              Note: Public repositories work without authentication. For private repos, configure GITHUB_TOKEN in backend/.env
            </p>
          </div>
        </div>

        {/* Start Button (for fixtures) */}
        <div className="text-center">
          <button
            onClick={() => router.push(`/island/aegis?fixture=${currentFixture}`)}
            className="
              px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold
              rounded-lg transition-all transform hover:scale-105
              shadow-lg shadow-blue-500/50
            "
          >
            Start Analysis →
          </button>
        </div>

        {/* Info */}
        <div className="mt-12 text-center text-sm text-slate-400">
          <p>
            Six specialist characters will review the selected PR
          </p>
          <p className="mt-1">
            Navigate between islands to see each character's findings
          </p>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
