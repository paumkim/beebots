import { describe, expect, it } from "vitest";
import { safeHref, safeImg } from "../src/safeUrl.js";

describe("safeHref", () => {
  it("keeps http(s) and same-origin paths", () => {
    expect(safeHref("https://github.com/paumkim/beebots")).toBe("https://github.com/paumkim/beebots");
    expect(safeHref("http://example.com/x")).toBe("http://example.com/x");
    expect(safeHref("/bees/bizzy.jpg")).toBe("/bees/bizzy.jpg");
  });

  it("rejects anything a browser would execute as a scheme", () => {
    for (const bad of [
      "javascript:alert(1)",
      "JavaScript:alert(1)",
      " javascript:alert(1)",
      "data:text/html,<script>alert(1)</script>",
      "vbscript:msgbox(1)",
      "file:///etc/passwd",
      "//evil.example.com/x",
      "not a url",
      "",
      null,
      undefined,
    ]) {
      expect(safeHref(bad)).toBeNull();
    }
  });

  it("normalises a trailing newline out of the value before deciding", () => {
    expect(safeHref("javascript:alert(1)\n")).toBeNull();
    expect(safeHref(" https://example.com/ ")).toBe("https://example.com/");
  });
});

describe("safeImg", () => {
  it("allows the inline placeholder the engine may hand back", () => {
    const svg = "data:image/svg+xml,%3Csvg%3E%3C/svg%3E";
    expect(safeImg(svg)).toBe(svg);
  });

  it("drops an absolute URL, so an img tag can never beacon to another host", () => {
    expect(safeImg("https://tracker.example/pixel.gif")).toBeNull();
    expect(safeImg("javascript:alert(1)")).toBeNull();
  });

  it("keeps a relative portrait path", () => {
    expect(safeImg("/bee-image/bee1")).toBe("/bee-image/bee1");
  });
});