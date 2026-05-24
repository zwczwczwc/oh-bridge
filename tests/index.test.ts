import { describe, it, expect } from "vitest";
import { createHermesExecuteTool } from "../src/tools/hermes-execute.js";
import { createHermesEnqueueTool } from "../src/tools/hermes-enqueue.js";
import { createHermesSwarmTool } from "../src/tools/hermes-swarm.js";
import { createHermesProfilesTool } from "../src/tools/hermes-profiles.js";
import { createHermesCapabilitiesTool } from "../src/tools/hermes-capabilities.js";

describe("oh-bridge tool suite", () => {
  it("returns exactly 5 tools", () => {
    const tools = [
      createHermesExecuteTool(),
      createHermesEnqueueTool(),
      createHermesSwarmTool(),
      createHermesProfilesTool(),
      createHermesCapabilitiesTool(),
    ];
    expect(tools).toHaveLength(5);
  });

  it("all tools have required fields", () => {
    const tools = [
      createHermesExecuteTool(),
      createHermesEnqueueTool(),
      createHermesSwarmTool(),
      createHermesProfilesTool(),
      createHermesCapabilitiesTool(),
    ];
    for (const tool of tools) {
      expect(tool.name).toBeTruthy();
      expect(tool.label).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.parameters).toBeDefined();
      expect(tool.execute).toBeInstanceOf(Function);
    }
  });

  it("includes all expected tool names", () => {
    const tools = [
      createHermesExecuteTool(),
      createHermesEnqueueTool(),
      createHermesSwarmTool(),
      createHermesProfilesTool(),
      createHermesCapabilitiesTool(),
    ];
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      "hermes_capabilities",
      "hermes_enqueue",
      "hermes_execute",
      "hermes_profiles",
      "hermes_swarm",
    ]);
  });
});
