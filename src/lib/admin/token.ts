"use client";

const TOKEN_KEY = "portfolio_admin_token";

export function getStoredAdminToken(): string {
  if (typeof window === "undefined") {
    return "";
  }
  return sessionStorage.getItem(TOKEN_KEY) ?? "";
}

function notifyAdminTokenChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("portfolio-admin-token"));
  }
}

export function setStoredAdminToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
  notifyAdminTokenChange();
}

export function clearStoredAdminToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  notifyAdminTokenChange();
}

export function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}
