import type { ApiValidationError } from "../types";

export const ERROR_MESSAGES: Record<string, string> = {
  "invalid credentials": "Email or password is incorrect.",
  "email already registered": "This email is already registered.",
  "user not found": "User account not found.",
  "admin auth is not configured": "Admin sign in is not available right now.",
  "artwork not found": "The artwork you requested could not be found.",
  "bid must be higher": "Your bid must be higher than the current highest bid.",
  "auction is closed": "This auction has ended and no longer accepts bids.",
  unauthorized: "Your session is no longer valid. Please log in again.",
  "invalid token": "Your session has expired. Please log in again.",
  "token expired": "Your session has expired. Please log in again.",
  network: "Network error. Please check your connection and retry.",
};

const FALLBACK_ERROR = "Something went wrong. Please try again.";

const normalizeErrorKey = (value: string): string => value.trim().toLowerCase();

const mapKnownError = (detail: string): string => {
  const normalized = normalizeErrorKey(detail);
  for (const [pattern, mapped] of Object.entries(ERROR_MESSAGES)) {
    if (normalized.includes(pattern)) {
      return mapped;
    }
  }
  return detail;
};

const mapValidationErrors = (errors: ApiValidationError[]): string => {
  if (!errors.length) {
    return FALLBACK_ERROR;
  }
  const first = errors[0];
  if (!first) {
    return FALLBACK_ERROR;
  }
  return first.msg ? mapKnownError(first.msg) : FALLBACK_ERROR;
};

export const extractApiErrorDetail = (data: unknown): string | undefined => {
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const record = data as Record<string, unknown>;

  if (typeof record.detail === "string") {
    return record.detail;
  }
  if (Array.isArray(record.detail)) {
    return mapValidationErrors(record.detail as ApiValidationError[]);
  }
  if (typeof record.message === "string") {
    return record.message;
  }
  if (typeof record.error === "string") {
    return record.error;
  }

  return undefined;
};

export const mapErrorMessage = (errorDetail?: string): string => {
  if (!errorDetail) {
    return FALLBACK_ERROR;
  }
  return mapKnownError(errorDetail);
};
