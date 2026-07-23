import { afterEach, describe, expect, it } from "vitest";
import { resolveAppPublicOrigin } from "@/utils/app_public_url.js";

describe("resolveAppPublicOrigin", () => {
  const original_app_infos = window.app_infos;
  const original_origin = window.location.origin;

  afterEach(() => {
    window.app_infos = original_app_infos;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: original_origin },
    });
  });

  it("returns the origin from settings public_url", () => {
    window.app_infos = { public_url: "https://softgems.example.com/" };
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: "http://localhost:8080" },
    });

    expect(resolveAppPublicOrigin()).toBe("https://softgems.example.com");
  });

  it("falls back to window.location.origin when public_url is empty", () => {
    window.app_infos = { public_url: "" };
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: "http://localhost:8080" },
    });

    expect(resolveAppPublicOrigin()).toBe("http://localhost:8080");
  });

  it("ignores invalid public_url values", () => {
    window.app_infos = { public_url: "not a valid url" };
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: "http://localhost:8080" },
    });

    expect(resolveAppPublicOrigin()).toBe("http://localhost:8080");
  });
});
