import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createHermesExecuteTool } from "./tools/hermes-execute.js";
import { createHermesEnqueueTool } from "./tools/hermes-enqueue.js";
import { createHermesSwarmTool } from "./tools/hermes-swarm.js";
import { createHermesProfilesTool } from "./tools/hermes-profiles.js";
import { createHermesCapabilitiesTool } from "./tools/hermes-capabilities.js";

export default definePluginEntry({
  id: "oh-bridge",
  name: "oh-bridge",
  description: "OpenClaw × Hermes deep integration bridge — relay tasks to Hermes CLI agents",
  register(api: OpenClawPluginApi) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registerToolSafe = (tool: any) => api.registerTool(tool);
    registerToolSafe(createHermesExecuteTool());
    registerToolSafe(createHermesEnqueueTool());
    registerToolSafe(createHermesSwarmTool());
    registerToolSafe(createHermesProfilesTool());
    registerToolSafe(createHermesCapabilitiesTool());
    api.logger.info("[oh-bridge] 5 Hermes bridge tools registered");
  },
});

// Re-export helpers for external use
export { executeOneshot, resolveWorkspacePath, buildHermesEnv, terminateProcess } from "./helpers/oneshot-runner.js";
export { findHermesBinary, getProfiles, hermesVersionAvailable } from "./helpers/hermes-cli.js";
