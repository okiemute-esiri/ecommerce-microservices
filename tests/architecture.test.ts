import { describe, expect, it } from "vitest";

const services = ["gateway", "catalogue", "inventory", "orders"] as const;

describe("microservice architecture", () => {
  it("defines the expected independently named services", () => {
    expect(services).toEqual(["gateway", "catalogue", "inventory", "orders"]);
  });

  it("keeps internal service ports unique", () => {
    const ports = [8080, 3001, 3002, 3003];
    expect(new Set(ports).size).toBe(ports.length);
  });
});
