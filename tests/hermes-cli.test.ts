import { describe, it, expect } from "vitest";
import { getProfiles, getProfileCapabilities, getAllProfilesForCapabilities } from "../src/helpers/hermes-cli.js";

describe("getProfiles", () => {
  it("returns at least 4 built-in profiles", () => {
    const profiles = getProfiles();
    expect(profiles.length).toBeGreaterThanOrEqual(4);
    const names = profiles.map((p) => p.name);
    expect(names).toContain("default");
    expect(names).toContain("coder");
    expect(names).toContain("reviewer");
    expect(names).toContain("researcher");
  });
});

describe("getProfileCapabilities", () => {
  it("returns capabilities for known profile", () => {
    const caps = getProfileCapabilities("coder");
    expect(caps).toContain("code_generation");
    expect(caps).toContain("debugging");
  });

  it("returns default capabilities for unknown profile", () => {
    const caps = getProfileCapabilities("nonexistent");
    expect(caps.length).toBeGreaterThan(0);
  });
});

describe("getAllProfilesForCapabilities", () => {
  it("returns map with all built-in profiles", () => {
    const all = getAllProfilesForCapabilities();
    expect(Object.keys(all)).toContain("coder");
    expect(Object.keys(all)).toContain("ops");
  });
});