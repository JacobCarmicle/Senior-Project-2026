import { render, screen } from "@testing-library/react";
import HeroPanel from "./HeroPanel";

const features = [
  { title: "Feature A", description: "Desc A" },
  { title: "Feature B", description: "Desc B" },
];

describe("HeroPanel", () => {
  it("renders heading and subtext", () => {
    render(
      <HeroPanel heading="Test Heading" subtext="Test subtext" features={features} />,
    );

    expect(screen.getByRole("heading", { name: "Test Heading" })).toBeInTheDocument();
    expect(screen.getByText("Test subtext")).toBeInTheDocument();
  });

  it("renders all feature items with checkmarks", () => {
    render(
      <HeroPanel heading="H" subtext="S" features={features} />,
    );

    expect(screen.getByText("Feature A")).toBeInTheDocument();
    expect(screen.getByText("Desc A")).toBeInTheDocument();
    expect(screen.getByText("Feature B")).toBeInTheDocument();
    expect(screen.getByText("Desc B")).toBeInTheDocument();

    const checks = screen.getAllByText("✓");
    expect(checks).toHaveLength(2);
  });

  it("renders tip when provided", () => {
    render(
      <HeroPanel heading="H" subtext="S" features={[]} tip="Pro tip here" />,
    );

    expect(screen.getByText("Pro tip here")).toBeInTheDocument();
  });

  it("does not render tip when omitted", () => {
    render(
      <HeroPanel heading="H" subtext="S" features={[]} />,
    );

    expect(screen.queryByText("Pro tip")).not.toBeInTheDocument();
  });
});
