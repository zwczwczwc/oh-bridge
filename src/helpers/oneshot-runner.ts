import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const PASS_ENV_KEYS = [
  "PATH",
  "Path",
  "HOME",
  "USERPROFILE",
  "SYSTEMROOT",
  "ComSpec",
  "HERMES_HOME",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
];

const MAX_STDOUT_BYTES = 1_048_576; // 1 MB
const MAX_STDERR_BYTES = 262_144;   // 256 KB

export function buildHermesEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const key of PASS_ENV_KEYS) {
    const value = process.env[key];
    if (typeof value === "string") {
      env[key] = value;
    }
  }
  return env;
}

function realpathSafe(p: string): string {
  try {
    return fs.realpathSync(p);
  } catch {
    // Path may not exist yet — resolve parent dirs first
    if (fs.existsSync(p)) throw new Error(`Cannot resolve realpath for: ${p}`);
    const parent = path.dirname(p);
    if (parent === p) return p; // root
    return path.join(fs.realpathSync(parent), path.basename(p));
  }
}

export function resolveWorkspacePath(input: string | undefined): string {
  const root = fs.realpathSync(process.cwd());
  const candidate = input ? path.resolve(input) : root;
  const resolved = realpathSafe(candidate);
  if (!resolved.startsWith(root + path.sep) && resolved !== root) {
    throw new Error(`workspace_path must stay under workspace root: ${root}`);
  }
  return resolved;
}

export function terminateProcess(proc: ChildProcess): void {
  if (!proc.pid || proc.killed) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(proc.pid), "/t", "/f"], { stdio: "ignore" });
    return;
  }
  proc.kill("SIGTERM");
  setTimeout(() => {
    if (!proc.killed) {
      proc.kill("SIGKILL");
    }
  }, 5000);
}

export interface OneshotParams {
  prompt: string;
  profile: string;
  toolsets?: string;
  model?: string;
  cwd: string;
  timeoutMs: number;
  signal?: AbortSignal;
}

export interface OneshotResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  cancelled: boolean;
}

export function executeOneshot(params: OneshotParams): Promise<OneshotResult> {
  const args = ["-z", params.prompt, "-p", params.profile];
  if (params.toolsets) args.push("-t", params.toolsets);
  if (params.model) args.push("-m", params.model);

  return new Promise((resolve) => {
    const proc = spawn("hermes", args, {
      cwd: params.cwd,
      env: buildHermesEnv(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let stdoutOverflow = false;
    let stderrOverflow = false;
    let timedOut = false;
    let cancelled = false;

    let finished = false;
    const finish = (exitCode: number) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try {
        params.signal?.removeEventListener("abort", onAbort);
      } catch {
        // ignore if already removed
      }
      resolve({ stdout, stderr, exitCode, timedOut, cancelled });
    };

    const onAbort = () => {
      cancelled = true;
      terminateProcess(proc);
    };

    const timer = setTimeout(() => {
      timedOut = true;
      terminateProcess(proc);
    }, params.timeoutMs);

    if (params.signal) {
      if (params.signal.aborted) {
        cancelled = true;
        terminateProcess(proc);
      } else {
        params.signal.addEventListener("abort", onAbort, { once: true });
      }
    }

    proc.stdout.on("data", (c: Buffer) => {
      if (stdoutOverflow) return;
      if (stdout.length + c.length <= MAX_STDOUT_BYTES) {
        stdout += c.toString();
      } else {
        stdoutOverflow = true;
      }
    });
    proc.stderr.on("data", (c: Buffer) => {
      if (stderrOverflow) return;
      if (stderr.length + c.length <= MAX_STDERR_BYTES) {
        stderr += c.toString();
      } else {
        stderrOverflow = true;
      }
    });
    proc.on("close", (code) => finish(code ?? -1));
    proc.on("error", () => finish(-1));
  });
}