import { spawn } from "node:child_process";
import { Type } from "typebox";
import type { AnyAgentTool } from "./common.js";
import { jsonResult, readStringParam } from "./common.js";
import { buildHermesEnv } from "../helpers/oneshot-runner.js";

const SWARM_SPAWN_TIMEOUT_MS = 30_000;

export function createHermesSwarmTool(): AnyAgentTool {
  return {
    name: "hermes_swarm",
    label: "Hermes Swarm",
    description:
      "Create a Kanban swarm: planning root → parallel workers → verifier → synthesizer. " +
      "Each worker gets its own Hermes profile. Requires Hermes Gateway running. " +
      "NOT auto-announced — poll Kanban board for results.",
    parameters: Type.Object({
      goal: Type.String(),
      workers: Type.Array(
        Type.Object({
          profile: Type.String(),
          title: Type.String(),
          body: Type.String(),
          skills: Type.Optional(Type.Array(Type.String())),
          priority: Type.Optional(Type.Number({ default: 0 })),
        }),
      ),
      verifier_profile: Type.String(),
      synthesizer_profile: Type.String(),
    }),
    execute: async (_toolCallId, args) => {
      const params = args as Record<string, unknown>;
      const goal = readStringParam(params, "goal", { required: true })!;
      const workers = params.workers as Array<Record<string, unknown>>;

      const workerArgs: string[] = [];
      for (const w of workers) {
        const skills = (w.skills as string[])?.join(",") ?? "";
        workerArgs.push("--worker", `${w.profile}:${w.title}${skills ? `:${skills}` : ""}`);
      }

      return new Promise((resolve) => {
        const proc = spawn("hermes", [
          "kanban", "swarm", "create",
          "--goal", goal,
          ...workerArgs,
          "--verifier", readStringParam(params, "verifier_profile", { required: true })!,
          "--synthesizer", readStringParam(params, "synthesizer_profile", { required: true })!,
        ], {
          env: buildHermesEnv(),
          stdio: ["ignore", "pipe", "pipe"],
        });

        let stdout = "";
        let stderr = "";
        let timedOut = false;

        const timer = setTimeout(() => {
          timedOut = true;
          proc.kill();
        }, SWARM_SPAWN_TIMEOUT_MS);

        proc.stdout.on("data", (c: Buffer) => { stdout += c.toString(); });
        proc.stderr.on("data", (c: Buffer) => { stderr += c.toString(); });
        proc.on("close", (code) => {
          clearTimeout(timer);
          const exitCode = timedOut ? -1 : (code ?? -1);
          resolve(
            exitCode !== 0
              ? jsonResult({
                  status: "failed",
                  summary: "Swarm creation failed. Ensure Hermes Gateway is running.",
                  errors: [stderr.slice(0, 1000)],
                })
              : jsonResult({
                  status: "queued",
                  summary: `Swarm created: ${workers.length} workers → verifier → synthesizer`,
                  output: stdout.slice(0, 2000),
                }),
          );
        });
        proc.on("error", () =>
          resolve(
            jsonResult({
              status: "failed",
              summary: "Failed to spawn hermes CLI",
            }),
          ),
        );
      });
    },
  };
}