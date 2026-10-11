// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { createElement } from "react";
import { highlightMatch } from "@/app/(main)/explore/search-command-dialog";

afterEach(() => {
  cleanup();
});

describe("highlightMatch", () => {
  it("highlights every occurrence regardless of position", () => {
    render(createElement("p", null, highlightMatch("Action Action", "action")));

    const highlighted = screen.getAllByText("Action");
    expect(highlighted).toHaveLength(2);
  });

  it("returns plain text when there is no match", () => {
    render(createElement("p", null, highlightMatch("Dune", "xyz")));

    expect(screen.getByText("Dune")).toBeDefined();
    expect(screen.queryByText("Dune")?.tagName).toBe("P");
  });
});
