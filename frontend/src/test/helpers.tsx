import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter, type MemoryRouterProps } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import type { ReactElement, ReactNode } from "react";

interface WrapperOptions {
  route?: string;
  routerProps?: MemoryRouterProps;
}

function createWrapper({ route = "/", routerProps }: WrapperOptions = {}) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[route]} {...routerProps}>
        <AuthProvider>{children}</AuthProvider>
      </MemoryRouter>
    );
  };
}

export function renderWithProviders(
  ui: ReactElement,
  options?: WrapperOptions & Omit<RenderOptions, "wrapper">,
) {
  const { route, routerProps, ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: createWrapper({ route, routerProps }),
    ...renderOptions,
  });
}
