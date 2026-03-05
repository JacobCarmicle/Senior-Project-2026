import { login, signup, logout, forgotPassword, resetPassword, getMe, googleOAuth } from "./auth";

describe("auth API service", () => {
  describe("login", () => {
    it("returns auth response for valid credentials", async () => {
      const res = await login({ email: "test@example.com", password: "password123" });
      expect(res.access_token).toBe("mock-jwt-token-abc123");
      expect(res.user.email).toBe("test@example.com");
    });

    it("throws on invalid credentials", async () => {
      await expect(login({ email: "bad@example.com", password: "wrong" })).rejects.toThrow();
    });
  });

  describe("signup", () => {
    it("returns auth response for new user", async () => {
      const res = await signup({
        email: "new@example.com",
        password: "password123",
        full_name: "New User",
      });
      expect(res.access_token).toBeDefined();
      expect(res.user).toBeDefined();
    });

    it("throws when email is already taken", async () => {
      await expect(
        signup({ email: "taken@example.com", password: "password123", full_name: "Dup" }),
      ).rejects.toThrow();
    });
  });

  describe("googleOAuth", () => {
    it("returns auth response for valid google token", async () => {
      const res = await googleOAuth("google-id-token");
      expect(res.access_token).toBe("mock-jwt-token-abc123");
    });
  });

  describe("logout", () => {
    it("completes without error", async () => {
      await expect(logout()).resolves.toBeUndefined();
    });
  });

  describe("forgotPassword", () => {
    it("returns success message", async () => {
      const res = await forgotPassword({ email: "test@example.com" });
      expect(res.message).toBe("Reset link sent");
    });
  });

  describe("resetPassword", () => {
    it("returns success for valid token", async () => {
      const res = await resetPassword({ token: "valid-token", new_password: "newpass123" });
      expect(res.message).toBe("Password reset successful");
    });

    it("throws for expired token", async () => {
      await expect(
        resetPassword({ token: "expired", new_password: "newpass123" }),
      ).rejects.toThrow();
    });
  });

  describe("getMe", () => {
    it("returns user when authorized", async () => {
      localStorage.setItem("access_token", "mock-jwt-token-abc123");
      const user = await getMe();
      expect(user.email).toBe("test@example.com");
      expect(user.role).toBe("user");
    });

    it("throws when unauthorized", async () => {
      await expect(getMe()).rejects.toThrow();
    });
  });
});
