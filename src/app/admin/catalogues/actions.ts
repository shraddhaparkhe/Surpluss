"use server";

import { cookies } from "next/headers";
import { roleFromSession } from "@/lib/auth";
import {
  createCatalogue,
  deleteCatalogue,
  publishCatalogue,
} from "@/lib/admin-operations";

async function currentRole() {
  return roleFromSession((await cookies()).get("catalogue_session")?.value);
}

export async function createCatalogueAction(title: string, slug: string) {
  return createCatalogue(await currentRole(), title, slug);
}

export async function publishCatalogueAction(id: string) {
  return publishCatalogue(await currentRole(), id);
}

export async function deleteCatalogueAction(id: string) {
  return deleteCatalogue(await currentRole(), id);
}