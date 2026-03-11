import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/helpers";
import ResetPasswordPage from "./ResetPasswordPage";

function getPasswordField() {
  return screen.getByLabelText("New Password");
}

function getConfirmField() {
  return screen.getByLabelText("Confirm New Password");
}

describe("ResetPasswordPage", () => {
  it("renders the reset password form", () => {
    renderWithProviders(<ResetPasswordPage />, {
      route: "/reset-password?token=valid-token",
    });

    expect(screen.getByRole("heading", { name: /reset password/i })).toBeInTheDocument();
    expect(getPasswordField()).toBeInTheDocument();
    expect(getConfirmField()).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset password/i })).toBeInTheDocument();
  });

  it("has a link back to login", () => {
    renderWithProviders(<ResetPasswordPage />, {
      route: "/reset-password?token=valid-token",
    });

    const link = screen.getByRole("link", { name: /back to login/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />, {
      route: "/reset-password?token=valid-token",
    });

    await user.type(getPasswordField(), "newpass123");
    await user.type(getConfirmField(), "different1");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it("shows error when password is too short", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />, {
      route: "/reset-password?token=valid-token",
    });

    await user.type(getPasswordField(), "short");
    await user.type(getConfirmField(), "short");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
  });

  it("shows error when token is missing", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />, {
      route: "/reset-password",
    });

    await user.type(getPasswordField(), "newpass123");
    await user.type(getConfirmField(), "newpass123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    expect(screen.getByText(/invalid or expired/i)).toBeInTheDocument();
  });

  it("shows success screen after successful reset", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />, {
      route: "/reset-password?token=valid-token",
    });

    await user.type(getPasswordField(), "newpass123");
    await user.type(getConfirmField(), "newpass123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password updated/i)).toBeInTheDocument();
    });

    const loginLink = screen.getByRole("link", { name: /go to login/i });
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("shows error when reset token is expired", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordPage />, {
      route: "/reset-password?token=expired",
    });

    await user.type(getPasswordField(), "newpass123");
    await user.type(getConfirmField(), "newpass123");
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/token expired/i)).toBeInTheDocument();
    });
  });
});
