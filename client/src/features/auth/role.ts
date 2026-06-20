// Lightweight role handling — no real auth. The role chosen on the landing
// screen is stored locally and surfaced in the dashboard topbar.

export type Role = "manager" | "technician";

const KEY = "lb-role";

export const ROLE_LABEL: Record<Role, string> = {
  manager: "Manager",
  technician: "Technician",
};

export function setRole(role: Role) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, role);
  // also a cookie so the choice is readable elsewhere if needed
  document.cookie = `${KEY}=${role}; path=/; max-age=2592000; samesite=lax`;
}

export function getRole(): Role | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KEY);
  return v === "manager" || v === "technician" ? v : null;
}
