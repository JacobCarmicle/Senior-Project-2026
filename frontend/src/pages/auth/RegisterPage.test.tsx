import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/helpers";
import RegisterPage from "./RegisterPage";

describe("RegisterPage", () => {
  it("renders the registration form with all fields", () => {
    renderWithProviders(<RegisterPage />, { route: "/register" });

    expect(screen.getByRole("heading", { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });

  it("renders a link back to login", () => {
    renderWithProviders(<RegisterPage />, { route: "/register" });

    const link = screen.getByRole("link", { name: /log in/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("renders Google OAuth button", () => {
    renderWithProviders(<RegisterPage />, { route: "/register" });

    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
  });

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: "/register" });

    await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/^email$/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password999");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it("shows error when password is too short", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: "/register" });

    await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/^email$/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "short");
    await user.type(screen.getByLabelText(/confirm password/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it("registers successfully with valid data", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: "/register" });

    await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/^email$/i), "jane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(localStorage.getItem("access_token")).toBe("mock-jwt-token-abc123");
    });
  });

  it("shows error when email is already taken", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: "/register" });

    await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/^email$/i), "taken@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
    });
  });

  it("renders the hero panel features", () => {
    renderWithProviders(<RegisterPage />, { route: "/register" });

    expect(screen.getByText(/list items in seconds/i)).toBeInTheDocument();
    expect(screen.getByText(/connect with local buyers/i)).toBeInTheDocument();
    expect(screen.getByText(/build your reputation/i)).toBeInTheDocument();
  });
});
