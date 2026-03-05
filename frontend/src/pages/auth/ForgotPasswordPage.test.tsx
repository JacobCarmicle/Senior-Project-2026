import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/helpers";
import ForgotPasswordPage from "./ForgotPasswordPage";

describe("ForgotPasswordPage", () => {
  it("renders the forgot password form", () => {
    renderWithProviders(<ForgotPasswordPage />, { route: "/forgot-password" });

    expect(screen.getByRole("heading", { name: /forgot password/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("has a link back to login", () => {
    renderWithProviders(<ForgotPasswordPage />, { route: "/forgot-password" });

    const link = screen.getByRole("link", { name: /log in/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("shows confirmation message after submitting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />, { route: "/forgot-password" });

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });

  it("allows sending the link again from confirmation screen", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordPage />, { route: "/forgot-password" });

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /send again/i }));

    expect(screen.getByRole("heading", { name: /forgot password/i })).toBeInTheDocument();
  });

  it("renders the hero panel", () => {
    renderWithProviders(<ForgotPasswordPage />, { route: "/forgot-password" });

    expect(screen.getByText(/secure reset link/i)).toBeInTheDocument();
    expect(screen.getByText(/fast turnaround/i)).toBeInTheDocument();
  });
});
