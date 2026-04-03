import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/helpers";
import AuthLayout from "./AuthLayout";

describe("AuthLayout", () => {
  it("renders the TradeForge brand link", () => {
    renderWithProviders(
      <AuthLayout>
        <div>child content</div>
      </AuthLayout>,
    );

    const brand = screen.getByRole("link", { name: /tradeforge/i });
    expect(brand).toBeInTheDocument();
    expect(brand).toHaveAttribute("href", "/");
  });

  it("renders children inside main", () => {
    renderWithProviders(
      <AuthLayout>
        <p>Hello world</p>
      </AuthLayout>,
    );

    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });

  it("renders a header banner", () => {
    renderWithProviders(
      <AuthLayout>
        <div />
      </AuthLayout>,
    );

    const header = screen.getByRole("banner");
    expect(header).toBeInTheDocument();
  });
});
