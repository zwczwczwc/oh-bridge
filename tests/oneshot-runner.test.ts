import { describe, it, expect } from "vitest";
import { resolveWorkspacePath, buildHermesEnv } from "../src/helpers/oneshot-runner.js";

describe("resolveWorkspacePath", () => {
  it("returns current cwd when input is undefined", () => {
    const result = resolveWorkspacePath(undefined);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("resolves relative path under workspace root", () => {
    const result = resolveWorkspacePath(".");
    expect(result).toBe(process.cwd());
  });

  it("throws for path escaping above workspace root", () => {
    expect(() => resolveWorkspacePath("../../../etc")).toThrow("workspace_path");
  });

  it("throws for absolute path outside workspace", () => {
    expect(() => resolveWorkspacePath("/etc")).toThrow("workspace_path");
  });
});

describe("buildHermesEnv", () => {
  it("returns only whitelisted keys", () => {
    const env = buildHermesEnv();
    const keys = Object.keys(env);
    // Must not contain random keys from process.env
    expect(keys).not.toContain("NODE_ENV");
    expect(keys).not.toContain("npm_config_registry");
    // Should contain PATH
    expect(keys).toContain("PATH");
  });

  it("includes PATH when available", () => {
    const env = buildHermesEnv();
    expect(env.PATH).toBe(process.env.PATH);
  });
});