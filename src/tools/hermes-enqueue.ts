import { spawn } from "node:child_process";
import { Type } from "typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam } from "./common.js";
import { buildHermesEnv } from "../helpers/oneshot-runner.js";

const KANBAN_SPAWN_TIMEOUT_MS = 30_000;

function kanbanCreate(params: Record<string, unknown>): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const goal = readStringParam(params, "goal", { required: true })!;
  const context = readStringParam(params, "context");
  const profile = readStringParam(params, "profile") ?? "default";

  const kanbanArgs = [
    "kanban", "create",
    goal.slice(0, 80),
    "--body", context ?? "",
    "--assignee", profile,
    "--priority", String(params.priority ?? 0),
  ];

  return new Promise((resolve) => {
    const proc = spawn("hermes", kanbanArgs, {
      env: buildHermesEnv(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill();
    }, KANBAN_SPAWN_TIMEOUT_MS);

    proc.stdout.on("data", (c: Buffer) => { stdout += c.toString(); });
    proc.stderr.on("data", (c: Buffer) => { stderr += c.toString(); });
    proc.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: timedOut ? -1 : (code ?? -1) });
    });
    proc.on("error", () => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: -1 });
    });
  });
}

function extractKanbanTaskId(stdout: string): string | null {
  const match = stdout.match(/task[:\s]+([a-zA-Z0-9_-]+)/i);
  return match ? match[1] : null;
}

export function createHermesEnqueueTool(): AnyAgentTool {
  return {
    name: "hermes_enqueue",
    label: "Hermes Enqueue",
    description:
      "Push a task to Hermes Kanban Board for parallel, multi-worker execution. " +
      "The Kanban Dispatcher (in Hermes Gateway) schedules workers. " +
      "Requires Hermes Gateway to be running. " +
      "NOT auto-announced — poll with `hermes kanban show <id>` for results.",
    parameters: Type.Object({
      goal: Type.String(),
      profile: Type.Optional(Type.String({ default: "default" })),
      context: Type.Optional(Type.String()),
      priority: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
      parents: Type.Optional(Type.Array(Type.String())),
      max_runtime_seconds: Type.Optional(Type.Number()),
      skills: Type.Optional(Type.Array(Type.String())),
      workspace_kind: Type.Optional(
        Type.String({ enum: ["scratch", "worktree", "dir"], default: "scratch" }),
      ),
    }),
    execute: async (_toolCallId, args) => {
      const result = await kanbanCreate(args as Record<string, unknown>);

      if (result.exitCode !== 0) {
        return jsonResult({
          status: "failed",
          summary: "Kanban task creation failed",
          errors: [result.stderr.slice(0, 1000)],
        });
      }

      const taskId = extractKanbanTaskId(result.stdout);
      return jsonResult({
        status: "queued",
        summary: "Task queued in Kanban Board",
        kanban_task_id: taskId,
        note: taskId
          ? `Monitor with: hermes kanban show ${taskId}`
          : "Task created but ID could not be parsed.",
      });
    },
  };
}