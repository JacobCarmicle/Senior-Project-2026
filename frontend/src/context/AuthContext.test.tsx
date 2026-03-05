import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { renderWithProviders } from "../test/helpers";
import { useAuth } from "./AuthContext";

function AuthTestHarness() {
  const { user, loading, login, register, logout } = useAuth();
  const [error, setError] = useState("");

  if (loading) return <div>loading</div>;

  async function handleBadLogin() {
    try {
      await login("bad@example.com", "wrong");
    } catch {
      setError("login failed");
    }
  }

  return (
    <div>
      <div data-testid="user">{user ? user.email : "none"}</div>
      <div data-testid="error">{error}</div>
      <button onClick={() => login("test@example.com", "password123")}>login</button>
      <button onClick={() => register("new@example.com", "password123", "New User")}>
        register
      </button>
      <button onClick={() => logout()}>logout</button>
      <button onClick={handleBadLogin}>bad-login</button>
    </div>
  );
}

describe("AuthContext", () => {
  it("starts with no user and loading false when no token exists", async () => {
    renderWithProviders(<AuthTestHarness />);

    await waitFor(() => {
      expect(screen.queryByText("loading")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("user")).toHaveTextContent("none");
  });

  it("restores user from token on mount", async () => {
    localStorage.setItem("access_token", "mock-jwt-token-abc123");
    renderWithProviders(<AuthTestHarness />);

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("test@example.com");
    });
  });

  it("clears invalid token on mount", async () => {
    localStorage.setItem("access_token", "invalid-token");
    renderWithProviders(<AuthTestHarness />);

    await waitFor(() => {
      expect(screen.queryByText("loading")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(localStorage.getItem("access_token")).toBeNull();
  });

  it("login sets user and token", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthTestHarness />);

    await waitFor(() => {
      expect(screen.queryByText("loading")).not.toBeInTheDocument();
    });

    await user.click(screen.getByText("login"));

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("test@example.com");
    });
    expect(localStorage.getItem("access_token")).toBe("mock-jwt-token-abc123");
  });

  it("register sets user and token", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthTestHarness />);

    await waitFor(() => {
      expect(screen.queryByText("loading")).not.toBeInTheDocument();
    });

    await user.click(screen.getByText("register"));

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("test@example.com");
    });
    expect(localStorage.getItem("access_token")).toBe("mock-jwt-token-abc123");
  });

  it("logout clears user and token", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthTestHarness />);

    await waitFor(() => {
      expect(screen.queryByText("loading")).not.toBeInTheDocument();
    });

    await user.click(screen.getByText("login"));
    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("test@example.com");
    });

    await user.click(screen.getByText("logout"));
    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("none");
    });
    expect(localStorage.getItem("access_token")).toBeNull();
  });

  it("failed login does not set user", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AuthTestHarness />);

    await waitFor(() => {
      expect(screen.queryByText("loading")).not.toBeInTheDocument();
    });

    await user.click(screen.getByText("bad-login"));

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("login failed");
    });

    expect(screen.getByTestId("user")).toHaveTextContent("none");
    expect(localStorage.getItem("access_token")).toBeNull();
  });
});
