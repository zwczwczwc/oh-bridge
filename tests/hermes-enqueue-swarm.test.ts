import { describe, it, expect } from "vitest";
import { createHermesEnqueueTool } from "../src/tools/hermes-enqueue.js";
import { createHermesSwarmTool } from "../src/tools/hermes-swarm.js";

describe("createHermesEnqueueTool", () => {
  it("returns a tool with correct name", () => {
    const tool = createHermesEnqueueTool();
    expect(tool.name).toBe("hermes_enqueue");
    expect(tool.execute).toBeInstanceOf(Function);
  });
});

describe("createHermesSwarmTool", () => {
  it("returns a tool with correct name", () => {
    const tool = createHermesSwarmTool();
    expect(tool.name).toBe("hermes_swarm");
    expect(tool.execute).toBeInstanceOf(Function);
  });
});