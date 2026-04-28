import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/helpers";
import RegisterPage from "./RegisterPage";

/** Step 1 → 2: identity form submits on Enter from the email field. */
async function goToPasswordStep(
  user: ReturnType<typeof userEvent.setup>,
  email = "jane@example.com",
) {
  await user.type(screen.getByPlaceholderText(/^Full name$/i), "Jane Doe");
  await user.type(screen.getByPlaceholderText(/^Email address$/i), email);
  await user.keyboard("{Enter}");
  await screen.findByRole("heading", { name: /set your password/i });
}

describe("RegisterPage", () => {
  it("renders step 1 with identity fields and tagline", () => {
    renderWithProviders(<RegisterPage />, { route: "/register" });

    expect(screen.getByRole("heading", { name: /create an account/i })).toBeInTheDocument();
    expect(screen.getByText(/buy and sell locally with tradeforge/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^Full name$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^Email address$/i)).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/^Password \(min\. 8 characters\)$/i),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
  });

  it("renders password step with confirm and submit after identity", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: "/register" });

    await goToPasswordStep(user, "jane2@example.com");

    expect(screen.getByText(/almost there/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/^Password \(min\. 8 characters\)$/i),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^Confirm password$/i)).toBeInTheDocument();
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

    await goToPasswordStep(user);

    await user.type(
      screen.getByPlaceholderText(/^Password \(min\. 8 characters\)$/i),
      "password123",
    );
    await user.type(screen.getByPlaceholderText(/^Confirm password$/i), "password999");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it("shows error when password is too short", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: "/register" });

    await goToPasswordStep(user);

    await user.type(
      screen.getByPlaceholderText(/^Password \(min\. 8 characters\)$/i),
      "short",
    );
    await user.type(screen.getByPlaceholderText(/^Confirm password$/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it("registers successfully with valid data", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: "/register" });

    await goToPasswordStep(user);

    await user.type(
      screen.getByPlaceholderText(/^Password \(min\. 8 characters\)$/i),
      "password123",
    );
    await user.type(screen.getByPlaceholderText(/^Confirm password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(localStorage.getItem("access_token")).toBe("mock-jwt-token-abc123");
    });
  });

  it("shows error when email is already taken", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: "/register" });

    await goToPasswordStep(user, "taken@example.com");

    await user.type(
      screen.getByPlaceholderText(/^Password \(min\. 8 characters\)$/i),
      "password123",
    );
    await user.type(screen.getByPlaceholderText(/^Confirm password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
    });
  });
});
