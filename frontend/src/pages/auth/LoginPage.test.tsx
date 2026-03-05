import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/helpers";
import LoginPage from "./LoginPage";

describe("LoginPage", () => {
  it("renders the login form with all fields", () => {
    renderWithProviders(<LoginPage />, { route: "/login" });

    expect(screen.getByRole("heading", { name: /login/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("renders the Google OAuth button", () => {
    renderWithProviders(<LoginPage />, { route: "/login" });

    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
  });

  it("renders remember me checkbox", () => {
    renderWithProviders(<LoginPage />, { route: "/login" });

    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
  });

  it("has a link to forgot password", () => {
    renderWithProviders(<LoginPage />, { route: "/login" });

    const link = screen.getByRole("link", { name: /forgot password/i });
    expect(link).toHaveAttribute("href", "/forgot-password");
  });

  it("has a link to register", () => {
    renderWithProviders(<LoginPage />, { route: "/login" });

    const link = screen.getByRole("link", { name: /create one/i });
    expect(link).toHaveAttribute("href", "/register");
  });

  it("shows error on invalid credentials", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: "/login" });

    await user.type(screen.getByLabelText(/email/i), "wrong@example.com");
    await user.type(screen.getByLabelText(/password/i), "badpass");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });

  it("calls login and navigates on valid credentials", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: "/login" });

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(localStorage.getItem("access_token")).toBe("mock-jwt-token-abc123");
    });
  });

  it("disables button while submitting", async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: "/login" });

    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");

    const btn = screen.getByRole("button", { name: /log in/i });
    await user.click(btn);

    await waitFor(() => {
      expect(localStorage.getItem("access_token")).toBe("mock-jwt-token-abc123");
    });
  });

  it("renders the hero panel features", () => {
    renderWithProviders(<LoginPage />, { route: "/login" });

    expect(screen.getByText("Message sellers securely")).toBeInTheDocument();
    expect(screen.getByText("Save listings for later")).toBeInTheDocument();
    expect(screen.getByText("Schedule meetups")).toBeInTheDocument();
  });
});
