/**
 * API client for the Go backend.
 * All admin endpoints require a JWT token stored in localStorage.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  title: string;
  description: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface Design {
  id: number;
  title: string;
  year: string;
  category_id: number | null;
  image_url: string;
  html_path: string;
  slug: string;
  created_at: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  technologies: string; // JSON array serialized
  image_url: string;
  external_url: string;
  sort_order: number;
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    // Token expirado o inválido → limpiar sesión y redirigir al login
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("admin_token");
      window.location.href = "/admin/login";
      return undefined as unknown as T;
    }
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function adminLogin(password: string): Promise<{ token: string }> {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  return handleResponse(res);
}

export function adminLogout() {
  localStorage.removeItem("admin_token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/api/categories`);
  return handleResponse(res);
}

export async function getDesigns(categoryId?: number): Promise<Design[]> {
  const url = categoryId
    ? `${API_BASE}/api/designs?categoryId=${categoryId}`
    : `${API_BASE}/api/designs`;
  const res = await fetch(url);
  return handleResponse(res);
}

export async function getProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/api/projects`);
  return handleResponse(res);
}

// ── Admin: Categories ─────────────────────────────────────────────────────────

export async function adminGetCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE}/api/admin/categories`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function adminCreateCategory(
  data: Partial<Category>
): Promise<Category> {
  const res = await fetch(`${API_BASE}/api/admin/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function adminUpdateCategory(
  id: number,
  data: Partial<Category>
): Promise<Category> {
  const res = await fetch(`${API_BASE}/api/admin/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function adminDeleteCategory(
  id: number,
  force = false
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/admin/categories/${id}${force ? "?force=true" : ""}`,
    { method: "DELETE", headers: authHeaders() }
  );
  return handleResponse(res);
}

// ── Admin: Designs ────────────────────────────────────────────────────────────

export async function adminGetDesigns(): Promise<Design[]> {
  const res = await fetch(`${API_BASE}/api/admin/designs`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function adminCreateDesign(formData: FormData): Promise<Design> {
  const res = await fetch(`${API_BASE}/api/admin/designs`, {
    method: "POST",
    headers: authHeaders(), // do NOT set Content-Type — let browser set multipart boundary
    body: formData,
  });
  return handleResponse(res);
}

export async function adminUpdateDesign(
  id: number,
  formData: FormData
): Promise<Design> {
  const res = await fetch(`${API_BASE}/api/admin/designs/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: formData,
  });
  return handleResponse(res);
}

export async function adminDeleteDesign(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/designs/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ── Admin: Projects ───────────────────────────────────────────────────────────

export async function adminGetProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/api/admin/projects`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function adminCreateProject(formData: FormData): Promise<Project> {
  const res = await fetch(`${API_BASE}/api/admin/projects`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  return handleResponse(res);
}

export async function adminUpdateProject(
  id: number,
  formData: FormData
): Promise<Project> {
  const res = await fetch(`${API_BASE}/api/admin/projects/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: formData,
  });
  return handleResponse(res);
}

export async function adminDeleteProject(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/projects/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
}
