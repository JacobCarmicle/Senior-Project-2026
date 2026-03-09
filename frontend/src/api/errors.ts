import { isAxiosError } from "axios";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string" && detail.trim().length > 0) {
      return detail;
    }

    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (first?.msg) return String(first.msg);
    }

    if (error.message) return error.message;
  }

  return fallback;
}
