import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import path from "node:path";

let cachedHermesPath: string | null = null;

export function findHermesBinary(): string {
  if (cachedHermesPath) return cachedHermesPath;

  // Try common locations
  const candidates = [
    path.join(homedir(), ".local", "bin", "hermes"),
    path.join(homedir(), "bin", "hermes"),
    "/usr/local/bin/hermes",
    "/opt/homebrew/bin/hermes",
  ];

  for (const candidate of candidates) {
    try {
      const r = spawnSync("test", ["-x", candidate], { timeout: 1000 });
      if (r.status === 0) {
        cachedHermesPath = candidate;
        return candidate;
      }
    } catch {
      // try next
    }
  }

  // Fallback: try "hermes" from PATH in runtime
  cachedHermesPath = "hermes";
  return cachedHermesPath;
}

export function hermesVersionAvailable(): boolean {
  try {
    const r = spawnSync("hermes", ["--version"], { timeout: 5000, encoding: "utf-8" });
    return r.status === 0;
  } catch {
    return false;
  }
}

export function hermesKanbanAvailable(): boolean {
  try {
    const r = spawnSync("hermes", ["kanban", "--help"], { timeout: 5000, encoding: "utf-8" });
    return r.status === 0;
  } catch {
    return false;
  }
}

export interface ProfileInfo {
  name: string;
  description?: string;
  tools?: string[];
  model?: string;
}

const BUILTIN_PROFILES: readonly ProfileInfo[] = [
  { name: "default", description: "General-purpose agent", tools: [] },
  { name: "coder", description: "Coding & debugging agent", tools: ["terminal", "file", "web"] },
  { name: "reviewer", description: "Code review & audit agent", tools: ["terminal", "file", "web"] },
  { name: "researcher", description: "Research & analysis agent", tools: ["web", "file"] },
  { name: "ops", description: "Deployment & infrastructure agent", tools: ["terminal", "file", "web"] },
];

export function listProfilesLive(): ProfileInfo[] {
  try {
    const r = spawnSync("hermes", ["profile", "list"], {
      timeout: 5000,
      encoding: "utf-8",
    });
    if (r.status !== 0 || !r.stdout) return [];
    const lines = r.stdout.trim().split("\n").filter(Boolean);
    // First line is header like "Available profiles:" -- skip it
    return lines.slice(1).map((line: string) => {
      const trimmed = line.trim();
      const match = trimmed.match(/^(\S+)(?:\s+(.+))?$/);
      return {
        name: match?.[1] ?? trimmed,
        description: match?.[2]?.trim(),
      };
    });
  } catch {
    return [];
  }
}

export function getProfiles(): ProfileInfo[] {
  const live = listProfilesLive();
  if (live.length > 0) return live;
  return [...BUILTIN_PROFILES];
}

const CAPABILITIES_TABLE: Readonly<Record<string, readonly string[]>> = {
  default: ["terminal", "file_operations", "web_search"],
  coder: ["terminal", "file_operations", "web_search", "code_generation", "debugging"],
  reviewer: ["code_review", "security_audit", "web_search", "file_operations"],
  researcher: ["web_search", "data_analysis", "file_operations"],
  ops: ["terminal", "file_operations", "deployment", "infrastructure"],
};

export function getProfileCapabilities(profile: string): readonly string[] {
  return CAPABILITIES_TABLE[profile] ?? CAPABILITIES_TABLE["default"] ?? [];
}

export function getAllProfilesForCapabilities(): Record<string, readonly string[]> {
  return { ...CAPABILITIES_TABLE };
}