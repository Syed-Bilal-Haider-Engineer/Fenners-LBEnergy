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

function getRoleFromCookie(): Role | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${KEY}=`));
  const value = match?.split("=")[1] ?? null;
  return value === "manager" || value === "technician" ? value : null;
}

export function getRole(): Role | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KEY);
  if (v === "manager" || v === "technician") return v;
  const cookieRole = getRoleFromCookie();
  if (cookieRole) {
    localStorage.setItem(KEY, cookieRole);
  }
  return cookieRole;
}
