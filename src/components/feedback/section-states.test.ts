// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { createElement } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { SectionHeader } from "@/components/feedback/section-header";
import { EmptyState } from "@/components/feedback/empty-state";

afterEach(() => {
  cleanup();
});

describe("SectionHeader", () => {
  it("renders the title and a See All link", () => {
    render(createElement(SectionHeader, { title: "Your Watchlist", seeAllHref: "/watchlist" }));

    expect(screen.getByText("Your Watchlist")).toBeDefined();
    const link = screen.getByText("See All").closest("a");
    expect(link?.getAttribute("href")).toBe("/watchlist");
  });

  it("omits the link when no href is given", () => {
    render(createElement(SectionHeader, { title: "Top 10" }));

    expect(screen.getByText("Top 10")).toBeDefined();
    expect(screen.queryByText("See All")).toBeNull();
  });
});

describe("EmptyState", () => {
  it("renders icon, title, and description", () => {
    render(
      createElement(EmptyState, {
        icon: createElement("span", { "data-testid": "empty-icon" }),
        title: "No movies in this tag yet.",
        description: "Try another tag.",
      })
    );

    expect(screen.getByTestId("empty-icon")).toBeDefined();
    expect(screen.getByText("No movies in this tag yet.")).toBeDefined();
    expect(screen.getByText("Try another tag.")).toBeDefined();
  });
});