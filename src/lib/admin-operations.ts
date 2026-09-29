import type { Role } from "./auth";
import { getStore } from "./store";

export type AdminOperationResult<T = undefined> =
  | { ok: true; value: T }
  | { ok: false; status: 401 | 403 | 404 | 409 | 400; error: string };

function requireRole(role: Role | null, adminOnly = false): AdminOperationResult {
  if (!role) return { ok: false, status: 401, error: "Authentication required" };
  if (adminOnly && role !== "admin") {
    return { ok: false, status: 403, error: "Admin role required" };
  }
  return { ok: true, value: undefined };
}

export function createCatalogue(
  role: Role | null,
  title: string,
  slug: string,
): AdminOperationResult<{ id: string; title: string; slug: string }> {
  const access = requireRole(role);
  if (!access.ok) return access;
  const normalizedTitle = title.trim();
  const normalizedSlug = slug.trim();
  if (!normalizedTitle || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
    return { ok: false, status: 400, error: "A title and valid slug are required" };
  }

  const store = getStore();
  if (store.catalogues.some((catalogue) => catalogue.slug === normalizedSlug)) {
    return { ok: false, status: 409, error: "Slug already exists" };
  }
  const catalogue = {
    id: `cat-new-${store.nextCatalogueNumber++}`,
    title: normalizedTitle,
    slug: normalizedSlug,
    status: "draft" as const,
    validUntil: null,
    productIds: [],
  };
  store.catalogues.push(catalogue);
  return { ok: true, value: { id: catalogue.id, title: catalogue.title, slug: catalogue.slug } };
}

export function publishCatalogue(role: Role | null, id: string): AdminOperationResult<{ id: string }> {
  const access = requireRole(role, true);
  if (!access.ok) return access;
  const catalogue = getStore().catalogues.find((item) => item.id === id);
  if (!catalogue) return { ok: false, status: 404, error: "Catalogue not found" };
  catalogue.status = "published";
  return { ok: true, value: { id: catalogue.id } };
}

export function deleteCatalogue(role: Role | null, id: string): AdminOperationResult<{ id: string }> {
  const access = requireRole(role, true);
  if (!access.ok) return access;
  const store = getStore();
  const index = store.catalogues.findIndex((item) => item.id === id);
  if (index < 0) return { ok: false, status: 404, error: "Catalogue not found" };
  store.catalogues.splice(index, 1);
  return { ok: true, value: { id } };
}